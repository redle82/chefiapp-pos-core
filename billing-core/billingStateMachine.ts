/**
 * Billing State Machine — Single Source of Truth
 *
 * ALL billing enforcement logic reads from this module.
 * No other file may hardcode billing status arrays or transitions.
 *
 * Consumers:
 *   - docker-core/server/billing/churnRecoveryEngine.ts (churn → state transitions)
 *   - server/webhooks/stripeWebhookHandler.ts (Stripe → internal mapping)
 *   - docker-core/server/webhooks/stripeBillingSync.ts (simulated sync)
 *   - merchant-portal/src/components/operational/RequireOperational.tsx (route guard)
 *   - merchant-portal/src/hooks/useSubscription.ts (React state helpers)
 *   - merchant-portal/src/core/billing/featureGating.ts (feature gating)
 *   - billing-core/featureFlags.ts (module gating)
 *   - server/billing/enforcementGuard.ts (server-side RPC guard)
 *
 * @module billing-core/billingStateMachine
 */

// ============================================================================
// BILLING STATE TYPE
// ============================================================================

/**
 * All valid billing states in the system.
 *
 * Canonical mapping from Stripe:
 *   trialing         → trial
 *   active           → active
 *   past_due         → past_due
 *   past_due (churn) → past_due_limited → past_due_readonly
 *   canceled/unpaid  → canceled
 *   incomplete       → incomplete
 *   incomplete_expired → trial_expired
 *   paused           → paused
 */
export type BillingState =
  | "trial"
  | "trial_expired"
  | "active"
  | "past_due"
  | "past_due_limited"
  | "past_due_readonly"
  | "canceled"
  | "incomplete"
  | "paused";

/** All billing states as a runtime array (for validation & iteration). */
export const ALL_BILLING_STATES: readonly BillingState[] = [
  "trial",
  "trial_expired",
  "active",
  "past_due",
  "past_due_limited",
  "past_due_readonly",
  "canceled",
  "incomplete",
  "paused",
] as const;

/** Canonical named constants for billing state comparisons outside this module. */
export const BILLING_STATES = {
  TRIAL: "trial",
  TRIAL_EXPIRED: "trial_expired",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  PAST_DUE_LIMITED: "past_due_limited",
  PAST_DUE_READONLY: "past_due_readonly",
  CANCELED: "canceled",
  INCOMPLETE: "incomplete",
  PAUSED: "paused",
} as const satisfies Record<string, BillingState>;

// ============================================================================
// STATE GROUPS
// ============================================================================

/** States where the restaurant operates normally (full access). */
export const ACTIVE_STATES: readonly BillingState[] = [
  "trial",
  "active",
] as const;

/** States where operations continue but user sees payment warnings. */
export const WARNING_STATES: readonly BillingState[] = ["past_due"] as const;

/** States where most write operations are blocked; read + limited writes. */
export const LIMITED_STATES: readonly BillingState[] = [
  "past_due_limited",
] as const;

/** States where only read operations are allowed. */
export const READONLY_STATES: readonly BillingState[] = [
  "past_due_readonly",
] as const;

/** States where everything is blocked (except safe-harbor/billing pages). */
export const BLOCKED_STATES: readonly BillingState[] = [
  "trial_expired",
  "canceled",
  "incomplete",
  "paused",
] as const;

// ============================================================================
// ENFORCEMENT LEVELS
// ============================================================================

export type EnforcementLevel =
  | "full"
  | "warning"
  | "limited"
  | "readonly"
  | "blocked";

const STATE_TO_ENFORCEMENT: Record<BillingState, EnforcementLevel> = {
  trial: "full",
  active: "full",
  past_due: "warning",
  past_due_limited: "limited",
  past_due_readonly: "readonly",
  trial_expired: "blocked",
  canceled: "blocked",
  incomplete: "blocked",
  paused: "blocked",
};

/**
 * Get the enforcement level for a billing state.
 *
 * @returns "full" | "warning" | "limited" | "readonly" | "blocked"
 */
export function getEnforcementLevel(status: BillingState): EnforcementLevel {
  return STATE_TO_ENFORCEMENT[status] ?? "blocked";
}

// ============================================================================
// TRANSITION MAP
// ============================================================================

/**
 * Allowed state transitions. Each key lists the states it can move to.
 * Transition not in this map → rejected.
 */
export const ALLOWED_TRANSITIONS: Record<
  BillingState,
  readonly BillingState[]
> = {
  trial: ["active", "trial_expired", "past_due", "canceled"],
  trial_expired: ["active", "canceled"],
  active: ["past_due", "canceled", "paused", "incomplete"],
  past_due: ["active", "past_due_limited", "canceled", "paused"],
  past_due_limited: ["active", "past_due_readonly", "canceled", "paused"],
  past_due_readonly: ["active", "paused", "canceled"],
  canceled: ["active", "trial"],
  incomplete: ["active", "canceled", "trial_expired"],
  paused: ["active", "canceled"],
};

/**
 * Check if a transition from one state to another is allowed.
 * Identity transitions (same state) are always allowed (idempotent).
 */
