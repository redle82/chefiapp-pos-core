import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../supabase';
import { useSupabaseAuth } from '../auth/useSupabaseAuth';
import { getActiveTenant, getTenantStatus, setActiveTenant } from './TenantResolver';

/**
 * 🏢 TenantContext — Multi-Tenant Data Isolation (Phase 4)
 * 
 * SOVEREIGNTY: Este contexto é a ÚNICA fonte de verdade para o tenant ativo.
 * 
 * Responsabilidades:
 * 1. Resolver qual restaurante o usuário está operando
 * 2. Fornecer tenant_id para todas as queries
 * 3. Permitir switch entre restaurantes (multi-tenant)
 * 
 * ⚠️ REGRAS IMUTÁVEIS:
 * - TODA query que acessa dados de restaurante DEVE usar tenantId
 * - NUNCA usar localStorage.getItem('chefiapp_restaurant_id') diretamente em queries
 * - SEMPRE usar useTenant() para obter tenantId
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TenantMembership {
    restaurant_id: string;
    restaurant_name: string;
    role: 'owner' | 'manager' | 'staff' | 'waiter' | 'kitchen';
}

export interface Restaurant {
    id: string;
    name: string;
    operation_status?: 'active' | 'paused' | 'suspended';
    operation_metadata?: any;
    [key: string]: any;
}

export interface TenantState {
    /** Current active tenant ID (null if not resolved) */
    tenantId: string | null;

    /** Current full restaurant object */
    restaurant: Restaurant | null;

    /** List of all tenants user has access to */
    memberships: TenantMembership[];

    /** Is tenant resolution in progress? */
    isLoading: boolean;

    /** Error during resolution */
    error: string | null;

    /** Does user have multiple tenants? */
    isMultiTenant: boolean;
}

export interface TenantContextValue extends TenantState {
    /** Switch to a different tenant */
    switchTenant: (tenantId: string) => void;

    /** Refresh tenant list from DB */
    refreshTenants: () => Promise<void>;

    /** Get current tenant name */
    getCurrentTenantName: () => string | null;

    /** Refresh just the active restaurant data */
    refreshTenant: () => Promise<void>;
}

// ... CONTEXT ...
const TenantContext = createContext<TenantContextValue | null>(null);

// ... PROVIDER ...
interface TenantProviderProps {
    children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    const { session } = useSupabaseAuth();

    const [state, setState] = useState<TenantState>({
        tenantId: null,
        restaurant: null,
        memberships: [],
        isLoading: true,
        error: null,
        isMultiTenant: false,
    });

    // In-flight guard: prevent concurrent resolveTenants() calls (StrictMode/remount safety)
    const resolveInFlightRef = useRef<Promise<void> | null>(null);

    // ========================================================================
    // RESOLVE TENANTS
    // ========================================================================

    const resolveTenants = useCallback(async () => {
        if (resolveInFlightRef.current) return;

        const p = (async () => {
        if (!session?.user?.id) {
            setState({
                tenantId: null,
                restaurant: null,
                memberships: [],
                isLoading: false,
                error: null,
                isMultiTenant: false,
            });
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // 1. Fetch all memberships
            const { data: members, error: memberError } = await supabase
                .from('gm_restaurant_members')
                .select('restaurant_id, role')
                .eq('user_id', session.user.id);

            if (memberError) throw memberError;

            if (!members || members.length === 0) {
                setState({
                    tenantId: null,
                    restaurant: null,
                    memberships: [],
                    isLoading: false,
                    error: null,
                    isMultiTenant: false,
                });
                return;
            }

            // 2. Fetch restaurant basic info for list
            const restaurantIds = members.map(m => m.restaurant_id);
            const { data: restaurants, error: restError } = await supabase
                .from('gm_restaurants')
                .select('id, name')
                .in('id', restaurantIds);

            if (restError) throw restError;

            // 3. Build memberships
            const memberships: TenantMembership[] = members.map(m => {
                const restaurant = restaurants?.find(r => r.id === m.restaurant_id);
                return {
                    restaurant_id: m.restaurant_id,
                    restaurant_name: restaurant?.name || 'Restaurante sem nome',
                    role: m.role as TenantMembership['role'],
                };
            });

            // 4. Determine active tenant
            const cachedTenantId = getActiveTenant();
            const cachedStatus = getTenantStatus();
            let activeTenantId: string | null = null;

            if (cachedTenantId && cachedStatus === 'ACTIVE' && memberships.some(m => m.restaurant_id === cachedTenantId)) {
                activeTenantId = cachedTenantId;
            } else if (memberships.length === 1) {
                // ✅ Single-tenant: auto-seleção é permitida
                activeTenantId = memberships[0].restaurant_id;
                // Seal tenant via the canonical resolver keys (prevents Gate/Domain drift)
                setActiveTenant(activeTenantId);
            } else {
                /**
                 * 🔒 MULTI-TENANT SOVEREIGNTY
                 * Em multi-tenant, TenantContext não pode auto-selecionar nem escrever cache.
                 * A seleção deve ocorrer em /app/select-tenant e ser selada pelo FlowGate/TenantResolver.
                 */
                activeTenantId = null;
            }

            // 5. Fetch FULL active restaurant data if we have an ID
            let activeRestaurant: Restaurant | null = null;
            if (activeTenantId) {
                const { data: fullRest, error: fullRestError } = await supabase
                    .from('gm_restaurants')
                    .select('*')
                    .eq('id', activeTenantId)
                    .single();

                if (fullRestError) throw fullRestError;
                activeRestaurant = fullRest;
            }

            setState({
                tenantId: activeTenantId,
                restaurant: activeRestaurant,
                memberships,
                isLoading: false,
                error: null,
                isMultiTenant: memberships.length > 1,
            });

        } catch (error) {
            console.error('[TenantContext] ❌ Error resolving tenants:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erro ao resolver tenant',
            }));
        }
        })();

