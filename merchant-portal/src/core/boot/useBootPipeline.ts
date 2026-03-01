/**
 * Boot Pipeline — State Machine Hook
 *
 * `useBootPipeline` orchestrates the boot sequence as a deterministic FSM
 * using `useReducer`. In PR 2 this hook is the single authority for startup
 * orchestration (auth, tenant, lifecycle, route decision).
 *
 * Steps:
 *   BOOT_START → AUTH_CHECKING → AUTH_RESOLVED → TENANT_LOADING
 *     → TENANT_RESOLVED → LIFECYCLE_DERIVED → ROUTE_DECIDING → BOOT_DONE
 *
 * Each step has a per-step timeout. If any step exceeds its budget,
 * the pipeline transitions to an error terminal and the BootFallbackScreen
 * is shown with actionable options.
 *
 * @module core/boot/useBootPipeline
 */

import { useEffect, useReducer, useRef } from "react";
import { useLocation } from "react-router-dom";
import { CONFIG } from "../../config";
import { useLifecycleStateContext } from "../../context/LifecycleStateContext";
import { useAuth } from "../auth/useAuth";
import { getRestaurantStatus } from "../billing/coreBillingApi";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { getTableClient } from "../infra/coreRpc";
import { deriveLifecycleState } from "../lifecycle/LifecycleState";
import {
  INVALID_OR_SEED_RESTAURANT_IDS,
  SOFIA_RESTAURANT_ID,
  TRIAL_RESTAURANT_ID,
  hasOperationalRestaurant,
} from "../readiness/operationalRestaurant";
import { isTrial } from "../runtime";
import type { LaunchContext } from "../runtime/LaunchContext";
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import {
  clearActiveTenant,
  getActiveTenant,
  isTenantSealed,
  readTenantIdWithLegacyFallback,
  setActiveTenant,
} from "../tenant/TenantResolver";
import type { AuthSnapshot, BootAction, BootSnapshot } from "./BootState";
import {
  BootStep,
  EMPTY_TENANT,
  TERMINAL_STEPS,
  bootReducer,
  createInitialSnapshot,
} from "./BootState";
import {
  logBootSummary,
  logBootTransition,
  markBootStep,
} from "./bootTelemetry";
import { resolveBootDestination } from "./resolveBootDestination";
import {
  deriveDeviceType,
  getBootCheckKey,
  getBootTimeoutBudget,
  isBootErrorStep,
  shouldResetPipelineForUserChange,
} from "./runtime/BootRuntimeEngine";

// ─── Types ────────────────────────────────────────────────────────────────

export interface BootPipelineResult {
  /** Current pipeline snapshot (full FSM state) */
  snapshot: BootSnapshot;
  /** Whether the pipeline has reached a terminal state */
  isTerminal: boolean;
  /** Whether the pipeline ended in an error */
  isError: boolean;
  /** Whether startup orchestration is still running */
  isBooting: boolean;
  /** Whether the pipeline is still in progress (checking/loading) */
  isLoading: boolean;
  /** Launch context consumed by OS surfaces after boot success */
  launchContext: LaunchContext | null;
  /** Reset the pipeline (e.g., on retry) */
  reset: () => void;
}

// ─── Instrumented reducer ─────────────────────────────────────────────────

/**
 * Wraps the pure bootReducer with telemetry side-effects.
 * This is safe because useReducer re-renders after the reducer returns.
 */
