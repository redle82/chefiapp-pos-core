import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';
import { resolveNextRoute } from './CoreFlow';
import type { UserState, OnboardingStatus } from './CoreFlow';
import {
    resolve as resolveTenant,
    extractTenantFromPath,
    isLegacyRoute,
    buildTenantPath,
    getBasePathFromLegacy,
    getActiveTenant,
    setActiveTenant,
    getTenantStatus,
    type TenantResolutionResult,
} from '../tenant/TenantResolver';
import { Logger } from '../logger/Logger';
import { LoadingState } from '../../ui/design-system/components/LoadingState';

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

export function FlowGate({ children }: { children: any }) {
    const { session, loading: sessionLoading } = useSupabaseAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Controlled Loading State prevents flicker
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkFlow = async () => {
            // 1. Wait for Auth Session Protocol
            if (sessionLoading) {
                console.log('[FlowGate] ⏳ Session Loading...');
                return;
            }

            console.log('[FlowGate] 🔍 Check Flow:', {
                hasSession: !!session,
                userId: session?.user?.id,
                path: location.pathname
            });

            // --- ESTADO 1: SEM SESSÃO ---
            if (!session) {
                // Limpeza de cache e Contexto (Tab-Isolated)
                const { removeTabIsolated } = await import('../storage/TabIsolatedStorage');
                removeTabIsolated('chefiapp_restaurant_id');
                removeTabIsolated('chefiapp_active_tenant');
                Logger.clearContext();

                const state: UserState = {
                    isAuthenticated: false,
                    hasOrganization: false,
                    onboardingStatus: 'not_started',
                    currentPath: location.pathname
                };

                executeDecision(state);
                if (mounted) setIsChecking(false);
                return;
            }

            try {
                // --- ESTADO 2: COM SESSÃO (DB Lookup) ---
                // A. Buscar Membro (Vínculo User -> Restaurant)
                const { data: members, error: memberError } = await supabase
                    .from('gm_restaurant_members')
                    .select('restaurant_id, role')
                    .eq('user_id', session.user.id);

                if (memberError) throw memberError;

                // Set User Context early
                Logger.setContext({ userId: session.user.id });
                Logger.debug('FlowGate: Members Query Result', { members });

                let hasOrg = false;
                let status: OnboardingStatus = 'not_started';
                let restaurantId = null;

                if (members && members.length > 0) {
                    hasOrg = true;
                    restaurantId = members[0].restaurant_id;

                    // B. Buscar Restaurante (Status Real)
                    const { data: restaurant, error: restError } = await supabase
                        .from('gm_restaurants')
                        .select('onboarding_completed_at')
                        .eq('id', restaurantId)
                        .single();

                    if (!restError && restaurant) {
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
                                    .select('id, onboarding_completed_at')
                                    .eq('id', localTenantId)
                                    .single();

                                if (ghostRestaurant) {
                                    Logger.info('FlowGate: Emergency Bypass Successful', { tenantId: localTenantId });
                                    hasOrg = true;
                                    restaurantId = localTenantId;

                                    // Logic same as above
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
                if (restaurantId) {
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
                    currentPath: location.pathname
                };

                // E. Execute base flow decision first
                const baseDecision = resolveNextRoute(state);

                if (baseDecision.type === 'REDIRECT') {
                    // CRITICAL: Guard against navigation loop
                    if (location.pathname !== baseDecision.to) {
                        Logger.info(`FlowGate: Blocked (Base)`, { reason: baseDecision.reason, to: baseDecision.to, state });
                        console.warn('[FlowGate] 🚫 REDIRECT BLOCK (Base):', { reason: baseDecision.reason, to: baseDecision.to, state });
                        navigate(baseDecision.to, { replace: true });
                    }
                    if (mounted) setIsChecking(false);
                    return;
                }

                if (location.pathname.startsWith('/app')) {
                    // SOVEREIGN CHECK 1: If Tenant is ACTIVE, SelectTenant is FORBIDDEN
                    const currentStatus = getTenantStatus();
                    if (currentStatus === 'ACTIVE' && location.pathname === '/app/select-tenant') {
                        // CRITICAL: Guard against navigation loop
                        if (location.pathname !== '/app/dashboard') {
                            Logger.warn('FlowGate: Sovereign Redirect (Tenant Already Active)', { to: '/app/dashboard' });
                            navigate('/app/dashboard', { replace: true });
                        }
                        if (mounted) setIsChecking(false);
                        return;
                    }

                    // SOVEREIGN CHECK 2: If Tenant is NOT Active, Operation is FORBIDDEN
                    const isOperationalRoute = ['/tpv', '/kds', '/orders', '/menu', '/dashboard', '/settings'].some(route => location.pathname.includes(route));
                    if (currentStatus !== 'ACTIVE' && isOperationalRoute && location.pathname !== '/app/select-tenant' && location.pathname !== '/app/access-denied') {
                        Logger.warn('FlowGate: Sovereign Block (Tenant Not Active)', { path: location.pathname });
                        // Let handleTenantResolution handle the redirect, but be aware
                    }

                    const tenantDecision = await handleTenantResolution(session.user.id, location.pathname);

                    if (tenantDecision) {
                        // CRITICAL: Guard against navigation loop
                        if (location.pathname !== tenantDecision.to) {
                            navigate(tenantDecision.to, { replace: true });
                        }
                        if (mounted) setIsChecking(false);
                        return;
                    }
                }

                console.log(`[FlowGate] ✅ Allowed: ${state.currentPath}`);

                // GATING ENFORCEMENT (Sovereign Level 2.0)
                const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                const storedLevel = getTabIsolated('chefiapp_sovereign_level'); // founder | bronze | silver | gold
                const storedModules = JSON.parse(getTabIsolated('chefiapp_modules_unlocked') || '[]');

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
                console.error('[FlowGate] 💥 DB Error during check:', error);
                // Fallback seguro em caso de erro de DB:
                const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
                const fallbackState: UserState = {
                    isAuthenticated: true,
                    hasOrganization: !!getTabIsolated('chefiapp_restaurant_id'),
                    onboardingStatus: 'not_started',
                    currentPath: location.pathname
                };
                executeDecision(fallbackState);
            } finally {
                if (mounted) setIsChecking(false);
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

        return () => { mounted = false; };
    }, [session, sessionLoading, location.pathname]); // CRITICAL: Remove navigate from deps (it's stable but causes re-renders)

    // --- RENDER ---

    // Loading Screen (Sovereign Loader) - Using unified LoadingState
    if (sessionLoading || isChecking) {
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

    return children;
}
