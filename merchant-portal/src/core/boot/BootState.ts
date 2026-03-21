/**
 * Boot Pipeline — State Machine Types
 *
 * Defines the FSM contract for the boot sequence:
 *   AUTH_CHECKING → TENANT_LOADING → LIFECYCLE_DERIVED → ROUTE_DECIDING → BOOT_DONE
 *
 * Each step has a typed snapshot so diagnostics can pinpoint exactly
 * where the pipeline stalled. No XState — plain useReducer.
 *
 * @module core/boot/BootState
 */

// ─── Boot Steps (FSM nodes) ──────────────────────────────────────────────

/**
 * Ordered steps of the boot pipeline.
 * Happy path: BOOT_START → AUTH_CHECKING → AUTH_RESOLVED → TENANT_LOADING
 *   → TENANT_RESOLVED → LIFECYCLE_DERIVED → ROUTE_DECIDING → BOOT_DONE
 *
 * Error branches land on terminal states that trigger BootFallbackScreen.
 */
export enum BootStep {
  /** Initial state before anything runs */
  BOOT_START = "BOOT_START",
  /** Waiting for AuthProvider session */
  AUTH_CHECKING = "AUTH_CHECKING",
  /** Session resolved (authenticated or anonymous) */
  AUTH_RESOLVED = "AUTH_RESOLVED",
  /** Fetching tenant memberships from Core */
  TENANT_LOADING = "TENANT_LOADING",
  /** Tenant resolved (has org or no org) */
  TENANT_RESOLVED = "TENANT_RESOLVED",
  /** Lifecycle + SystemState derived from tenant data */
  LIFECYCLE_DERIVED = "LIFECYCLE_DERIVED",
  /** resolveBootDestination running */
  ROUTE_DECIDING = "ROUTE_DECIDING",
  /** Terminal success — pipeline done, UI can render */
  BOOT_DONE = "BOOT_DONE",

  // ── Error terminals ──
  /** Auth step exceeded its timeout */
  AUTH_TIMEOUT = "AUTH_TIMEOUT",
  /** Tenant fetch failed (network / RPC error) */
  TENANT_ERROR = "TENANT_ERROR",
  /** Tenant step exceeded its timeout */
  TENANT_TIMEOUT = "TENANT_TIMEOUT",
  /** Route decision threw */
  ROUTE_ERROR = "ROUTE_ERROR",
}

/** Steps that represent a completed (terminal) pipeline — success or failure. */
export const TERMINAL_STEPS: ReadonlySet<BootStep> = new Set([
  BootStep.BOOT_DONE,
  BootStep.AUTH_TIMEOUT,
  BootStep.TENANT_ERROR,
  BootStep.TENANT_TIMEOUT,
  BootStep.ROUTE_ERROR,
]);

/** Steps that represent an error terminal. */
export const ERROR_STEPS: ReadonlySet<BootStep> = new Set([
  BootStep.AUTH_TIMEOUT,
  BootStep.TENANT_ERROR,
  BootStep.TENANT_TIMEOUT,
  BootStep.ROUTE_ERROR,
]);

// ─── Boot Reason Codes ───────────────────────────────────────────────────

/**
 * Structured reason code for every boot exit path.
 * Maps 1:1 to diagnostic messages and telemetry events.
 *
 * Convention: DOMAIN_OUTCOME (e.g. AUTH_NOT_AUTHENTICATED, TENANT_MULTI_SELECT)
 */
