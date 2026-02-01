import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSupabaseAuth } from "../auth/useSupabaseAuth";
import { isDevStableMode } from "../runtime/devStableMode";
import { supabase } from "../supabase";
import {
  getActiveTenant,
  getTenantStatus,
  isTenantSealed,
  setActiveTenant,
} from "./TenantResolver";

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
  role: "owner" | "manager" | "staff" | "waiter" | "kitchen";
}

export interface Restaurant {
  id: string;
  name: string;
  operation_status?: "active" | "paused" | "suspended";
  operation_metadata?: any;
  topology?: { hasTPV?: boolean; [key: string]: any };
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
  const { session, loading } = useSupabaseAuth();

  const [state, setState] = useState<TenantState>({
    tenantId: null,
    restaurant: null,
    memberships: [],
    isLoading: true,
    error: null,
    isMultiTenant: false,
  });

  // STEP 5: In-flight guard - prevent concurrent resolveTenants() calls (StrictMode/remount safety)
  const inFlightRef = useRef<Promise<void> | null>(null);

  // ========================================================================
  // RESOLVE TENANTS
  // ========================================================================

  const resolveTenants = useCallback(async () => {
    // STEP 5: In-flight guard - prevent concurrent calls
    if (inFlightRef.current) return;
    const p = (async () => {
      try {
        // STEP 5: Early return if tenant already sealed (sovereign authority)
        // Tenant selado não é reavaliado, não é reescrito
        const sealed = isTenantSealed();
        const sealedTenantId = getActiveTenant();

        if (sealed && sealedTenantId) {
          // Tenant already sealed - do not re-resolve or overwrite
          // If state is already in sync, return early
          if (
            state.tenantId === sealedTenantId &&
            state.memberships.length > 0 &&
            !state.isLoading
          ) {
            // Everything is in sync, no work needed
            // Não atualizar estado para evitar re-renders desnecessários
            return;
          }
          // If state is not in sync but tenant is sealed, we still need memberships for UI
          // Continue to fetch memberships but skip sealing logic below
        }

        if (!session?.user?.id) {
          // DEV BYPASS: If tenant is sealed (DEV auto-seal) but no session, provide mock data for TPV/KDS
          // DEV BYPASS: If demo mode or generic bypass routes, provide mock restaurant data
          if (import.meta.env.DEV) {
            const path =
              typeof window !== "undefined" ? window.location.pathname : "";
            const search =
              typeof window !== "undefined" ? window.location.search : "";
            const isDemo = new URLSearchParams(search).get("demo") === "true";
            // Use sealedTenantId if available, otherwise default to a mock ID
            const targetTenantId = sealedTenantId || "mock-tenant-id";

            if (
              (sealed && sealedTenantId) ||
              isDemo ||
              path.includes("/tpv") ||
              path.includes("/kds")
            ) {
              // Ensure tenant is sealed for consistency
              if (!sealed || getActiveTenant() !== targetTenantId) {
                console.warn(
                  "[TenantContext] 🚧 DEV BYPASS: Auto-sealing mock tenant",
                  targetTenantId,
                );
                setActiveTenant(targetTenantId);
              }

              console.warn(
                "[TenantContext] 🚧 DEV BYPASS: Providing mock restaurant data for",
                targetTenantId,
              );
              const mockRestaurant: Restaurant = {
                id: targetTenantId,
                name: "DEV Restaurant (Mock)",
                operation_status: "active",
              };
              setState({
                tenantId: targetTenantId,
                restaurant: mockRestaurant,
                memberships: [
                  {
                    restaurant_id: targetTenantId,
                    restaurant_name: "DEV Restaurant (Mock)",
                    role: "owner",
                  },
                ],
                isLoading: false,
                error: null,
                isMultiTenant: false,
              });
              return;
            }
          }
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

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // 1. Fetch all memberships
        const { data: members, error: memberError } = await supabase
          .from("gm_restaurant_members")
          .select("restaurant_id, role")
          .eq("user_id", session.user.id);

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
        const restaurantIds = members.map((m) => m.restaurant_id);
        const { data: restaurants, error: restError } = await supabase
          .from("gm_restaurants")
          .select("id, name")
          .in("id", restaurantIds);

        if (restError) throw restError;

        // 3. Build memberships
        const memberships: TenantMembership[] = members.map((m) => {
          const restaurant = restaurants?.find((r) => r.id === m.restaurant_id);
          return {
            restaurant_id: m.restaurant_id,
            restaurant_name: restaurant?.name || "Restaurante sem nome",
            role: m.role as TenantMembership["role"],
          };
        });

        // 4. Determine active tenant
        const cachedTenantId = getActiveTenant();
        const cachedStatus = getTenantStatus();
        let activeTenantId: string | null = null;

        // STEP 5: Fail-closed - never overwrite sealed tenant
        if (
          sealed &&
          sealedTenantId &&
          memberships.some((m) => m.restaurant_id === sealedTenantId)
        ) {
          // Tenant already sealed - use it directly, do not re-seal
          activeTenantId = sealedTenantId;
        } else {
          // STEP 5: Explicit multi-tenant guard - NO auto-selection
          if (memberships.length > 1) {
            // Multi-tenant: only use cached if valid, never auto-select
            if (
              cachedTenantId &&
              cachedStatus === "ACTIVE" &&
              memberships.some((m) => m.restaurant_id === cachedTenantId)
            ) {
              activeTenantId = cachedTenantId;
            } else {
              activeTenantId = null; // Must select via /app/select-tenant
            }
          } else if (
            cachedTenantId &&
            cachedStatus === "ACTIVE" &&
            memberships.some((m) => m.restaurant_id === cachedTenantId)
          ) {
            activeTenantId = cachedTenantId;
          } else if (memberships.length === 1) {
            // Single-tenant: auto-selection is allowed
            activeTenantId = memberships[0].restaurant_id;
            // Only seal if tenant is not already sealed (prevent overwrite)
            const currentlySealed = isTenantSealed();
            if (!currentlySealed || getActiveTenant() !== activeTenantId) {
              setActiveTenant(activeTenantId);
            }
          } else {
            activeTenantId = null;
          }
        }

        // 5. Fetch FULL active restaurant data if we have an ID
        let activeRestaurant: Restaurant | null = null;
        if (activeTenantId) {
          const { data: fullRest, error: fullRestError } = await supabase
            .from("gm_restaurants")
            .select("*")
            .eq("id", activeTenantId)
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
        const devStable = isDevStableMode();
        if (!devStable) {
          console.error("[TenantContext] ❌ Error resolving tenants:", error);
        }
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Erro ao resolver tenant",
        }));
      }
    })();
    inFlightRef.current = p;
    try {
      await p;
    } finally {
      inFlightRef.current = null;
    }
  }, [session?.user?.id, state.tenantId, state.memberships.length]);

  // ========================================================================
  // REFRESH SINGLE TENANT (Opus 6.0)
  // ========================================================================
  const refreshTenant = useCallback(async () => {
    if (!state.tenantId) return;

    try {
      const { data: fullRest, error } = await supabase
        .from("gm_restaurants")
        .select("*")
        .eq("id", state.tenantId)
        .single();

      if (error) throw error;

      setState((prev) => ({ ...prev, restaurant: fullRest }));
      // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
      const devStable = isDevStableMode();
      if (!devStable) {
        console.log("[TenantContext] 🔄 Refreshed active tenant data");
      }
    } catch (err) {
      const devStable = isDevStableMode();
      if (!devStable) {
        console.error("[TenantContext] Failed to refresh tenant:", err);
      }
    }
  }, [state.tenantId]);

  // ========================================================================
  // SWITCH TENANT
  // ========================================================================

  const switchTenant = useCallback(
    async (newTenantId: string) => {
      // Validation...
      if (!state.memberships.some((m) => m.restaurant_id === newTenantId)) {
        // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
        const devStable = isDevStableMode();
        if (!devStable) {
          console.error(
            "[TenantContext] ❌ Cannot switch to unauthorized tenant:",
            newTenantId,
          );
        }
        return;
      }

      // Canonical seal (Gate truth). Prevents AppDomainWrapper tenantId=null after selection.
      setActiveTenant(newTenantId);

      // Optimistic switch + Fetch
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const { data: fullRest, error } = await supabase
          .from("gm_restaurants")
          .select("*")
          .eq("id", newTenantId)
          .single();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          tenantId: newTenantId,
          restaurant: fullRest,
          isLoading: false,
        }));
        // No logs in DEV_STABLE_MODE (only hard-stop logs allowed)
        const devStable = isDevStableMode();
        if (!devStable) {
          console.log("[TenantContext] 🔄 Switched to tenant:", newTenantId);
        }
      } catch (err) {
        const devStable = isDevStableMode();
        if (!devStable) {
          console.error("[TenantContext] Error switching tenant details:", err);
        }
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to switch",
        }));
      }
    },
    [state.memberships],
  );

  // ========================================================================
  // HELPERS
  // ========================================================================

  const getCurrentTenantName = useCallback(() => {
    const membership = state.memberships.find(
      (m) => m.restaurant_id === state.tenantId,
    );
    return membership?.restaurant_name || null;
  }, [state.memberships, state.tenantId]);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    // Proteção adicional: não executar se tenant já está selado e estado está sincronizado
    const sealed = isTenantSealed();
    const sealedTenantId = getActiveTenant();

    if (
      sealed &&
      sealedTenantId &&
      state.tenantId === sealedTenantId &&
      state.memberships.length > 0 &&
      !state.isLoading
    ) {
      // Tenant selado e estado sincronizado - não re-executar
      return;
    }

    // WAIT FOR SESSION LOADING
    if (loading) return;

    resolveTenants();
  }, [resolveTenants, loading]);

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
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

// ... HOOKS ...
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("[useTenant] Must be used within TenantProvider");
  }

  return context;
}

export function useTenantGuard(): {
  tenantId: string | null;
  isReady: boolean;
} {
  const { tenantId, isLoading, error } = useTenant();

  const isReady = !isLoading && !error && tenantId !== null;

  return { tenantId, isReady };
}