export function canTransition(from: BillingState, to: BillingState): boolean {
  if (from === to) return true; // Idempotent
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

// ============================================================================
// SURFACES
// ============================================================================

/**
 * Application surfaces where billing enforcement applies.
 */
export type Surface =
  | "TPV"
  | "KDS"
  | "DASHBOARD"
  | "WORKFORCE"
  | "BILLING"
  | "SETUP"
  | "CONSOLE"
  | "API";

/** Surfaces that are always accessible regardless of billing state (safe harbor). */
export const SAFE_HARBOR_SURFACES: readonly Surface[] = [
  "BILLING",
  "SETUP",
  "CONSOLE",
] as const;

// ============================================================================
// OPERATIONAL ALLOWANCE MATRIX
// ============================================================================

/**
 * Full enforcement matrix: (BillingState, Surface) → allowed?
 *
 * Rules:
 *   - ACTIVE_STATES → all surfaces allowed
 *   - WARNING_STATES → all surfaces allowed (with warning banner)
 *   - LIMITED_STATES → DASHBOARD + safe harbor only
 *   - READONLY_STATES → DASHBOARD + safe harbor only
 *   - BLOCKED_STATES → safe harbor only
 *   - Safe harbor (BILLING, SETUP, CONSOLE) → always allowed
 */
export function isOperationalAllowed(
  status: BillingState,
  surface: Surface,
): boolean {
  // Safe harbor surfaces are always accessible
  if ((SAFE_HARBOR_SURFACES as readonly string[]).includes(surface)) {
    return true;
  }

  const level = getEnforcementLevel(status);

  switch (level) {
    case "full":
      return true;
    case "warning":
      return true; // All surfaces, with payment warning
    case "limited":
      return surface === "DASHBOARD";
    case "readonly":
      return surface === "DASHBOARD";
    case "blocked":
      return false;
    default:
      return false;
  }
}

// ============================================================================
// STRIPE STATUS MAPPING
// ============================================================================

/**
 * Canonical Stripe subscription status → internal BillingState mapping.
 * This is the SINGLE source of truth. No other file should define this mapping.
 */
export const STRIPE_STATUS_MAP: Record<string, BillingState> = {
  trialing: "trial",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  cancelled: "canceled", // British English variant
  unpaid: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "trial_expired",
  paused: "paused",
};

/**
 * Map a Stripe subscription status string to a BillingState.
 * Falls back to "trial" for unknown statuses.
 */
export function mapStripeStatus(stripeStatus: string): BillingState {
  return STRIPE_STATUS_MAP[stripeStatus.toLowerCase()] ?? "trial";
}

// ============================================================================
// LEGACY STATUS NORMALIZATION
// ============================================================================

/**
 * Normalize legacy/uppercase statuses from older DB migrations.
 * Used by useSubscription.ts to normalize DB values.
 */
export function normalizeLegacyStatus(dbStatus: string): BillingState {
  const map: Record<string, BillingState> = {
    // Current canonical values
    trial: "trial",
    trial_expired: "trial_expired",
    active: "active",
    past_due: "past_due",
    past_due_limited: "past_due_limited",
    past_due_readonly: "past_due_readonly",
    canceled: "canceled",
    incomplete: "incomplete",
    paused: "paused",
    // Stripe "trialing" → normalize
    trialing: "trial",
    // Legacy uppercase from old migration
    TRIAL: "trial",
    ACTIVE: "active",
    PAST_DUE: "past_due",
    SUSPENDED: "paused",
    CANCELLED: "canceled",
  };
  return map[dbStatus] ?? "trial";
}

// ============================================================================
// OPERATION TYPES (for server-side enforcement)
// ============================================================================

/**
 * Server-side operation types that can be gated by billing state.
 */
export type OperationType =
  | "create_order"
  | "update_order"
  | "close_register"
  | "claim_task"
  | "generate_tasks"
  | "create_shift"
  | "read_data";

/**
 * Operations allowed per enforcement level.
 *
 *   full    → all operations
 *   warning → all operations (with warning)
 *   limited → read_data only
 *   readonly → read_data only
 *   blocked → nothing (not even read_data through operational surfaces)
 */
const OPERATIONS_BY_LEVEL: Record<EnforcementLevel, readonly OperationType[]> =
  {
    full: [
      "create_order",
      "update_order",
      "close_register",
      "claim_task",
      "generate_tasks",
      "create_shift",
      "read_data",
    ],
    warning: [
      "create_order",
      "update_order",
      "close_register",
      "claim_task",
      "generate_tasks",
      "create_shift",
      "read_data",
    ],
    limited: ["read_data"],
    readonly: ["read_data"],
    blocked: [],
  };

/**
 * Check if a specific operation is allowed for a given billing state.
 */
export function isOperationAllowed(
  status: BillingState,
  operation: OperationType,
): boolean {
  const level = getEnforcementLevel(status);
  return OPERATIONS_BY_LEVEL[level].includes(operation);
}

// ============================================================================
// UTILITY: Validate billing state string
// ============================================================================

/**
 * Type guard: check if a string is a valid BillingState.
 */
export function isBillingState(value: string): value is BillingState {
  return (ALL_BILLING_STATES as readonly string[]).includes(value);
}