function instrumentedReducer(
  state: BootSnapshot,
  action: BootAction,
): BootSnapshot {
  const prevStep = state.step;
  const next = bootReducer(state, action);

  // Telemetry: mark + log on step change
  if (next.step !== prevStep) {
    markBootStep(next.step);
    logBootTransition(prevStep, next);

    // Summary on terminal
    if (TERMINAL_STEPS.has(next.step)) {
      logBootSummary(next);
    }
  }

  return next;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * Run the boot pipeline as a React hook and single startup authority.
 */
export function useBootPipeline(): BootPipelineResult {
  const [snapshot, dispatch] = useReducer(
    instrumentedReducer,
    undefined,
    createInitialSnapshot,
  );

  const { session, loading: authLoading } = useAuth();
  const { setLifecycleState } = useLifecycleStateContext();
  const location = useLocation();
  const isDocker = getBackendType() === BackendType.docker;
  const checkKeyRef = useRef<string>("");

  // Refs for timeouts
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tenantTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRunRef = useRef(false);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  // ── Timeout budgets ──
  const timeouts = getBootTimeoutBudget(isDocker);

  // ── Global timeout ──
  useEffect(() => {
    if (TERMINAL_STEPS.has(snapshot.step)) return;

    globalTimeoutRef.current = setTimeout(() => {
      if (!TERMINAL_STEPS.has(snapshot.step)) {
        // Global timeout: whichever step we're on, transition to its error
        if (
          snapshot.step === BootStep.AUTH_CHECKING ||
          snapshot.step === BootStep.BOOT_START
        ) {
          dispatch({ type: "AUTH_TIMEOUT" });
        } else if (snapshot.step === BootStep.TENANT_LOADING) {
          dispatch({ type: "TENANT_TIMEOUT" });
        } else {
          dispatch({
            type: "ROUTE_ERROR",
            error: new Error(`Global boot timeout at step: ${snapshot.step}`),
          });
        }
      }
    }, timeouts.global);

    return () => {
      if (globalTimeoutRef.current) {
        clearTimeout(globalTimeoutRef.current);
        globalTimeoutRef.current = null;
      }
    };
  }, [snapshot.step, timeouts.global]);

  // ── Step 1: BOOT_START → AUTH_CHECKING ──
  useEffect(() => {
    if (snapshot.step !== BootStep.BOOT_START) return;
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    markBootStep(BootStep.BOOT_START);
    dispatch({ type: "AUTH_CHECK_START" });
  }, [snapshot.step]);

  // ── Step 2: AUTH_CHECKING → AUTH_RESOLVED (watch AuthProvider) ──
  useEffect(() => {
    if (snapshot.step !== BootStep.AUTH_CHECKING) return;

    // Set auth timeout
    authTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "AUTH_TIMEOUT" });
    }, timeouts.auth);

    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, [snapshot.step, timeouts.auth]);

  // Watch for auth loading to complete
  useEffect(() => {
    if (snapshot.step !== BootStep.AUTH_CHECKING) return;
    if (authLoading) return; // Still loading — wait

    // Auth resolved
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }

    const auth: AuthSnapshot = {
      isAuthenticated: !!session?.user?.id,
      userId: session?.user?.id ?? null,
      loading: false,
    };

    dispatch({ type: "AUTH_RESOLVED", auth });
  }, [snapshot.step, authLoading, session?.user?.id]);

  // ── Step 3: AUTH_RESOLVED → TENANT_LOADING ──
  useEffect(() => {
    if (snapshot.step !== BootStep.AUTH_RESOLVED) return;
    dispatch({ type: "TENANT_LOAD_START" });
  }, [snapshot.step]);

  const resolveTenantSnapshot = async () => {
    const sealed = isTenantSealed();
    const userId = session?.user?.id ?? null;
    const debug = !isDocker;

    let localRestaurantId: string | null = readTenantIdWithLegacyFallback();

    const hasLocalOrg =
      sealed || hasOperationalRestaurant({ restaurant_id: localRestaurantId });

    if (!userId) {
      return {
        ...EMPTY_TENANT,
        hasOrg: hasLocalOrg,
        restaurantId: getActiveTenant() || localRestaurantId,
        sealed,
      };
    }

    let hasOrg = false;
    let restaurantId: string | null = null;
    let role: string | undefined;
    let billingStatus: string | null = null;
    let isBootstrapComplete = false;
    let activated = false;

    if (isDocker) {
      const sealedTenantId = getActiveTenant();

      if (
        localRestaurantId &&
        INVALID_OR_SEED_RESTAURANT_IDS.has(localRestaurantId) &&
        localRestaurantId !== SOFIA_RESTAURANT_ID
      ) {
        clearActiveTenant();
        localRestaurantId = null;
      }

      if (
        localRestaurantId &&
        localRestaurantId.startsWith("mock-") &&
        typeof window !== "undefined"
      ) {
        try {
          const pilotMock = window.localStorage.getItem(
            "chefiapp_pilot_mock_restaurant",
          );
          if (pilotMock) {
            const row = JSON.parse(pilotMock) as { id?: string };
            if (
              row.id &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                row.id,
              )
            ) {
              setActiveTenant(row.id);
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

      const isPilot =
        typeof window !== "undefined" &&
        window.localStorage.getItem("chefiapp_pilot_mode") === "true";
      const isTrialOrPilot = isDocker || isTrial || isPilot;

      if (!sealedTenantId && !localRestaurantId && isTrialOrPilot) {
        const trialMode =
          getTabIsolated("chefiapp_trial_mode") === "true" ||
          (typeof window !== "undefined" &&
            window.localStorage.getItem("chefiapp_trial_mode") === "true");
        const defaultRestaurantId = trialMode
          ? TRIAL_RESTAURANT_ID
          : SOFIA_RESTAURANT_ID;
        setActiveTenant(defaultRestaurantId);
        localRestaurantId = defaultRestaurantId;
      }

      hasOrg = !!sealedTenantId || !!localRestaurantId;
      restaurantId = sealedTenantId || localRestaurantId;
      role = "owner";
    } else {
      try {
        const client = await getTableClient();
        const { data: members, error } = await client
          .from("gm_restaurant_members")
          .select("restaurant_id, role")
          .eq("user_id", userId);

        if (error) {
          if (debug)
            console.warn("[useBootPipeline] Membership fallback:", error);
          const fallbackId = readTenantIdWithLegacyFallback();
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
            role = membersArray[0].role;
          } else if (membersArray.length > 1) {
            restaurantId = getActiveTenant() || membersArray[0].restaurant_id;
            role = membersArray.find(
              (m) => m.restaurant_id === restaurantId,
            )?.role;
          }
        }
      } catch (error) {
        if (debug) console.warn("[useBootPipeline] Membership error:", error);
        const fallbackId = readTenantIdWithLegacyFallback();
        hasOrg = !!fallbackId;
        restaurantId = fallbackId;
      }
    }

    if (!hasOrg) {
      return { ...EMPTY_TENANT, sealed: isTenantSealed() };
    }

    if (restaurantId) {
      try {
        const restaurant = await getRestaurantStatus(restaurantId);
        if (restaurant) {
          billingStatus = restaurant.billing_status;
          isBootstrapComplete = restaurant.status === "active";
          activated = !!restaurant.onboarding_completed_at;
        } else if (isDocker) {
          clearActiveTenant();
          return { ...EMPTY_TENANT, sealed: false };
        }
      } catch {
        // do not fail closed here; keep auth/session alive
      }
    }

    return {
      hasOrg,
      restaurantId,
      role,
      billingStatus,
      activated,
      sealed: isTenantSealed(),
      isBootstrapComplete,
    };
  };

  // ── Step 4: TENANT_LOADING → TENANT_RESOLVED ──
  useEffect(() => {
    if (snapshot.step !== BootStep.TENANT_LOADING) return;
    const checkKey = getBootCheckKey(snapshot.auth.userId, location.pathname);
    if (checkKeyRef.current === checkKey) return;
    checkKeyRef.current = checkKey;

    let cancelled = false;

    // Set tenant timeout
    tenantTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "TENANT_TIMEOUT" });
    }, timeouts.tenant);

    resolveTenantSnapshot()
      .then((tenant) => {
        if (cancelled) return;
        if (tenantTimeoutRef.current) {
          clearTimeout(tenantTimeoutRef.current);
          tenantTimeoutRef.current = null;
        }
        dispatch({ type: "TENANT_RESOLVED", tenant });
      })
      .catch((error) => {
        if (cancelled) return;
        if (tenantTimeoutRef.current) {
          clearTimeout(tenantTimeoutRef.current);
          tenantTimeoutRef.current = null;
        }
        dispatch({
          type: "TENANT_ERROR",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      cancelled = true;
      if (tenantTimeoutRef.current) {
        clearTimeout(tenantTimeoutRef.current);
        tenantTimeoutRef.current = null;
      }
    };
  }, [
    location.pathname,
    isDocker,
    session?.user?.id,
    snapshot.auth.userId,
    snapshot.step,
    timeouts.tenant,
  ]);

  // ── Step 5: TENANT_RESOLVED → LIFECYCLE_DERIVED → ROUTE_DECIDING → BOOT_DONE ──
  useEffect(() => {
    if (snapshot.step !== BootStep.TENANT_RESOLVED) return;

    const lifecycleState = deriveLifecycleState({
      pathname: location.pathname,
      isAuthenticated: snapshot.auth.isAuthenticated,
      hasOrganization: snapshot.tenant.hasOrg,
    });
    setLifecycleState(lifecycleState);

    dispatch({ type: "LIFECYCLE_DERIVED" });
  }, [
    location.pathname,
    setLifecycleState,
    snapshot.auth.isAuthenticated,
    snapshot.step,
    snapshot.tenant.hasOrg,
  ]);

  useEffect(() => {
    if (snapshot.step !== BootStep.LIFECYCLE_DERIVED) return;

    try {
      let lastRoute: string | null = null;
      try {
        if (typeof window !== "undefined") {
          lastRoute =
            sessionStorage.getItem("chefiapp_lastRoute") ||
            window.localStorage.getItem("chefiapp_lastRoute");
        }
      } catch {
        // ignore
      }

      const decision = resolveBootDestination({
        auth: snapshot.auth,
        tenant: snapshot.tenant,
        pathname: location.pathname,
        search: location.search,
        lastRoute,
        isDocker,
        uiMode: CONFIG.UI_MODE,
      });

      dispatch({ type: "ROUTE_DECIDED", decision });
    } catch (err) {
      dispatch({
        type: "ROUTE_ERROR",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [snapshot.step, location.pathname, location.search, isDocker]);

  // ── ROUTE_DECIDING → BOOT_DONE ──
  useEffect(() => {
    if (snapshot.step !== BootStep.ROUTE_DECIDING) return;
    dispatch({ type: "BOOT_DONE" });
  }, [snapshot.step]);

  // ── Cleanup all timeouts on unmount ──
  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
      if (tenantTimeoutRef.current) clearTimeout(tenantTimeoutRef.current);
      if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
    };
  }, []);

  // ── Reset handler ──
  const reset = () => {
    hasRunRef.current = false;
    checkKeyRef.current = "";
    if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    if (tenantTimeoutRef.current) clearTimeout(tenantTimeoutRef.current);
    if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
    dispatch({ type: "RESET" });
  };

  const lifecycleState = deriveLifecycleState({
    pathname: location.pathname,
    isAuthenticated: snapshot.auth.isAuthenticated,
    hasOrganization: snapshot.tenant.hasOrg,
  });

  const launchContext: LaunchContext | null =
    snapshot.step === BootStep.BOOT_DONE && snapshot.decision?.type === "ALLOW"
      ? {
          userId: snapshot.auth.userId ?? "anonymous",
          tenantId: snapshot.tenant.restaurantId ?? "none",
          role: snapshot.tenant.role ?? "owner",
          billingStatus: snapshot.tenant.billingStatus ?? "unknown",
          lifecycleState,
          deviceType: deriveDeviceType(location.pathname),
        }
      : null;

  useEffect(() => {
    const currentUserId = session?.user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    if (previousUserId === undefined) {
      previousUserIdRef.current = currentUserId;
      return;
    }
    if (shouldResetPipelineForUserChange(previousUserId, currentUserId)) {
      reset();
      previousUserIdRef.current = currentUserId;
    }
  }, [session?.user?.id]);

  return {
    snapshot,
    isTerminal: TERMINAL_STEPS.has(snapshot.step),
    isError: isBootErrorStep(snapshot.step),
    isBooting: !TERMINAL_STEPS.has(snapshot.step),
    isLoading: !TERMINAL_STEPS.has(snapshot.step),
    launchContext,
    reset,
  };
}