        resolveInFlightRef.current = p;
        try {
            await p;
        } finally {
            resolveInFlightRef.current = null;
        }
    }, [session?.user?.id]);

    // ========================================================================
    // REFRESH SINGLE TENANT (Opus 6.0)
    // ========================================================================
    const refreshTenant = useCallback(async () => {
        if (!state.tenantId) return;

        try {
            const { data: fullRest, error } = await supabase
                .from('gm_restaurants')
                .select('*')
                .eq('id', state.tenantId)
                .single();

            if (error) throw error;

            setState(prev => ({ ...prev, restaurant: fullRest }));
            console.log('[TenantContext] 🔄 Refreshed active tenant data');
        } catch (err) {
            console.error('[TenantContext] Failed to refresh tenant:', err);
        }
    }, [state.tenantId]);


    // ========================================================================
    // SWITCH TENANT
    // ========================================================================

    const switchTenant = useCallback(async (newTenantId: string) => {
        // Validation...
        if (!state.memberships.some(m => m.restaurant_id === newTenantId)) {
            console.error('[TenantContext] ❌ Cannot switch to unauthorized tenant:', newTenantId);
            return;
        }

        // Canonical seal (Gate truth). Prevents AppDomainWrapper tenantId=null after selection.
        setActiveTenant(newTenantId);

        // Optimistic switch + Fetch
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const { data: fullRest, error } = await supabase
                .from('gm_restaurants')
                .select('*')
                .eq('id', newTenantId)
                .single();

            if (error) throw error;

            setState(prev => ({
                ...prev,
                tenantId: newTenantId,
                restaurant: fullRest,
                isLoading: false
            }));
            console.log('[TenantContext] 🔄 Switched to tenant:', newTenantId);

        } catch (err) {
            console.error('[TenantContext] Error switching tenant details:', err);
            setState(prev => ({ ...prev, isLoading: false, error: 'Failed to switch' }));
        }

    }, [state.memberships]);

    // ========================================================================
    // HELPERS
    // ========================================================================

    const getCurrentTenantName = useCallback(() => {
        const membership = state.memberships.find(m => m.restaurant_id === state.tenantId);
        return membership?.restaurant_name || null;
    }, [state.memberships, state.tenantId]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useEffect(() => {
        resolveTenants();
    }, [resolveTenants]);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================

    const value: TenantContextValue = {
        ...state,
        switchTenant,
        refreshTenants: resolveTenants,
        refreshTenant,
        getCurrentTenantName,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

// ... HOOKS ...
export function useTenant(): TenantContextValue {
    const context = useContext(TenantContext);

    if (!context) {
        throw new Error('[useTenant] Must be used within TenantProvider');
    }

    return context;
}

export function useTenantGuard(): { tenantId: string | null; isReady: boolean } {
    const { tenantId, isLoading, error } = useTenant();

    const isReady = !isLoading && !error && tenantId !== null;

    return { tenantId, isReady };
}
