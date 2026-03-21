/**
 * Billing Enforcement Guard — Server-side operational gating
 *
 * Centralized guard for all RPCs that modify restaurant state.
 * Uses billingStateMachine as the single source of truth.
 *
 * Guarded RPCs:
 *   - create_order_atomic
 *   - update_order_status
 *   - close_cash_register_atomic
 *   - claim_task
 *   - generate_tasks_if_idle
 *   - create_shift
 *
 * @module server/billing/enforcementGuard
 */

import {
  BLOCKED_STATES,
  getEnforcementLevel,
  isBillingState,
  isOperationAllowed,
  type BillingState,
  type EnforcementLevel,
  type OperationType,
} from "../../billing-core/billingStateMachine";

// ============================================================================
// ERROR CLASS
// ============================================================================

export interface BillingEnforcementError {
  code: "SUBSCRIPTION_BLOCKED" | "SUBSCRIPTION_READONLY";
  status: BillingState;
  enforcementLevel: EnforcementLevel;
  message: string;
}

export class SubscriptionBlockedError extends Error {
  public readonly code: "SUBSCRIPTION_BLOCKED" | "SUBSCRIPTION_READONLY";
  public readonly status: BillingState;
  public readonly enforcementLevel: EnforcementLevel;

  constructor(details: BillingEnforcementError) {
    super(details.message);
    this.name = "SubscriptionBlockedError";
    this.code = details.code;
    this.status = details.status;
    this.enforcementLevel = details.enforcementLevel;
  }

  toJSON(): BillingEnforcementError {
    return {
      code: this.code,
      status: this.status,
      enforcementLevel: this.enforcementLevel,
      message: this.message,
    };
  }
}

// ============================================================================
// RPC → OPERATION TYPE MAP
// ============================================================================

/**
 * Map RPC function names to billing operation types.
 */
const RPC_OPERATION_MAP: Record<string, OperationType> = {
  create_order_atomic: "create_order",
  update_order_status: "update_order",
  close_cash_register_atomic: "close_register",
  claim_task: "claim_task",
  generate_tasks_if_idle: "generate_tasks",
  create_shift: "create_shift",
};

/**
 * Get the OperationType for an RPC name.
 * Returns null if the RPC is not gated by billing.
 */
export function getOperationForRpc(rpcName: string): OperationType | null {
  return RPC_OPERATION_MAP[rpcName] ?? null;
}

// ============================================================================
// ENFORCEMENT GUARD
// ============================================================================

/**
 * Assert that an operation is allowed given the current billing status.
 *
 * @param status         Current billing_status from gm_restaurants
 * @param operationType  The type of operation being attempted
 * @throws {SubscriptionBlockedError} if operation is not allowed
 */
export function assertOperationalAllowed(
  status: string,
  operationType: OperationType,
): void {
  const [fallbackBlockedState] = BLOCKED_STATES;

  // Unknown status → block (fail-closed)
  if (!isBillingState(status)) {
    throw new SubscriptionBlockedError({
      code: "SUBSCRIPTION_BLOCKED",
      status: fallbackBlockedState,
      enforcementLevel: "blocked",
      message: `Unknown billing status "${status}". Operation "${operationType}" blocked.`,
    });
  }

  const billingState = status as BillingState;
  const level = getEnforcementLevel(billingState);

  if (isOperationAllowed(billingState, operationType)) {
    return; // OK
  }

  // Determine error code based on enforcement level
  const code: "SUBSCRIPTION_BLOCKED" | "SUBSCRIPTION_READONLY" =
    level === "readonly" || level === "limited"
      ? "SUBSCRIPTION_READONLY"
      : "SUBSCRIPTION_BLOCKED";

  throw new SubscriptionBlockedError({
    code,
    status: billingState,
    enforcementLevel: level,
    message: `Operation "${operationType}" is not allowed in billing state "${billingState}" (enforcement: ${level}).`,
  });
}

/**
 * Assert that an RPC call is allowed given the current billing status.
 * Convenience wrapper that maps RPC name → operation type.
 *
 * @param status   Current billing_status from gm_restaurants
 * @param rpcName  The RPC function name (e.g. "create_order_atomic")
 * @throws {SubscriptionBlockedError} if operation is not allowed
 */
export function assertRpcAllowed(status: string, rpcName: string): void {
  const op = getOperationForRpc(rpcName);
  if (!op) return; // RPC not gated by billing
  assertOperationalAllowed(status, op);
}

/**
 * Non-throwing version: check if an operation is allowed.
 * Returns the enforcement error details or null if allowed.
 */
export function checkOperationalAllowed(
  status: string,
  operationType: OperationType,
): BillingEnforcementError | null {
  try {
    assertOperationalAllowed(status, operationType);
    return null;
  } catch (err) {
    if (err instanceof SubscriptionBlockedError) {
      return err.toJSON();
    }
    throw err;
  }
}
