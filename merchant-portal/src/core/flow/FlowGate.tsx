import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CONFIG } from "../../config";
import { useLifecycleStateContext } from "../../context/LifecycleStateContext";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useSupabaseAuth } from "../auth/useSupabaseAuth";
import { getRestaurantStatus } from "../billing/coreBillingApi";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { getTableClient } from "../infra/coreRpc";
import {
  deriveLifecycleState,
  deriveSystemState,
  getCanonicalDestination,
  isPathAllowedForState,
} from "../lifecycle/LifecycleState";
import type { RestaurantLifecycleState } from "../lifecycle/LifecycleState";
import {
  hasOperationalRestaurant,
  INVALID_OR_SEED_RESTAURANT_IDS,
} from "../readiness/operationalRestaurant";
import { isDemo } from "../runtime/RuntimeContext";
import { isDebugEnabled, isDevStableMode } from "../runtime/devStableMode";
import { getTabIsolated, setTabIsolated } from "../storage/TabIsolatedStorage";
import {
  clearActiveTenant,
  getActiveTenant,
  isTenantSealed,
  setActiveTenant,
} from "../tenant/TenantResolver";
import type { UserState } from "./CoreFlow";
import { resolveNextRoute } from "./CoreFlow";

/**
 * FlowGate - O Executor do Contrato (DB-First Edition + Multi-Tenant)
 *
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 */

