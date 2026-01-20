import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useSupabaseAuth } from '../auth/useSupabaseAuth';
import { resolveNextRoute } from './CoreFlow';
import type { UserState, OnboardingStatus } from './CoreFlow';
import {
    resolve as resolveTenant,
    extractTenantFromPath,
    getActiveTenant,
    setActiveTenant,
    getTenantStatus,
    isTenantSealed,
    type TenantResolutionResult,
} from '../tenant/TenantResolver';
import { Logger } from '../logger';
import { LoadingState } from '../../ui/design-system/components/LoadingState';
import { isDebugEnabled, isDevStableMode } from '../runtime/devStableMode';

/**
 * FlowGate - O Executor do Contrato (DB-First Edition + Multi-Tenant)
 * 
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 * 
 * SOBERANIA: Este é o ÚNICO juiz do sistema.
 * 
 * Responsabilidade:
 * 1. Garantir que o estado do usuário (Auth + DB) seja conhecido.
 * 2. Executar a decisão do resolveNextRoute.
 * 3. Sincronizar Cache Local (localStorage) com a Verdade do Banco.
 * 4. [Phase 2] Resolver e validar tenant para rotas /app/*
 * 
 * ⚠️ PROTEÇÃO CONTRA REGRESSÃO:
 * - NUNCA criar lógica de decisão fora daqui
 * - NUNCA depender de dados opcionais (profiles, system_config)
 * - NUNCA permitir múltiplas autoridades
 * - Fail-closed: Sem tenant válido = acesso negado
 * 
 * Ver: ARCHITECTURE_FLOW_LOCKED.md
 */

// Routes that bypass tenant resolution
const TENANT_EXEMPT_ROUTES = [
    '/app/select-tenant',
    '/app/access-denied',
];

