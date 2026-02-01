import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useSupabaseAuth } from "../auth/useSupabaseAuth";
import { getRestaurantStatus } from "../billing/coreBillingApi";
import { getTableClient } from "../infra/coreOrSupabaseRpc";
import { isDebugEnabled, isDevStableMode } from "../runtime/devStableMode";
import {
  extractTenantFromPath,
  getActiveTenant,
  isTenantSealed,
} from "../tenant/TenantResolver";
import type { OnboardingStatus, UserState } from "./CoreFlow";
import { resolveNextRoute } from "./CoreFlow";

/**
 * FlowGate - O Executor do Contrato (DB-First Edition + Multi-Tenant)
 *
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 */

const TENANT_EXEMPT_ROUTES = ["/app/select-tenant", "/app/access-denied"];

export function FlowGate({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isChecking, setIsChecking] = useState(true);
  const lastCheckRef = useRef<{ key: string; ts: number }>({ key: "", ts: 0 });
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [forceRender, setForceRender] = useState(false);

  const LOADING_TIMEOUT_MS = 15000;

  useEffect(() => {
    let mounted = true;

    loadingTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        console.warn(
          `[FlowGate] Loading timeout (${LOADING_TIMEOUT_MS}ms) - forcing render`,
        );
        setIsChecking(false);
        setForceRender(true);
      }
    }, LOADING_TIMEOUT_MS);

    const checkFlow = async () => {
      const pathname = location.pathname;
      const sealed = isTenantSealed();

      if (pathname === "/app/select-tenant" && !sealed) {
        if (mounted) setIsChecking(false);
        return;
      }

      if (
        sealed &&
        pathname.startsWith("/app/") &&
        pathname !== "/app/select-tenant"
      ) {
        if (session?.user?.id) {
          if (mounted) setIsChecking(false);
          return;
        }
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
        if (!sealed && pathname.startsWith("/app")) {
          navigate("/auth", { replace: true });
          if (mounted) setIsChecking(false);
          return;
        }
      }

      try {
        const client = await getTableClient();
        if (!session?.user?.id) {
          if (mounted) setIsChecking(false);
          return;
        }
        if (debug)
          console.log("[FlowGate] Fetching membership for", session.user.id);
        const { data: members, error: memberError } = await client
          .from("gm_restaurant_members")
          .select("restaurant_id, role")
          .eq("user_id", session.user.id);

        if (memberError) {
          if (debug)
            console.error("[FlowGate] Member check error:", memberError);
          throw memberError;
        }

        const membersArray = Array.isArray(members)
          ? members
          : members
          ? [members]
          : [];
        const membershipCount = membersArray.length;
        const hasOrg = membershipCount > 0;
        let status: OnboardingStatus = "not_started";
        let restaurantId: string | null = null;
        let currentBillingStatus: string | null = null;
        const urlTenantId = extractTenantFromPath(pathname);

        if (hasOrg) {
          const sealedTenantId = getActiveTenant();
          if (membershipCount === 1) {
            restaurantId = membersArray[0].restaurant_id;
          } else if (sealedTenantId) {
            restaurantId = sealedTenantId;
          }

          if (restaurantId) {
            const restaurant = await getRestaurantStatus(restaurantId);
            if (restaurant) {
              currentBillingStatus = restaurant.billing_status;
              status = restaurant.onboarding_completed_at
                ? "completed"
                : "not_started";
            }
          }
        }

        const state: UserState = {
          isAuthenticated: !!session,
          hasOrganization: hasOrg,
          onboardingStatus: status,
          currentPath: pathname,
        };

        const decision = resolveNextRoute(state);
        if (decision.type === "REDIRECT" && pathname !== decision.to) {
          navigate(decision.to, { replace: true });
        }

        if (mounted) setIsChecking(false);
      } catch (err) {
        console.error("[FlowGate] Error:", err);
        if (mounted) setIsChecking(false);
      }
    };

    checkFlow();

    return () => {
      mounted = false;
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [session, sessionLoading, location.pathname, forceRender]);

  if (isChecking && !forceRender) {
    return <GlobalLoadingView message="Verificando acesso..." />;
  }

  return <>{children}</>;
}
