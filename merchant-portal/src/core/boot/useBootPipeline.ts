/**
 * Boot Pipeline — State Machine Hook
 *
 * `useBootPipeline` orchestrates the boot sequence as a deterministic FSM
 * using `useReducer`. It runs "in shadow" alongside FlowGate in PR 1 —
 * FlowGate still owns navigation; this hook only observes and annotates.
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
import { useAuth } from "../auth/useAuth";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import type {
  AuthSnapshot,
  BootAction,
  BootSnapshot,
  TenantSnapshot,
} from "./BootState";
import {
  BOOT_TIMEOUTS,
  BootStep,
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

// ─── Types ────────────────────────────────────────────────────────────────

export interface BootPipelineResult {
  /** Current pipeline snapshot (full FSM state) */
  snapshot: BootSnapshot;
  /** Whether the pipeline has reached a terminal state */
  isTerminal: boolean;
  /** Whether the pipeline ended in an error */
  isError: boolean;
  /** Whether the pipeline is still in progress (checking/loading) */
  isLoading: boolean;
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
 * Run the boot pipeline as a React hook.
 *
 * In PR 1 (foundation), this hook runs in shadow mode:
 * - It observes AuthProvider + pathname changes
 * - It resolves tenant data from the input provided by FlowGate
 * - It does NOT perform navigation — FlowGate still owns `navigate()`
 *
 * FlowGate passes tenant data down via `feedTenant()` after its own
 * resolution logic runs. This avoids duplicate RPC calls.
 *
 * @param externalTenant - Tenant data fed by FlowGate after it resolves.
 *   When null, the pipeline waits at TENANT_LOADING until FlowGate provides it.
 */
export function useBootPipeline(
  externalTenant: TenantSnapshot | null,
): BootPipelineResult {
  const [snapshot, dispatch] = useReducer(
    instrumentedReducer,
    undefined,
    createInitialSnapshot,
  );

  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const isDocker = getBackendType() === BackendType.docker;

  // Refs for timeouts
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tenantTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRunRef = useRef(false);

  // ── Timeout budgets ──
  const timeouts = isDocker
    ? {
        auth: BOOT_TIMEOUTS.authDocker,
        tenant: BOOT_TIMEOUTS.tenantDocker,
        global: BOOT_TIMEOUTS.globalDocker,
      }
    : {
        auth: BOOT_TIMEOUTS.auth,
        tenant: BOOT_TIMEOUTS.tenant,
        global: BOOT_TIMEOUTS.global,
      };

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

  // ── Step 4: TENANT_LOADING → TENANT_RESOLVED (fed by FlowGate) ──
  useEffect(() => {
    if (snapshot.step !== BootStep.TENANT_LOADING) return;

    // Set tenant timeout
    tenantTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "TENANT_TIMEOUT" });
    }, timeouts.tenant);

    return () => {
      if (tenantTimeoutRef.current) {
        clearTimeout(tenantTimeoutRef.current);
        tenantTimeoutRef.current = null;
      }
    };
  }, [snapshot.step, timeouts.tenant]);

  // Watch for externalTenant from FlowGate
  useEffect(() => {
    if (snapshot.step !== BootStep.TENANT_LOADING) return;
    if (!externalTenant) return; // FlowGate hasn't resolved yet

    if (tenantTimeoutRef.current) {
      clearTimeout(tenantTimeoutRef.current);
      tenantTimeoutRef.current = null;
    }

    dispatch({ type: "TENANT_RESOLVED", tenant: externalTenant });
  }, [snapshot.step, externalTenant]);

  // ── Step 5: TENANT_RESOLVED → LIFECYCLE_DERIVED → ROUTE_DECIDING → BOOT_DONE ──
  useEffect(() => {
    if (snapshot.step !== BootStep.TENANT_RESOLVED) return;

    dispatch({ type: "LIFECYCLE_DERIVED" });
  }, [snapshot.step]);

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

      const destination = resolveBootDestination({
        auth: snapshot.auth,
        tenant: snapshot.tenant,
        pathname: location.pathname,
        search: location.search,
        lastRoute,
        isDocker,
        uiMode: CONFIG.UI_MODE,
      });

      dispatch({ type: "ROUTE_DECIDED", destination });
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
    if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    if (tenantTimeoutRef.current) clearTimeout(tenantTimeoutRef.current);
    if (globalTimeoutRef.current) clearTimeout(globalTimeoutRef.current);
    dispatch({ type: "RESET" });
  };

  return {
    snapshot,
    isTerminal: TERMINAL_STEPS.has(snapshot.step),
    isError:
      snapshot.step === BootStep.AUTH_TIMEOUT ||
      snapshot.step === BootStep.TENANT_ERROR ||
      snapshot.step === BootStep.TENANT_TIMEOUT ||
      snapshot.step === BootStep.ROUTE_ERROR,
    isLoading: !TERMINAL_STEPS.has(snapshot.step),
    reset,
  };
}