const TENANT_EXEMPT_ROUTES = ["/app/select-tenant", "/app/access-denied"];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function FlowGate({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setLifecycleState } = useLifecycleStateContext();

  const [isChecking, setIsChecking] = useState(true);
  const lastCheckRef = useRef<{ key: string; ts: number }>({ key: "", ts: 0 });
  const lastNavigateRef = useRef<{ to: string; ts: number }>({ to: "", ts: 0 });
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDocker = getBackendType() === BackendType.docker;
  const LOADING_TIMEOUT_MS = isDocker ? 5000 : 15000;

  useEffect(() => {
    let mounted = true;

    loadingTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        clearLoadingTimeout();
        setIsChecking(false);
      }
    }, LOADING_TIMEOUT_MS);

    const clearLoadingTimeout = () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const checkFlow = async () => {
      const pathname = location.pathname;
      const sealed = isTenantSealed();

      const localRestaurantId =
        getTabIsolated("chefiapp_restaurant_id") ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("chefiapp_restaurant_id")
          : null);
      const hasLocalOrg =
        sealed ||
        hasOperationalRestaurant({ restaurant_id: localRestaurantId });

      const safeNavigate = (to: string) => {
        if (pathname === to) return;
        const now = Date.now();
        if (
          lastNavigateRef.current.to === to &&
          now - lastNavigateRef.current.ts < 1500
        )
          return;
        lastNavigateRef.current = { to, ts: now };
        navigate(to, { replace: true });
      };

      // OPERATIONAL_NAVIGATION_SOVEREIGNTY: em OPERATIONAL_OS nunca redirect para "/"; destino canónico é /app/dashboard.
      const resolveDestination = (state: RestaurantLifecycleState): string => {
        const d = getCanonicalDestination(state);
        if (CONFIG.UI_MODE === "OPERATIONAL_OS" && d === "/")
          return "/app/dashboard";
        return d;
      };

      // P0: Rotas operacionais / app que não exigem revalidação para landing (dashboard, config, menu-builder, /app/install, /app/staff).
      // Em DEMO/PILOT com restaurant_id válido → nunca bloquear. Sem exceções.
      // /app/staff: STAFF_SESSION_LOCATION_CONTRACT — Staff usa Location (localStorage); não exige Core ativo.
      const isOperationalAppPath =
        pathname === "/dashboard" ||
        pathname.startsWith("/config") ||
        pathname === "/menu-builder" ||
        pathname === "/app/install" ||
        pathname === "/app/staff";
      const isPilot =
        typeof window !== "undefined" &&
        window.localStorage.getItem("chefiapp_pilot_mode") === "true";
      const isDemoOrPilot = isDocker || isDemo || isPilot;
      if (isOperationalAppPath && hasLocalOrg && isDemoOrPilot) {
        setLifecycleState(
          deriveLifecycleState({
            pathname,
            isAuthenticated: !!session?.user?.id,
            hasOrganization: true,
          })
        );
        if (mounted) {
          clearLoadingTimeout();
          setIsChecking(false);
        }
        return;
      }

      if (pathname === "/app/select-tenant" && !sealed) {
        if (mounted) {
          clearLoadingTimeout();
          setIsChecking(false);
        }
        return;
      }

      if (
        sealed &&
        pathname.startsWith("/app/") &&
        pathname !== "/app/select-tenant"
      ) {
        // Em Docker/local (DEMO/PILOT), permitir navegação mesmo sem sessão.
        // O tenant selado já define o “mundo” e evita loops de auth.
        if (isDocker) {
          if (mounted) {
            clearLoadingTimeout();
            setIsChecking(false);
          }
          return;
        }

        // Em prod, /app/* exige sessão.
        if (session?.user?.id) {
          if (mounted) {
            clearLoadingTimeout();
            setIsChecking(false);
          }
          return;
        }
      }

      // Bootstrap: temos tenant em storage — não recomeçar se já houver organização.
      if (
        pathname === "/bootstrap" &&
        (sealed ||
          (() => {
            const id =
              getTabIsolated("chefiapp_restaurant_id") ||
              (typeof window !== "undefined"
                ? window.localStorage.getItem("chefiapp_restaurant_id")
                : null);
            return !!id && !INVALID_OR_SEED_RESTAURANT_IDS.has(id);
          })())
      ) {
        setLifecycleState(
          deriveLifecycleState({
            pathname,
            isAuthenticated: !!session?.user?.id,
            hasOrganization: true,
          })
        );
        if (mounted) {
          clearLoadingTimeout();
          setIsChecking(false);
        }
        return;
      }

      const devStable = isDevStableMode();
      const debug = isDebugEnabled();
      const shouldLog = !devStable || debug;

      const userId = session?.user?.id;
      const fuseKey = `${userId ?? "anon"}::${pathname}`;
      const now = Date.now();
      if (
        lastCheckRef.current?.key === fuseKey &&
        now - lastCheckRef.current.ts < 1200
      )
        return;
      lastCheckRef.current = { key: fuseKey, ts: now };

      if (!session && !sessionLoading) {
        // Sem sessão: ainda podemos ter org local (bootstrap/pilot) — não entrar em loop.
        const lifecycleState = deriveLifecycleState({
          pathname,
          isAuthenticated: false,
          hasOrganization: hasLocalOrg,
        });
        setLifecycleState(lifecycleState);

        if (!isPathAllowedForState(pathname, lifecycleState)) {
          safeNavigate(resolveDestination(lifecycleState));
        }

        if (mounted) {
          clearLoadingTimeout();
          setIsChecking(false);
        }
        return;
      }

      try {
        if (!session?.user?.id) {
          if (mounted) {
            clearLoadingTimeout();
            setIsChecking(false);
          }
          return;
        }

        let hasOrg = false;
        let restaurantId: string | null = null;
        let currentBillingStatus: string | null = null;
        let isBootstrapComplete = false;

        if (isDocker) {
          const SEED_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";
          const sealedTenantId = getActiveTenant();
          let localRestaurantId: string | null =
            typeof window !== "undefined"
              ? getTabIsolated("chefiapp_restaurant_id") ||
                window.localStorage.getItem("chefiapp_restaurant_id")
              : null;
          // Em Docker o seed existe no Core (06-seed-enterprise); não limpar para permitir Dashboard carregar
          if (
            localRestaurantId &&
            INVALID_OR_SEED_RESTAURANT_IDS.has(localRestaurantId) &&
            localRestaurantId !== SEED_RESTAURANT_ID
          ) {
            clearActiveTenant();
            localRestaurantId = null;
          }
          // Migrar ID antigo mock-* para o UUID do pilot mock (evita 400/404 em installed_modules, caixa, etc.)
          if (
            localRestaurantId &&
            localRestaurantId.startsWith("mock-") &&
            typeof window !== "undefined"
          ) {
            try {
              const pilotMock = window.localStorage.getItem(
                "chefiapp_pilot_mock_restaurant"
              );
              if (pilotMock) {
                const row = JSON.parse(pilotMock) as { id?: string };
                if (row.id && UUID_REGEX.test(row.id)) {
                  setTabIsolated("chefiapp_restaurant_id", row.id);
                  window.localStorage.setItem("chefiapp_restaurant_id", row.id);
                  localRestaurantId = row.id;
                } else {
                  clearActiveTenant();
                  localRestaurantId = null;
                }
              } else {
                clearActiveTenant();
                localRestaurantId = null;
              }
            } catch {
              clearActiveTenant();
              localRestaurantId = null;
            }
          }
          // Docker + demo/pilot sem tenant: usar restaurante de seed para o Dashboard carregar
          if (
            !sealedTenantId &&
            !localRestaurantId &&
            isDemoOrPilot &&
            typeof window !== "undefined"
          ) {
            setTabIsolated("chefiapp_restaurant_id", SEED_RESTAURANT_ID);
            window.localStorage.setItem(
              "chefiapp_restaurant_id",
              SEED_RESTAURANT_ID
            );
            setActiveTenant(SEED_RESTAURANT_ID);
            localRestaurantId = SEED_RESTAURANT_ID;
          }
          hasOrg = !!sealedTenantId || !!localRestaurantId;
          restaurantId = sealedTenantId || localRestaurantId;
        } else {
          const client = await getTableClient();
          if (debug)
            console.log("[FlowGate] Fetching membership for", session.user.id);
          const { data: members, error: memberError } = await client
            .from("gm_restaurant_members")
            .select("restaurant_id, role")
            .eq("user_id", session.user.id);

          if (memberError) {
            // FASE E: falha de RPC não derruba sessão — derivar de tenant/localStorage
            if (debug)
              console.warn(
                "[FlowGate] Member check error (fallback):",
                memberError
              );
            const fallbackId =
              getActiveTenant() ||
              (typeof window !== "undefined"
                ? window.localStorage.getItem("chefiapp_restaurant_id")
                : null);
            hasOrg = !!isTenantSealed() || !!fallbackId;
            restaurantId = fallbackId;
          } else {
            const membersArray = Array.isArray(members)
              ? members
              : members
              ? [members]
              : [];
            hasOrg = membersArray.length > 0;
            if (membersArray.length === 1) {
              restaurantId = membersArray[0].restaurant_id;
            } else if (membersArray.length > 0) {
              restaurantId = getActiveTenant() || membersArray[0].restaurant_id;
            }
          }
        }

        if (!hasOrg) {
          const lifecycleState = deriveLifecycleState({
            pathname,
            isAuthenticated: true,
            hasOrganization: false,
          });
          setLifecycleState(lifecycleState);
          if (!isPathAllowedForState(pathname, lifecycleState)) {
            safeNavigate(resolveDestination(lifecycleState));
          }
          if (mounted) {
            clearLoadingTimeout();
            setIsChecking(false);
          }
          return;
        }

        if (restaurantId) {
          try {
            const restaurant = await getRestaurantStatus(restaurantId);
            if (restaurant) {
              currentBillingStatus = restaurant.billing_status;
              // Consideramos bootstrap completo quando o restaurante está ativo
              // ou publicado no Core (sem depender de onboarding_completed_at).
              isBootstrapComplete = restaurant.status === "active";
            } else {
              // 404 ou restaurante inexistente: limpar id inválido para evitar loop e 404 repetidos
              if (isDocker && typeof window !== "undefined") {
                if (debug)
                  console.warn(
                    "[FlowGate] Restaurant not found (404), clearing invalid id:",
                    restaurantId
                  );
                clearActiveTenant();
                hasOrg = false;
                const lifecycleStateNoOrg = deriveLifecycleState({
                  pathname,
                  isAuthenticated: !!session,
                  hasOrganization: false,
                });
                setLifecycleState(lifecycleStateNoOrg);
                if (!isPathAllowedForState(pathname, lifecycleStateNoOrg)) {
                  safeNavigate(resolveDestination(lifecycleStateNoOrg));
                }
                if (mounted) {
                  clearLoadingTimeout();
                  setIsChecking(false);
                }
                return;
              }
            }
          } catch {
            // Falha de RPC não derruba sessão (FASE E)
          }
        }

        const lifecycleState = deriveLifecycleState({
          pathname,
          isAuthenticated: !!session,
          hasOrganization: hasOrg,
        });
        setLifecycleState(lifecycleState);

        if (
          lifecycleState !== "READY_TO_OPERATE" &&
          !isPathAllowedForState(pathname, lifecycleState)
        ) {
          safeNavigate(resolveDestination(lifecycleState));
          if (mounted) {
            clearLoadingTimeout();
            setIsChecking(false);
          }
          return;
        }

        const systemState = deriveSystemState({
          hasOrganization: hasOrg,
          billingStatus: currentBillingStatus,
          isBootstrapComplete,
        });
        const state: UserState = {
          isAuthenticated: !!session,
          hasOrganization: hasOrg,
          hasRestaurant: hasOrg,
          currentPath: pathname,
          systemState,
        };

        const decision = resolveNextRoute(state);
        if (decision.type === "REDIRECT") {
          safeNavigate(decision.to);
        }

        if (mounted) {
          clearLoadingTimeout();
          setIsChecking(false);
        }
      } catch (err) {
        console.error("[FlowGate] Error:", err);
        if (mounted) {
          clearLoadingTimeout();
          setIsChecking(false);
        }
      }
    };

    checkFlow();

    return () => {
      mounted = false;
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
    // Depender de session?.user?.id evita loop "Maximum update depth exceeded":
    // session é um objeto; nova referência a cada render faz o effect re-correr e setLifecycleState de novo.
  }, [session?.user?.id, sessionLoading, location.pathname]);

  // Contrato ORE: apenas LOADING ou READY (children). Timeout não bloqueia — deixa páginas (ORE) decidir.
  if (isChecking) {
    return <GlobalLoadingView message="Verificando acesso..." />;
  }

  return <>{children}</>;
}