export type BootReasonCode =
  // Auth outcomes
  | "AUTH_NOT_AUTHENTICATED"
  | "AUTH_ANONYMOUS_PUBLIC"
  | "AUTH_SESSION_READY"
  | "AUTH_TIMEOUT"
  // Tenant outcomes
  | "TENANT_NONE"
  | "TENANT_SINGLE"
  | "TENANT_MULTI_SELECT"
  | "TENANT_SEALED"
  | "TENANT_DOCKER_DEFAULT"
  | "TENANT_FETCH_ERROR"
  | "TENANT_TIMEOUT"
  | "TENANT_RESTAURANT_NOT_FOUND"
  // Lifecycle / route outcomes
  | "LIFECYCLE_VISITOR"
  | "LIFECYCLE_BOOTSTRAP_REQUIRED"
  | "LIFECYCLE_READY"
  | "ROUTE_PUBLIC_BYPASS"
  | "ROUTE_OPERATIONAL_FAST_PATH"
  | "ROUTE_ALLOW"
  | "ROUTE_REDIRECT"
  | "ROUTE_ERROR"
  // Pipeline-level
  | "BOOT_FAST_PATH"
  | "BOOT_TIMEOUT_GLOBAL";

// ─── Auth Snapshot ────────────────────────────────────────────────────────

export interface AuthSnapshot {
  /** Whether a valid session was found */
  isAuthenticated: boolean;
  /** User ID from session (null if anonymous) */
  userId: string | null;
  /** Whether AuthProvider is still loading */
  loading: boolean;
}

// ─── Tenant Snapshot ──────────────────────────────────────────────────────

export interface TenantSnapshot {
  /** User has at least one organization/restaurant */
  hasOrg: boolean;
  /** Resolved restaurant UUID (null if no org or multi-select pending) */
  restaurantId: string | null;
  /** Billing status from Core (null if not fetched) */
  billingStatus: string | null;
  /** Restaurant has been activated (onboarding_completed_at != null) */
  activated: boolean;
  /** Tenant is sealed in TabIsolatedStorage */
  sealed: boolean;
  /** Bootstrap complete (restaurant status === 'active') */
  isBootstrapComplete: boolean;
}

/** Default tenant snapshot — used before tenant resolution. */
export const EMPTY_TENANT: TenantSnapshot = {
  hasOrg: false,
  restaurantId: null,
  billingStatus: null,
  activated: false,
  sealed: false,
  isBootstrapComplete: false,
};

// ─── Boot Destination ─────────────────────────────────────────────────────

export interface BootDestination {
  /** "ALLOW" = render children; "REDIRECT" = navigate away */
  type: "ALLOW" | "REDIRECT";
  /** Target path when type === "REDIRECT" */
  to?: string;
  /** Human-readable reason (from CoreFlow) */
  reason?: string;
  /** Structured reason code for telemetry */
  reasonCode: BootReasonCode;
}

// ─── Boot Snapshot (full pipeline state) ──────────────────────────────────

/**
 * Immutable snapshot of the entire boot pipeline at any point in time.
 * This is the `state` in useReducer. Diagnostics serialize this for logs.
 */
export interface BootSnapshot {
  /** Current FSM step */
  step: BootStep;
  /** Auth data (populated after AUTH_RESOLVED) */
  auth: AuthSnapshot;
  /** Tenant data (populated after TENANT_RESOLVED) */
  tenant: TenantSnapshot;
  /** Final navigation decision (populated after ROUTE_DECIDING) */
  destination: BootDestination | null;
  /** Wall-clock ms since BOOT_START */
  elapsedMs: number;
  /** Error object if pipeline is in an error terminal */
  error: Error | null;
  /** Monotonic timestamp when BOOT_START fired (performance.now()) */
  startedAt: number;
}

/** Factory for the initial BootSnapshot. */
export function createInitialSnapshot(): BootSnapshot {
  return {
    step: BootStep.BOOT_START,
    auth: { isAuthenticated: false, userId: null, loading: true },
    tenant: { ...EMPTY_TENANT },
    destination: null,
    elapsedMs: 0,
    error: null,
    startedAt: performance.now(),
  };
}

// ─── Reducer Actions ──────────────────────────────────────────────────────

