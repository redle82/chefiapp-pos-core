import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '../tenant/TenantContext';
import { supabase } from '../supabase';

/**
 * RequireActivation Guard
 * 
 * 🔒 Operational Gate
 * 
 * Ensures that the "Activation Ritual" (Operation Mode, Device Role, etc.) 
 * has been completed before allowing access to the Command Center or Tools.
 * 
 * Logic:
 * 1. TASK-3.3.1: Verifica DB primeiro (fonte de verdade)
 * 2. localStorage é usado apenas como cache
 * 3. Se DB e cache divergem, DB vence
 * 4. Supports '?skip_activation=true' bypass for devs (DEV mode only)
 * 
 * Usage: Wrap /app/* routes in App.tsx
 */
export const RequireActivation = ({ children }: { children: JSX.Element }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { restaurant } = useTenant(); // Access Tenant Context
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const checkActivation = async () => {
            // 1. Dev Bypass (TASK-3.2.1: Só funciona em desenvolvimento)
            // 1. Dev Bypass & Route Exemption
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/app/select-tenant') || currentPath.startsWith('/app/access-denied')) {
                // Allow these routes specifically for Multi-Tenant flow
                setIsVerified(true);
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('skip_activation')) {
                // TASK-3.2.1: Verificar se está em desenvolvimento antes de permitir bypass
                if (import.meta.env.DEV) {
                    console.warn('[RequireActivation] 🚧 Skipping via URL param (DEV mode only)');
                    setIsVerified(true);
                    return;
                } else {
                    console.warn('[RequireActivation] 🛑 Bypass blocked: skip_activation only works in DEV mode');
                    // Em produção, ignorar bypass e continuar com verificação normal
                }
            }

            // FASE 1 - Billing Integration: Verificar subscription status
            let subscriptionStatus: string | null = null;
            if (restaurant?.id) {
                try {
                    const { data: subscription, error: subscriptionError } = await supabase
                        .from('subscriptions')
                        .select('status')
                        .eq('restaurant_id', restaurant.id)
                        .single();
                    
                    if (subscriptionError) {
                        // PGRST116 = nenhum resultado (normal em onboarding)
                        // PGRST205 = tabela não encontrada (migration não aplicada ainda)
                        // 404 = não encontrado
                        // Não logar como erro, apenas continuar sem subscription status
                        if (subscriptionError.code !== 'PGRST116' && 
                            subscriptionError.code !== 'PGRST205' && 
                            subscriptionError.code !== '404') {
                            console.warn('[RequireActivation] Error checking subscription:', subscriptionError);
                        }
                        subscriptionStatus = null;
                    } else {
                        subscriptionStatus = subscription?.status || null;
                    }
                } catch (err) {
                    // Se não encontrou subscription, pode estar em onboarding (normal)
                    // Não logar como erro crítico
                    subscriptionStatus = null;
                }
            }

            // TASK-3.3.1: Verificar DB primeiro (fonte de verdade)
            // Se DB e cache divergem, DB vence
            const isActiveInDB = restaurant?.operation_status === 'active' ||
                (restaurant as any)?.operation_mode === 'Gamified' ||
                (restaurant as any)?.operation_mode === 'Active';

            // FASE 1: Verificar subscription status
            // Permitir acesso se: TRIAL, ACTIVE, ou se operation_status está ativo
            const hasValidSubscription = subscriptionStatus === 'TRIAL' || subscriptionStatus === 'ACTIVE';
            const isBlockedBySubscription = subscriptionStatus === 'SUSPENDED' || subscriptionStatus === 'CANCELLED';

            if (isBlockedBySubscription) {
                console.log('[RequireActivation] 🛑 Access Denied: Subscription is SUSPENDED or CANCELLED');
                navigate('/app/billing', {
                    replace: true,
                    state: { reason: 'subscription_inactive' }
                });
                return;
            }

            if (isActiveInDB || hasValidSubscription) {
                // DB diz que está ativo OU subscription válida - sempre confiar no DB
                console.log('[RequireActivation] ✅ DB confirms activation or valid subscription');
                const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
                setTabIsolated('chefiapp_operation_mode', 'active'); // Atualizar cache
                setIsVerified(true);
                return;
            }

            // Portal central: permitir acesso ao portal; billing/checklist são apenas avisos
            if (!subscriptionStatus && !isActiveInDB) {
                if (currentPath.startsWith('/app/')) {
                    setIsVerified(true);
                    return;
                }
            }

            // Se DB não confirma ativação, verificar cache (mas não confiar cegamente)
            const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
            const localOpMode = getTabIsolated('chefiapp_operation_mode');

            if (localOpMode && restaurant) {
                // Cache existe mas DB não confirma - DB vence (não confiar em cache)
                console.warn('[RequireActivation] ⚠️ Cache exists but DB does not confirm activation. DB wins.');
                // Limpar cache inválido
                const { removeTabIsolated } = await import('../storage/TabIsolatedStorage');
                removeTabIsolated('chefiapp_operation_mode');
            }

            // Se não há restaurant context ainda, aguardar
            if (!restaurant) {
                return; // Aguardar restaurant context carregar
            }

            // DB não confirma ativação - negar acesso
            console.log('[RequireActivation] 🛑 Access Denied: Operation Mode undefined in DB. Redirecting to Ritual.');
            navigate('/activation', { replace: true });
        };

        checkActivation();
    }, [navigate, location, restaurant]);

    if (!isVerified) {
        // Optional: Render nothing or a sovereign loader while checking
        return null;
    }

    return children;
};