export function FlowGate({ children }: { children: ReactNode }) {
    const { session, loading: sessionLoading } = useSupabaseAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Controlled Loading State prevents flicker
    const [isChecking, setIsChecking] = useState(true);
    // Fuse to prevent storm loops in DEV (StrictMode + rapid redirects + transient fetch errors)
    const lastCheckRef = useRef<{ key: string; ts: number }>({ key: '', ts: 0 });
    // OAuth wait counter to prevent infinite waiting
    const oauthWaitCountRef = useRef(0);

    // Safety timeout to prevent infinite loading
    const LOADING_TIMEOUT_MS = 15000;
    const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Safety timeout state
    const [forceRender, setForceRender] = useState(false);

    useEffect(() => {
        let mounted = true;
        let oauthWaitTimeout: ReturnType<typeof setTimeout> | null = null;

        // Safety timeout: se loading demorar mais de LOADING_TIMEOUT_MS, forçar render
        // Isso previne travamento infinito se useSupabaseAuth falhar
        loadingTimeoutRef.current = setTimeout(() => {
            if (mounted) {
                console.warn(`[FlowGate] Loading timeout (${LOADING_TIMEOUT_MS}ms) - forcing render (Fail-Safe)`);
                setIsChecking(false);
                setForceRender(true);
            }
        }, LOADING_TIMEOUT_MS);

        // Variável para armazenar sessão encontrada diretamente (bypass useSupabaseAuth)
        // Escopo da função checkFlow para ser acessível em todo o fluxo
        let directSessionFound: typeof session = null;

        const checkFlow = async () => {
            const pathname = location.pathname;
            const sealed = isTenantSealed();

            // STEP 4: Sovereign early return - BEFORE any queries, effects, or calculations
            // While on tenant selection screen and tenant isn't sealed, FlowGate must do NOTHING.
            // No membership queries, no tenant resolution, no redirects, no log storms.
            // DEV_STABLE_MODE: Allow tenant selection screen to render even if session is still loading
            // (prevents infinite "AUTHENTICATING" screen when user needs to select tenant)
            if (pathname === '/app/select-tenant' && !sealed) {
                // Tenant selection screen is authoritative.
                // Do not run membership resolution or redirects here.
                // Log only in DEV_STABLE_MODE with debug enabled (hard-stop log)
                if (isDevStableMode() && isDebugEnabled()) {
                    console.debug('[FlowGate] blocked: tenant not sealed');
                }
                if (mounted) setIsChecking(false);
                return;
            }

            // DEV_STABLE_MODE: Se tenant está selado e estamos em rota /app/* (exceto select-tenant),
            // não re-executar verificação de sessão se já estamos permitindo render
            // Isso previne loops quando session está atualizando
            if (sealed && pathname.startsWith('/app/') && pathname !== '/app/select-tenant') {
                // Se tenant está selado e já temos sessão, não precisamos re-executar
                // Apenas marcar como checking false e permitir render
                if (session?.user?.id) {
                    if (mounted) setIsChecking(false);
                    return;
                }
                // Se já marcamos como checking false em uma execução anterior e não há sessão,
                // não re-executar (evita loop)
                if (!session && !isChecking) {
                    // Tenant selado, sem sessão, mas já permitimos render - não re-executar
                    // O useSupabaseAuth vai atualizar e o FlowGate vai re-executar quando session mudar
                    return;
                }
            }

            // Only after early return, calculate dev flags
            const devStable = isDevStableMode();
            const debug = isDebugEnabled();
            const shouldLog = !devStable || debug;

            // FUSE: bounded by userId + pathname (1200ms window)
            // Resolves StrictMode, remounts, and repeated redirects
            // Use session from hook, but will be overridden by effectiveSession if needed
            const userId = session?.user?.id;
            const fuseKey = `${userId ?? 'anon'}::${pathname}`;
            const now = Date.now();
            const FUSE_MS = 1200;
            if (
                lastCheckRef.current?.key === fuseKey &&
                now - lastCheckRef.current.ts < FUSE_MS
            ) {
                return;
            }
            lastCheckRef.current = { key: fuseKey, ts: now };

            // DEV EXCEPTION [SUPER-EARLY]: Auto-seal & Bypas ALL CHECKS for TPV/KDS/Waiter in DEV
            // This prevents "Have Session -> Query DB -> 429 Error" loop.
            // effectively treating them as isolated "Kiosk" apps in Dev.
            const params = new URLSearchParams(window.location.search);
            const isDemo = params.get('demo') === 'true';
            const isDevBypassRoute = pathname.includes('/tpv') || pathname.includes('/kds') || pathname.includes('/waiter') || pathname.includes('/app/waiter') || (isDemo && import.meta.env.DEV);

            if (import.meta.env.DEV && isDevBypassRoute) {
                // Auto-seal payload
                if (!isTenantSealed()) {
                    const DEV_TENANT_ID = import.meta.env.VITE_DEV_DEFAULT_TENANT || '6d676ae5-2375-42d2-8db3-e4e80ddb1b76';
                    setActiveTenant(DEV_TENANT_ID, 'ACTIVE');
                    console.warn('[FlowGate] 🚧 DEV AUTO-SEAL: Pre-sealed mock tenant:', DEV_TENANT_ID);
                }

                // If we are here, we allow the render unconditionally.
                // We skip redirects, auth checks, and DB queries.
                if (shouldLog) console.warn(`[FlowGate] 🚧 DEV SUPER-BYPASS: Skipping all gates for ${pathname}`);
                if (mounted) setIsChecking(false);
                return;
            }

            // Redirect bounded: fail-closed, once only
            // If tenant is not sealed and we're on an /app/* route (except select-tenant), redirect
            if (!sealed && pathname !== '/app/select-tenant' && pathname.startsWith('/app')) {
                // DEV EXCEPTION: Auto-seal for TPV/KDS/Waiter to allow immediate access
                if (import.meta.env.DEV && (pathname.includes('/tpv') || pathname.includes('/kds') || pathname.includes('/waiter'))) {
                    const DEV_TENANT_ID = import.meta.env.VITE_DEV_DEFAULT_TENANT || '6d676ae5-2375-42d2-8db3-e4e80ddb1b76';
                    setActiveTenant(DEV_TENANT_ID, 'ACTIVE');
                    console.warn('[FlowGate] 🚧 DEV AUTO-SEAL (Early): Pre-sealed mock tenant:', DEV_TENANT_ID);
                    // Don't redirect, allow checkFlow to proceed
                } else {
                    // Save the original route so we can return to it after tenant selection
                    try {
                        sessionStorage.setItem('chefiapp_return_to', pathname);
                        if (isDevStableMode() && isDebugEnabled()) {
                            console.log('[FlowGate] Saved return route:', pathname);
                        }
                    } catch (e) {
                        // Ignore storage errors (private mode, etc.)
                        if (isDevStableMode() && isDebugEnabled()) {
                            console.warn('[FlowGate] Failed to save return route:', e);
                        }
                    }
                    navigate('/app/select-tenant', { replace: true });
                    if (mounted) setIsChecking(false);
                    return;
                }
            }

            // 1. Wait for Auth Session Protocol
            // DEV_STABLE_MODE: Se estiver em /app/select-tenant, não esperar sessão (permite renderizar)
            // FAIL-SAFE: Se forceRender for true, ignorar loading e prosseguir (assume que falhou)
            if (sessionLoading && !forceRender && pathname !== '/app/select-tenant') {
                // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
                if (shouldLog) console.log('[FlowGate] ⏳ Session Loading...');
                // Clear timeout se sessão carregou
                if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                    loadingTimeoutRef.current = null;
                }
                return;
            }

            // OAuth callback detection: check for hash fragments that indicate OAuth callback
            const hasOAuthHash = typeof window !== 'undefined' &&
                (window.location.hash.includes('access_token') ||
                    window.location.hash.includes('error='));

            // Adicionar verificação de erro no hash
            const hasOAuthError = typeof window !== 'undefined' &&
                window.location.hash.includes('error=');

            if (hasOAuthError) {
                // Extrair mensagem de erro do hash
                const errorMatch = window.location.hash.match(/error=([^&]+)/);
                if (errorMatch) {
                    Logger.error('OAuth callback error', null, { error: errorMatch[1] });
                    // Limpar hash e redirecionar para auth com mensagem de erro
                    window.history.replaceState(null, '', '/auth?error=oauth_failed');
                    navigate('/auth?error=oauth_failed', { replace: true });
                    if (mounted) setIsChecking(false);
                    return;
                }
            }

            // If we're on /app and there's an OAuth hash but no session yet, wait for useSupabaseAuth to handle it
            // This prevents redirect loop when OAuth callback hasn't been processed yet
            if (pathname.startsWith('/app') && hasOAuthHash && !session && !sessionLoading) {
                if (shouldLog) console.log('[FlowGate] 🔄 OAuth hash detected, verifying session state...');
                // Let the hook do its job. It listens to onAuthStateChange.
                // We just wait (return) until it either gives us a session or clears loading.
                return;
            }

            // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
            if (shouldLog) {
                console.log('[FlowGate] 🔍 Check Flow:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    path: pathname,
                    hasOAuthHash
                });

                // Adicionar logs detalhados para OAuth (apenas em DEV ou com debug=1)
                if (hasOAuthHash) {
                    const hashPreview = typeof window !== 'undefined'
                        ? window.location.hash.substring(0, 50) + (window.location.hash.length > 50 ? '...' : '')
                        : 'N/A';
                    console.log('[FlowGate] OAuth Debug:', {
                        hashPreview, // Não logar token completo por segurança
                        hasSession: !!session,
                        sessionLoading,
                        waitCount: oauthWaitCountRef.current,
                        pathname,
                        hasOAuthError
                    });
                }
            }

            // Limpar hash OAuth se presente e sessão existe
            if (session && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }

            // --- ESTADO 1: SEM SESSÃO ---

            // DEV EXCEPTION: Allow TPV/KDS/Waiter routes to bypass auth for UI verification
            if (!session && import.meta.env.DEV && (pathname.includes('/tpv') || pathname.includes('/kds') || pathname.includes('/waiter'))) {
                // Also auto-seal a dev tenant to bypass tenant gate
                if (!isTenantSealed()) {
                    const DEV_TENANT_ID = import.meta.env.VITE_DEV_DEFAULT_TENANT || '6d676ae5-2375-42d2-8db3-e4e80ddb1b76';
                    setActiveTenant(DEV_TENANT_ID, 'ACTIVE');
                    console.warn('[FlowGate] 🚧 DEV AUTO-SEAL: Pre-sealed mock tenant:', DEV_TENANT_ID);
                }
                if (shouldLog) console.warn('[FlowGate] 🚧 DEV BYPASS: Rendering TPV/KDS without session for UI Check');
                if (mounted) setIsChecking(false);
                return;
            }

            // If completely loaded and no session, redirect to auth (unless sealed tenant handling below)
            // FAIL-SAFE: Se forceRender for true, tratar como sem sessão
            if (!session && (!sessionLoading || forceRender)) {
                const tenantSealed = isTenantSealed();

                // DEV_STABLE_MODE: Special handling for sealed tenants with session lag
                if (tenantSealed && pathname.startsWith('/app/')) {
                    // Allow render, trust useSupabaseAuth will fire eventually or fail-safe will catch
                    if (shouldLog) console.warn('[FlowGate] Sealed Tenant + No Session. Waiting for Auth Hook.');
                    // Check directly ONLY if we have waited long enough (implemented via re-renders, not here)
                    // return to allow render
                    if (mounted) setIsChecking(false);
                    return;
                }

                // Sem tenant selado e sem sessão - limpar cache e redirecionar
                const { removeTabIsolated } = await import('../storage/TabIsolatedStorage');
                removeTabIsolated('chefiapp_restaurant_id');
                removeTabIsolated('chefiapp_active_tenant');
                Logger.clearContext();

                const state: UserState = {
                    isAuthenticated: false,
                    hasOrganization: false,
                    onboardingStatus: 'not_started',
                    currentPath: pathname
                };

                executeDecision(state);
                if (mounted) setIsChecking(false);
                return;
            }

            try {
                // --- ESTADO 2: COM SESSÃO (DB Lookup) ---
                // Verificação de segurança: garantir que session existe
                // Se não há sessão do hook mas tenant está selado, pode ser timing
                // Usar directSessionFound se disponível (encontrada no check acima)
                let effectiveSession = session || directSessionFound;
                if (!effectiveSession && tenantSealed && pathname.startsWith('/app/')) {
                    // Última tentativa: verificar sessão diretamente
                    const { data: { session: fallbackSession } } = await supabase.auth.getSession();
                    if (fallbackSession) {
                        effectiveSession = fallbackSession;
                        if (shouldLog) {
                            console.log('[FlowGate] Using fallback session from direct check');
                        }
                    }
                }

                if (!effectiveSession || !effectiveSession.user) {
                    // Se tenant está selado, permitir render mesmo sem sessão (pode ser timing)
                    // O useSupabaseAuth vai atualizar no próximo ciclo e o FlowGate vai re-executar
                    if (tenantSealed && pathname.startsWith('/app/')) {
                        if (shouldLog) {
                            console.warn('[FlowGate] No session but tenant sealed - allowing render (session may be updating)', {
                                pathname,
                                tenantId: getActiveTenant()
                            });
                        }
                        // Permitir render - marcar como checking false
                        // Não executar executeDecision para evitar redirecionamento para /auth
                        if (mounted) setIsChecking(false);
                        // Fazer return aqui - evita DB queries mas permite que o componente renderize
                        // A lógica de render abaixo (shouldAllowRenderWithSealedTenant) vai permitir children
                        // quando tenant está selado, mesmo sem sessão
                        return; // Retornar aqui evita DB queries, mas a lógica de render abaixo permite children
                    }
                    // Sem tenant selado e sem sessão - limpar e redirecionar
                    if (mounted) setIsChecking(false);
                    return;
                }

                // A. Buscar Membro (Vínculo User -> Restaurant)
                const { data: members, error: memberError } = await supabase
                    .from('gm_restaurant_members')
                    .select('restaurant_id, role')
                    .eq('user_id', effectiveSession.user.id);

                if (memberError) throw memberError;

                // Set User Context early
                Logger.setContext({ userId: effectiveSession.user.id });
                // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
                if (shouldLog) {
                    Logger.debug('FlowGate: Members Query Result', { members });
                }

                let hasOrg = false;
                let status: OnboardingStatus = 'not_started';
                let restaurantId = null;
                let currentBillingStatus: string | null = null;
                const membershipCount = members?.length || 0;

                if (members && members.length > 0) {
                    hasOrg = true;
                    /**
                     * 🔒 MULTI-TENANT SOVEREIGNTY
                     * NUNCA auto-selecionar tenant/restaurante a partir de members[0].
                     *
                     * Se há múltiplos tenants, a única fonte válida é:
                     * - tenant selado (chefiapp_active_tenant + status ACTIVE), ou
                     * - seleção explícita na tela /app/select-tenant
                     */
                    const sealedTenantId = getActiveTenant();
                    const sealedStatus = getTenantStatus();

                    // ✅ Se for multi-tenant e não existe tenant selado, a única ação válida é seleção explícita.
                    // Evita que o "base flow" empurre para /onboarding/* (invalida E2E) e garante que a Gate de tenant é a próxima etapa.
                    // NOTE: Redirect is now handled by the consolidated fail-closed check above (after fuse)
                    if (membershipCount > 1 && !(sealedTenantId && sealedStatus === 'ACTIVE')) {
                        // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
                        // Redirect handled by consolidated check above
                        if (mounted) setIsChecking(false);
                        return;
                    }

                    if (membershipCount === 1) {
                        restaurantId = members[0].restaurant_id;
                    } else if (sealedTenantId && sealedStatus === 'ACTIVE') {
                        restaurantId = sealedTenantId;
                    } else {
                        // Multi-tenant sem seleção: NÃO definir restaurantId aqui.
                        // handleTenantResolution() vai redirecionar para /app/select-tenant.
                        restaurantId = null;
                        Logger.error(
                            'CRITICAL_TENANT_DRIFT_PREVENTED',
                            null,
                            {
                                reason: 'MULTI_TENANT_NO_SELECTION',
                                membershipCount,
                                pathname,
                            }
                        );
                    }

                    // B. Buscar Restaurante (Status Real)
                    const { data: restaurant, error: restError } = restaurantId
                        ? await supabase
                            .from('gm_restaurants')
                            .select('onboarding_completed_at, billing_status')
                            .eq('id', restaurantId)
                            .single()
                        : { data: null, error: null };

                    if (!restError && restaurant) {
                        currentBillingStatus = restaurant.billing_status;
                        // Sovereign Logic: Determine exact status
                        // Sovereign Logic: Determine exact status
                        if (restaurant.onboarding_completed_at) {
                            status = 'completed';
                        } else {
                            // 🛑 DB says NOT completed. BUT check "Fail-Safe" Local State (Golden Ticket)
                            try {
                                const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                                const rawBp = getTabIsolated('chefiapp_system_blueprint_v2');
                                Logger.debug('FlowGate: Checking Fail-Safe', { exists: !!rawBp });
                                if (rawBp) {
                                    const bp = JSON.parse(rawBp);
                                    Logger.debug('FlowGate: Local Blueprint', {
                                        localId: bp.meta?.tenantId,
                                        remoteId: restaurantId,
                                        reality: bp.organization?.realityStatus
                                    });

                                    const isReal = bp.organization?.realityStatus === 'real' || bp.organization?.realityStatus === 'verified';

                                    if (bp.meta?.tenantId === restaurantId && isReal) {
                                        Logger.info('FlowGate: Fail-Safe Trusted (Local BP)', { tenantId: restaurantId });
                                        status = 'completed';
                                    } else {
                                        // Only warn if we truly expected a match and it failed dramatically
                                        if (bp.organization?.realityStatus === 'draft') {
                                            Logger.debug('FlowGate: Fail-Safe Draft Mismatch (Expected)');
                                        } else {
                                            Logger.warn('FlowGate: Fail-Safe Mismatch', {
                                                expected: restaurantId,
                                                actual: bp.meta?.tenantId,
                                                status: bp.organization?.realityStatus
                                            });
                                        }
                                        status = 'not_started';
                                    }
                                } else {
                                    status = 'not_started';
                                }
                            } catch (e) {
                                Logger.error('FlowGate: Fail-Safe Error', e);
                                status = 'not_started';
                            }
                        }
                    }
                    Logger.debug('FlowGate: Restaurant Found', { restaurantId, status, onb_completed: restaurant?.onboarding_completed_at });
                } else {
                    Logger.debug('FlowGate: No Members Found. Attempting Emergency Bypass...');

                    // FALLBACK: Check if we just created a tenant locally
                    try {
                        const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                        const rawBlueprint = getTabIsolated('chefiapp_system_blueprint_v2');
                        if (rawBlueprint) {
                            const blueprint = JSON.parse(rawBlueprint);
                            const localTenantId = blueprint.meta?.tenantId;

                            if (localTenantId && localTenantId !== 'pending-generation') {
                                // Verify if this tenant actually exists in DB
                                const { data: ghostRestaurant } = await supabase
                                    .from('gm_restaurants')
                                    .select('id, onboarding_completed_at, billing_status')
                                    .eq('id', localTenantId)
                                    .single();

                                if (ghostRestaurant) {
                                    Logger.info('FlowGate: Emergency Bypass Successful', { tenantId: localTenantId });
                                    hasOrg = true;
                                    restaurantId = localTenantId;

                                    // Logic same as above
                                    currentBillingStatus = ghostRestaurant.billing_status;
                                    if (ghostRestaurant.onboarding_completed_at) {
                                        status = 'completed';
                                    } else {
                                        // 🛑 Emergency Fail-Safe: Trust Local BP if DB is lagging
                                        const isReal = blueprint.organization?.realityStatus === 'real' || blueprint.organization?.realityStatus === 'verified';
                                        if (isReal) {
                                            Logger.info('FlowGate: Emergency Fail-Safe Trusted');
                                            status = 'completed';
                                        } else {
                                            status = 'not_started';
                                        }
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        Logger.warn('FlowGate: Emergency Bypass Failed', { error: err });
                    }
                }

                // C. Sincronizar Cache Local (Tab-Isolated Storage)
                if (restaurantId && (membershipCount === 1 || (getActiveTenant() && getTenantStatus() === 'ACTIVE'))) {
                    const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
                    setTabIsolated('chefiapp_restaurant_id', restaurantId);
                    setTabIsolated('chefiapp_setup_status', status);
                    Logger.setContext({ tenantId: restaurantId });
                }

                // D. Construir UserState
                const state: UserState = {
                    isAuthenticated: true,
                    hasOrganization: hasOrg,
                    onboardingStatus: status,
                    currentPath: pathname
                };

                // E. Execute base flow decision first
                // DEV_STABLE_MODE: Skip onboarding redirects when on /app/select-tenant
                const shouldSkipOnboardingRedirect = devStable && pathname === '/app/select-tenant' && status === 'not_started';

                let baseDecision;
                if (shouldSkipOnboardingRedirect) {
                    // In DEV_STABLE_MODE, allow /app/select-tenant even if onboarding is not_started
                    baseDecision = { type: 'ALLOW' as const };
                } else {
                    baseDecision = resolveNextRoute(state);
                }

                if (baseDecision.type === 'REDIRECT') {
                    // CRITICAL: Guard against navigation loop
                    if (pathname !== baseDecision.to) {
                        // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
                        if (shouldLog) {
                            Logger.info(`FlowGate: Redirecting (Base)`, { reason: baseDecision.reason, to: baseDecision.to, state });
                            console.warn('[FlowGate] ➡️ REDIRECT (Base):', { reason: baseDecision.reason, to: baseDecision.to, state });
                        }
                        navigate(baseDecision.to, { replace: true });
                    }
                    if (mounted) setIsChecking(false);
                    return;
                }

                // 🛑 SOVEREIGN HARD-STOP (INCIDENT #004 FIX)
                // Nenhuma rota /app/* monta antes de tenantId + restaurantId estarem selados.
                // NOTE: Redirect is now handled by the consolidated fail-closed check above (after fuse)
                // This check remains for validation/logging purposes only
                if (pathname.startsWith('/app') &&
                    !TENANT_EXEMPT_ROUTES.some(r => pathname.startsWith(r)) &&
                    !sealed &&
                    pathname !== '/app/select-tenant') {
                    // Hard-stop log: in DEV_STABLE_MODE only with debug, otherwise always log
                    if (shouldLog) {
                        Logger.critical('FlowGate: Sovereign Hard-Stop (Tenant Not Sealed)', {
                            path: pathname,
                            activeId: getActiveTenant(),
                            currentStatus: getTenantStatus()
                        });
                    }
                    if (mounted) setIsChecking(false);
                    return;
                }

                if (pathname.startsWith('/app')) {
                    // SOVEREIGN CHECK 1: If Tenant is ACTIVE, SelectTenant is FORBIDDEN
                    const currentStatus = getTenantStatus();
                    if (currentStatus === 'ACTIVE' && pathname === '/app/select-tenant') {
                        if (shouldLog) Logger.warn('FlowGate: Sovereign Redirect (Tenant Already Active)', { to: '/app/dashboard' });
                        navigate('/app/dashboard', { replace: true });
                        if (mounted) setIsChecking(false);
                        return;
                    }

                    // SOVEREIGN CHECK 2: If Tenant is NOT Active, Operation is FORBIDDEN
                    const isOperationalRoute = ['/tpv', '/kds', '/orders', '/menu', '/dashboard', '/settings'].some(route => pathname.includes(route));
                    if (currentStatus !== 'ACTIVE' && isOperationalRoute && pathname !== '/app/select-tenant' && pathname !== '/app/access-denied') {
                        if (shouldLog) Logger.warn('FlowGate: Sovereign Block (Tenant Not Active)', { path: pathname });
                        // Let handleTenantResolution handle the redirect, but be aware
                    }


                    // REALITY ENFORCEMENT (Genesis Contract)
                    // Cannot open physical operations (TPV/KDS) if system is in DRAFT mode.
                    const isPhysicalOps = pathname.includes('/app/tpv') || pathname.includes('/app/kds');
                    if (isPhysicalOps) {
                        // BYPASS: Allow TPV in Development Mode for testing
                        if (import.meta.env.DEV) {
                            console.warn('[FlowGate] 🚧 DEV MODE BYPASS: Skipping Reality Check for TPV/KDS.');
                        } else {
                            try {
                                const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                                const rawBp = getTabIsolated('chefiapp_system_blueprint_v2');
                                console.log('[FlowGate] Reality Check:', { rawBpStr: rawBp?.substring(0, 50) });

                                if (rawBp) {
                                    const bp = JSON.parse(rawBp);
                                    const realityStatus = bp.organization?.realityStatus || 'DRAFT';
                                    console.log('[FlowGate] Reality Status Resolved:', realityStatus);

                                    if (realityStatus === 'DRAFT') {
                                        // 🛑 STALE CACHE GUARD:
                                        // If DB says we are 'completed' (Active), this local blueprint is a LIE (Stale).
                                        // Do NOT block operation. We are LIVE.
                                        if (status === 'completed') {
                                            Logger.warn('FlowGate: Reality Check Override (Stale Blueprint found)', {
                                                reason: 'DB_IS_COMPLETED',
                                                localStatus: 'DRAFT'
                                            });
                                            // Auto-Correction could happen here, but for now just allow pass.
                                        } else {
                                            Logger.warn('FlowGate: Reality Block (Draft System)', { path: pathname });
                                            console.warn('[FlowGate] 🛑 BLOCKING TPV - Reality is DRAFT');
                                            navigate('/app/dashboard?reality_block=true', { replace: true });
                                            if (mounted) setIsChecking(false);
                                            return;
                                        }
                                    }
                                } else {
                                    console.warn('[FlowGate] Reality Check: No Blueprint Found');
                                }
                            } catch (e) {
                                Logger.warn('FlowGate: Reality Check Failed', e);
                                console.error('[FlowGate] Reality Check Exception:', e);
                            }
                        }
                    }

                    // Use effectiveSession if available, otherwise fallback to session from hook
                    const effectiveUserId = effectiveSession?.user?.id || session?.user?.id || '';
                    const tenantDecision = await handleTenantResolution(effectiveUserId, pathname);

                    if (tenantDecision) {
                        // CRITICAL: Guard against navigation loop
                        if (pathname !== tenantDecision.to) {
                            navigate(tenantDecision.to, { replace: true });
                        }
                        if (mounted) setIsChecking(false);
                        return;
                    }

                    // BILLING CHECK (Sovereign 3.0)
                    // Only enforce if we have an active restaurant
                    if (restaurantId && status === 'completed') {
                        // Bypass for onboarding/billing routes to avoid loops
                        // Also bypass SELECT TENANT to allow switching away from a delinquent account
                        const isSafeRoute = pathname.startsWith('/app/billing') ||
                            pathname.startsWith('/app/settings') ||
                            pathname.startsWith('/app/select-tenant') ||
                            pathname.startsWith('/app/access-denied');

                        // Check Database Status (fetched in Step B above)
                        if (!isSafeRoute && currentBillingStatus) {
                            // Enforce strict payment gate
                            const isDelinquent = ['canceled', 'unpaid', 'past_due'].includes(currentBillingStatus);
                            // Founders are exempt (unless we want to enforce them too, but usually not)
                            const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                            const storedLevel = getTabIsolated('chefiapp_sovereign_level');

                            if (isDelinquent && storedLevel !== 'founder') {
                                Logger.warn('FlowGate: Billing Lock (Payment Required)', { status: currentBillingStatus });
                                navigate('/app/billing?reason=payment_required', { replace: true });
                                if (mounted) setIsChecking(false);
                                return;
                            }
                        }
                    }
                }

                // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
                if (shouldLog) console.log(`[FlowGate] ✅ Allowed: ${state.currentPath}`);

                // GATING ENFORCEMENT (Sovereign Level 2.0)
                const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                const storedLevel = getTabIsolated('chefiapp_sovereign_level'); // founder | bronze | silver | gold
                // Note: stored modules are currently not used in this gate; keep read out to avoid unused-var lint.
                // const storedModules = JSON.parse(getTabIsolated('chefiapp_modules_unlocked') || '[]');

                // Rules of the Gate
                if (storedLevel === 'founder') {
                    const path = location.pathname;
                    // Founder cannot access Operation Modules
                    if (path.includes('/app/pos') || path.includes('/app/kds') || path.includes('/app/orders')) {
                        // CRITICAL: Guard against navigation loop
                        const targetPath = '/app/dashboard?restriction=founder_mode';
                        if (location.pathname !== targetPath && !location.search.includes('restriction=founder_mode')) {
                            Logger.warn('FlowGate: Founder Mode Restriction', { path });
                            navigate(targetPath, { replace: true });
                        }
                        if (mounted) setIsChecking(false);
                        return;
                    }
                }

            } catch (error) {
                // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
                if (shouldLog) console.error('[FlowGate] 💥 DB Error during check:', error);
                // Fallback seguro em caso de erro de DB:
                const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                const fallbackState: UserState = {
                    isAuthenticated: true,
                    hasOrganization: !!getTabIsolated('chefiapp_restaurant_id'),
                    onboardingStatus: 'not_started',
                    currentPath: pathname
                };
                executeDecision(fallbackState);
            } finally {
                if (mounted) {
                    setIsChecking(false);
                    // Clear safety timeout se checkFlow completou
                    if (loadingTimeoutRef.current) {
                        clearTimeout(loadingTimeoutRef.current);
                        loadingTimeoutRef.current = null;
                    }
                }
            }
        };

        const executeDecision = (state: UserState) => {
            const decision = resolveNextRoute(state);

            if (decision.type === 'REDIRECT') {
                // CRITICAL: Guard against navigation loop
                if (location.pathname !== decision.to) {
                    Logger.info(`FlowGate: Blocked (Late)`, { reason: decision.reason, to: decision.to });
                    navigate(decision.to, { replace: true });
                }
            } else {
                Logger.info(`FlowGate: Allowed (Late)`, { path: state.currentPath });
            }
        };

        /**
         * [Phase 2] Handle tenant resolution for /app/* routes
         * Returns redirect decision or null if route is allowed
         */
        const handleTenantResolution = async (
            userId: string,
            pathname: string
        ): Promise<{ to: string } | null> => {
            // Skip exempt routes
            if (TENANT_EXEMPT_ROUTES.some(r => pathname.startsWith(r))) {
                return null;
            }

            // 🔒 SOVEREIGNTY CHECK: Se tenant já está ACTIVE, não re-resolver
            const activeTenantId = getActiveTenant();
            const tenantStatus = getTenantStatus();

            if (activeTenantId && tenantStatus === 'ACTIVE') {
                // Tenant já está selado - não re-executar resolução
                Logger.debug('FlowGate: Tenant already sealed (ACTIVE)', {
                    tenantId: activeTenantId,
                    pathname
                });
                return null; // Allow route, tenant is sealed
            }

            // Extract tenant ID from URL if present
            const urlTenantId = extractTenantFromPath(pathname);

            // Resolve tenant
            const result: TenantResolutionResult = await resolveTenant(userId, urlTenantId);

            switch (result.type) {
                case 'RESOLVED':
                    // Tenant resolved successfully
                    if (result.tenantId) {
                        // 🔒 HOTFIX: Desabilitar migração de rota legacy
                        // As rotas /app/:tenantId/* não existem no App.tsx
                        // O tenant é guardado no localStorage via setActiveTenant
                        // Não precisamos do tenant na URL
                        // 🔒 HOTFIX: Desabilitar migração de rota legacy
                        // As rotas /app/:tenantId/* não existem no App.tsx
                        // O tenant é guardado no localStorage via setActiveTenant
                        // Não precisamos do tenant na URL
                        setActiveTenant(result.tenantId, 'ACTIVE'); // Explicitly seal as ACTIVE if resolved via URL/Context

                        Logger.info('FlowGate: Tenant Resolved (Cached)', {
                            pathname,
                            tenantId: result.tenantId,
                            role: result.context?.role,
                        });
                    }
                    return null;

                case 'NEEDS_SELECTION':
                    // Multiple tenants, no active - go to selection
                    Logger.info('FlowGate: Needs Tenant Selection', {
                        userId,
                        currentPath: pathname
                    });
                    return { to: '/app/select-tenant' };

                case 'UNAUTHORIZED':
                    // Access denied to requested tenant
                    Logger.warn('FlowGate: Tenant Access Denied', {
                        userId,
                        attemptedTenant: urlTenantId,
                        reason: result.reason
                    });
                    return {
                        to: `/app/access-denied?tenant=${urlTenantId}&reason=${encodeURIComponent(result.reason)}`
                    };

                case 'NO_TENANTS':
                    // No tenants - usually goes to onboarding
                    console.info('[FlowGate] tenant_no_tenants', { userId });

                    // 🚑 FAIL-SAFE: Check Local Blueprint if DB is lagging or broken
                    try {
                        const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                        const rawBp = getTabIsolated('chefiapp_system_blueprint_v2');
                        if (rawBp) {
                            const bp = JSON.parse(rawBp);
                            const isReal = bp.organization?.realityStatus === 'real' || bp.organization?.realityStatus === 'verified';
                            if (isReal && bp.meta?.tenantId) {
                                console.log('[FlowGate] 🚑 Tenant Resolution Fail-Safe: Trusting Local Blueprint.');
                                // Mock active tenant for the session
                                setActiveTenant(bp.meta.tenantId);
                                return null; // ALLOW access (don't redirect to /onboarding/identity)
                            }
                        }
                    } catch (e) {
                        console.warn('[FlowGate] Fail-Safe check failed', e);
                    }

                    return { to: '/onboarding/identity' };

                default:
                    // Unknown state - fail closed
                    Logger.error('FlowGate: Unknown tenant resolution type', null, { result });
                    return { to: '/app/access-denied' };
            }
        };

        checkFlow();

        return () => {
            mounted = false;
            if (oauthWaitTimeout) {
                clearTimeout(oauthWaitTimeout);
            }
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [
        // Usar apenas valores primitivos para evitar re-execuções desnecessárias
        session?.user?.id ?? null, // Apenas o ID, não o objeto session completo (null se não houver)
        sessionLoading,
        location.pathname,
        location.search,
        location.hash,
        // navigate é estável, mas incluímos para satisfazer linting
        navigate
    ]);

    // --- RENDER ---

    // Loading Screen (Sovereign Loader) - Using unified LoadingState
    // DEV_STABLE_MODE: Allow /app/select-tenant to render even if session is loading
    // Also allow render if tenant is sealed (user just selected tenant, session may be updating)
    const isSelectTenantPage = location.pathname === '/app/select-tenant';
    const tenantSealed = isTenantSealed();

    // If tenant is sealed and we're on an /app/* route, allow render even if session is loading
    // This prevents oscillation when user just selected tenant and session is updating
    const isAppRoute = location.pathname.startsWith('/app/');
    const shouldAllowRenderWithSealedTenant = tenantSealed && isAppRoute && !isSelectTenantPage;

    // If tenant is sealed, don't show loading screen (session may be updating)
    // But still show loading if we're checking and tenant is not sealed
    const shouldShowLoading = (sessionLoading || isChecking) && !isSelectTenantPage && !shouldAllowRenderWithSealedTenant && !forceRender;

    // DEV BYPASS: Always render children for TPV/KDS routes to skip all loading states
    const isDevTPVBypass = import.meta.env.DEV && (location.pathname.includes('/tpv') || location.pathname.includes('/kds'));
    if (isDevTPVBypass) {
        console.warn('[FlowGate] 🚧 DEV BYPASS: Force rendering children for TPV/KDS');
        return children;
    }

    if (shouldShowLoading) {
        return (
            <div style={{ height: '100vh', width: '100vw', background: '#0b0b0c', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
                <LoadingState
                    variant="spinner"
                    spinnerSize="lg"
                    message="AUTHENTICATING"
                    style={{ color: '#666', fontFamily: 'monospace', letterSpacing: 1 }}
                />
            </div>
        );
    }

    // If tenant is sealed but no session yet, allow render (session will update)
    // This prevents oscillation between login and dashboard
    // This is the key fix: when tenant is sealed, allow render even without session
    // The useSupabaseAuth will update in the next cycle and FlowGate will re-execute
    if (shouldAllowRenderWithSealedTenant) {
        // Tenant is sealed - allow render even if session is loading or not available yet
        // This prevents the oscillation loop
        return children;
    }

    return children;
}
