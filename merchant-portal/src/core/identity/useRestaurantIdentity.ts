import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { getActiveTenant, getTenantStatus } from '../tenant/TenantResolver';

export interface RestaurantIdentity {
    id: string | null;
    name: string;
    city: string;
    type: string;
    isDemo: boolean;
    loading: boolean;
    ownerName?: string;
    logoUrl?: string; // Brand Identity
    lastPulse?: {
        type: string;
        created_at: string;
        payload: any;
    };
}

export function useRestaurantIdentity() {
    const [identity, setIdentity] = useState<RestaurantIdentity>({
        id: null,
        name: '',
        city: '',
        type: '',
        isDemo: false,
        loading: true,
        ownerName: '',
        logoUrl: undefined,
    });

    const mountedRef = useRef(true);

    const hydrate = useCallback(async () => {
        if (!mountedRef.current) return;
        setIdentity(prev => ({ ...prev, loading: true }));

        // A) DEMO MODE CHECK
        const params = new URLSearchParams(window.location.search);
        const { getTabIsolated } = await import('../storage/TabIsolatedStorage');
        const isDemo = getTabIsolated('chefiapp_demo_mode') === 'true' || params.get('demo') === 'true';

        if (isDemo) {
            // @ts-ignore
            let mock = window.RestaurantIdentity;
            try {
                const stored = getTabIsolated('chefiapp_restaurant_identity');
                if (stored) mock = JSON.parse(stored);
            } catch (e) {
                console.warn('Invalid mock identity in localStorage');
            }

            setIdentity({
                id: 'demo-id',
                name: mock?.name || 'Restaurante Exemplo (Demo)',
                city: mock?.city || 'Modo de Demonstração',
                type: 'Bistro',
                isDemo: true,
                loading: false,
                ownerName: 'Visitante',
                logoUrl: mock?.logoUrl,
                lastPulse: {
                    type: 'DEMO_PULSE',
                    created_at: new Date().toISOString(),
                    payload: { message: 'Sistema em modo de demonstração' }
                }
            });
            return;
        }

        // B) REAL MODE (Supabase)
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not authenticated
                setIdentity(prev => ({ ...prev, loading: false }));
                return;
            }

            // 🔒 TENANT GATE: identity must NOT resolve/persist a restaurant unless tenant is sealed ACTIVE.
            // This prevents accidental "first membership" selection in multi-tenant accounts.
            const sealedStatus = getTenantStatus();
            const sealedTenantId = getActiveTenant();
            if (sealedStatus !== 'ACTIVE' || !sealedTenantId) {
                setIdentity(prev => ({ ...prev, loading: false }));
                return;
            }

            // 0. Get Owner Profile (Rich Identity)
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();

            const ownerName = profile?.full_name || user.user_metadata?.full_name || 'Comandante';

            // 1. Get Restaurant Details (SCALABLE: Via Members)
            // Fix for Incident #004/Identity: Handle users with multiple memberships (55+)
            // Strategy (SOVEREIGN): only trust the sealed tenant from TenantResolver.
            // Never use legacy keys to "guess" tenant, otherwise we can create false NO_MEMBERSHIP loops.
            let memberQuery = supabase
                .from('gm_restaurant_members')
                .select('restaurant_id')
                .eq('user_id', user.id);

            // Only constrain when the tenant is explicitly sealed as ACTIVE
            if (sealedTenantId && sealedStatus === 'ACTIVE') {
                memberQuery = memberQuery.eq('restaurant_id', sealedTenantId);
            }

            // Always use array to avoid PGRST116 and be resilient to view-related weirdness
            const { data: memberList, error: memberError } = await memberQuery.limit(1);

            console.log('[Identity] Member Query Response:', {
                count: memberList?.length,
                error: memberError,
                targetTenantId: sealedTenantId
            });

            const memberData = memberList && memberList.length > 0 ? memberList[0] : null;

            // CRITICAL: Guard definitivo para membership
            if (memberError || !memberData) {
                console.error('[Identity] CRITICAL: No restaurant membership found', {
                    userId: user?.id,
                    targetTenantId: sealedTenantId,
                    memberError
                });

                setIdentity(prev => ({
                    ...prev,
                    name: 'Sem Restaurante',
                    ownerName,
                    loading: false,
                    error: 'NO_MEMBERSHIP',
                    restaurantId: null,
                    role: null,
                    restaurant: null,
                }));
                return;
            }

            // 1b. Fetch restaurant details separately
            const { data: restaurant, error: restaurantError } = await supabase
                .from('gm_restaurants')
                .select('id, name, city, type')
                .eq('id', memberData.restaurant_id)
                .maybeSingle();

            if (restaurantError || !restaurant) {
                console.warn('Identity: Restaurant not found.', { restaurant, restaurantError });
                setIdentity(prev => ({ ...prev, name: 'Sem Restaurante', ownerName, loading: false }));
                return;
            }

            const member = { restaurant_id: memberData.restaurant_id };

            // 2. Get Last Pulse (The Heartbeat)
            // SAFETY: empire_pulses may not exist or be empty
            const { data: pulse, error: pulseError } = await supabase
                .from('empire_pulses')
                .select('*')
                .eq('restaurant_id', member.restaurant_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (pulseError) {
                console.warn('[Identity] Pulse check failed (non-critical):', pulseError.message || 'Unknown error');
            }

            if (mountedRef.current) {
                // BRIDGE: Persist ID for other contexts (e.g. OrderContext, MenuContext)
                console.log('[Identity] Persisting Identity Bridge:', restaurant.id);
                const { setTabIsolated } = await import('../storage/TabIsolatedStorage');
                setTabIsolated('chefiapp_restaurant_id', restaurant.id);

                setIdentity({
                    id: restaurant.id,
                    name: restaurant.name || 'Seu Restaurante',
                    city: restaurant.city || 'Local desconhecido',
                    type: restaurant.type || 'Geral',
                    isDemo: false,
                    loading: false,
                    ownerName,
                    lastPulse: pulse || undefined
                });
            }

        } catch (err: any) {
            console.error('Identity: Crash hydration:', err?.message || 'Unknown error');
            if (mountedRef.current) setIdentity(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        hydrate();
        return () => { mountedRef.current = false; };
    }, []); // CRITICAL: hydrate is stable (useCallback with empty deps), so empty array is safe

    return { identity, refreshIdentity: hydrate };
}