export type BootAction =
  | { type: "AUTH_CHECK_START" }
  | { type: "AUTH_RESOLVED"; auth: AuthSnapshot }
  | { type: "AUTH_TIMEOUT" }
  | { type: "TENANT_LOAD_START" }
  | { type: "TENANT_RESOLVED"; tenant: TenantSnapshot }
  | { type: "TENANT_ERROR"; error: Error }
  | { type: "TENANT_TIMEOUT" }
  | { type: "LIFECYCLE_DERIVED" }
  | { type: "ROUTE_DECIDED"; destination: BootDestination }
  | { type: "ROUTE_ERROR"; error: Error }
  | { type: "BOOT_DONE" }
  | { type: "RESET" };

// ─── Reducer ──────────────────────────────────────────────────────────────

function elapsed(state: BootSnapshot): number {
  return Math.round(performance.now() - state.startedAt);
}

/**
 * Pure reducer for the boot pipeline FSM.
 * Each action transitions to exactly one step — no conditional branching.
 */
export function bootReducer(
  state: BootSnapshot,
  action: BootAction,
): BootSnapshot {
  switch (action.type) {
    case "AUTH_CHECK_START":
      return {
        ...state,
        step: BootStep.AUTH_CHECKING,
        elapsedMs: elapsed(state),
      };

    case "AUTH_RESOLVED":
      return {
        ...state,
        step: BootStep.AUTH_RESOLVED,
        auth: action.auth,
        elapsedMs: elapsed(state),
      };

    case "AUTH_TIMEOUT":
      return {
        ...state,
        step: BootStep.AUTH_TIMEOUT,
        elapsedMs: elapsed(state),
        error: new Error(
          `Auth did not resolve within timeout (${elapsed(state)}ms)`,
        ),
      };

    case "TENANT_LOAD_START":
      return {
        ...state,
        step: BootStep.TENANT_LOADING,
        elapsedMs: elapsed(state),
      };

    case "TENANT_RESOLVED":
      return {
        ...state,
        step: BootStep.TENANT_RESOLVED,
        tenant: action.tenant,
        elapsedMs: elapsed(state),
      };

    case "TENANT_ERROR":
      return {
        ...state,
        step: BootStep.TENANT_ERROR,
        elapsedMs: elapsed(state),
        error: action.error,
      };

    case "TENANT_TIMEOUT":
      return {
        ...state,
        step: BootStep.TENANT_TIMEOUT,
        elapsedMs: elapsed(state),
        error: new Error(
          `Tenant resolution did not complete within timeout (${elapsed(
            state,
          )}ms)`,
        ),
      };

    case "LIFECYCLE_DERIVED":
      return {
        ...state,
        step: BootStep.LIFECYCLE_DERIVED,
        elapsedMs: elapsed(state),
      };

    case "ROUTE_DECIDED":
      return {
        ...state,
        step: BootStep.ROUTE_DECIDING,
        destination: action.destination,
        elapsedMs: elapsed(state),
      };

    case "ROUTE_ERROR":
      return {
        ...state,
        step: BootStep.ROUTE_ERROR,
        elapsedMs: elapsed(state),
        error: action.error,
      };

    case "BOOT_DONE":
      return {
        ...state,
        step: BootStep.BOOT_DONE,
        elapsedMs: elapsed(state),
      };

    case "RESET":
      return createInitialSnapshot();

    default:
      return state;
  }
}

// ─── Timeout Configuration ────────────────────────────────────────────────

/**
 * Per-step timeout budgets (ms).
 * Individual steps get their own budget; global timeout is the hard ceiling.
 */
export const BOOT_TIMEOUTS = {
  /** Max time to wait for AuthProvider to resolve */
  auth: 8_000,
  /** Max time to wait for tenant fetch from Core */
  tenant: 6_000,
  /** Hard ceiling for the entire pipeline */
  global: 12_000,
  /** Docker environments get shorter timeouts (local = fast) */
  authDocker: 4_000,
  tenantDocker: 3_000,
  globalDocker: 6_000,
} as const;
