/**
 * FinancialGuardrails — Action threshold checks for financial operations.
 *
 * Provides guardrail checks ADDITIONAL to RBAC. Both must pass for an
 * action to be allowed. Even if RBAC permits "create discounts", the
 * guardrail may require a higher role for large discounts.
 *
 * Each check returns a GuardrailResult indicating whether the action is
 * allowed, whether it needs a confirmation dialog, a reason, or audit.
 */

import type { Role } from "./RBACService";
import {
  getGuardrailConfig,
  isManagerOrAbove,
  isOwner,
  type GuardrailConfig,
} from "./GuardrailConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuardrailResult {
  /** Whether the action is allowed for this role at this threshold. */
  allowed: boolean;
  /** If true, show a ConfirmationDialog before proceeding. */
  requiresConfirmation: boolean;
  /** If true, the operator must provide a written reason. */
  requiresReason: boolean;
  /** If true, the action must be written to the audit log. */
  auditRequired: boolean;
  /** Human-readable i18n key describing why the guardrail triggered. */
  message?: string;
}

// ---------------------------------------------------------------------------
// Discount check
// ---------------------------------------------------------------------------

/**
 * Check whether the given role can apply a discount of `discountPercent`.
 *
 * Thresholds (defaults):
 *   <= 10%: any operator
 *   11-20%: any operator + audit log
 *   21-50%: manager/owner only + audit log
 *   > 50%: owner only + audit log + confirmation dialog
 *   100%: owner only + audit log + reason required
 */
export function checkDiscountPermission(
  role: Role,
  discountPercent: number,
  restaurantId?: string,
): GuardrailResult {
  const config = getGuardrailConfig(restaurantId);
  const { discount } = config;

  // 100% discount: owner only + reason required
  if (discountPercent >= 100) {
    if (!isOwner(role)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        requiresReason: false,
        auditRequired: false,
        message: "guardrails.discountFullOwnerOnly",
      };
    }
    return {
      allowed: true,
      requiresConfirmation: true,
      requiresReason: discount.fullDiscountRequiresReason,
      auditRequired: true,
      message: "guardrails.discountFullRequiresReason",
    };
  }

  // > 50% (owner only threshold): owner only + confirmation
  if (discountPercent > discount.ownerOnlyAbovePercent) {
    if (!isOwner(role)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        requiresReason: false,
        auditRequired: false,
        message: "guardrails.discountExceedsOwnerThreshold",
      };
    }
    return {
      allowed: true,
      requiresConfirmation: true,
      requiresReason: false,
      auditRequired: true,
      message: "guardrails.discountHighRequiresConfirmation",
    };
  }

  // > 20% (manager threshold): manager/owner only + audit
  if (discountPercent > discount.managerRequiredAbovePercent) {
    if (!isManagerOrAbove(role)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        requiresReason: false,
        auditRequired: false,
        message: "guardrails.discountExceedsManagerThreshold",
      };
    }
    return {
      allowed: true,
      requiresConfirmation: false,
      requiresReason: false,
      auditRequired: true,
    };
  }

  // > 10% (audit threshold): any operator + audit log
  if (discountPercent > discount.auditLogAbovePercent) {
    return {
      allowed: true,
      requiresConfirmation: false,
      requiresReason: false,
      auditRequired: true,
    };
  }

  // <= 10%: any operator, no extra checks
  return {
    allowed: true,
    requiresConfirmation: false,
    requiresReason: false,
    auditRequired: false,
  };
}

// ---------------------------------------------------------------------------
// Refund check
// ---------------------------------------------------------------------------

/**
 * Check whether the given role can issue a refund of `amountCents`.
 *
 * Thresholds (defaults):
 *   Any amount: manager/owner only
 *   > 10000 (100 EUR): owner only + audit
 *   > 50000 (500 EUR): owner only + audit + reason required
 */
export function checkRefundPermission(
  role: Role,
  amountCents: number,
  restaurantId?: string,
): GuardrailResult {
  const config = getGuardrailConfig(restaurantId);
  const { refund } = config;

  // All refunds require at least manager
  if (refund.managerRequired && !isManagerOrAbove(role)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      requiresReason: false,
      auditRequired: false,
      message: "guardrails.refundRequiresManager",
    };
  }

  // > 500 EUR: owner only + reason
  if (amountCents > refund.reasonRequiredAboveCents) {
    if (!isOwner(role)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        requiresReason: false,
        auditRequired: false,
        message: "guardrails.refundExceedsOwnerThreshold",
      };
    }
    return {
      allowed: true,
      requiresConfirmation: true,
      requiresReason: true,
      auditRequired: true,
      message: "guardrails.refundHighRequiresReason",
    };
  }

  // > 100 EUR: owner only + audit
  if (amountCents > refund.ownerOnlyAboveCents) {
    if (!isOwner(role)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        requiresReason: false,
        auditRequired: false,
        message: "guardrails.refundExceedsOwnerThreshold",
      };
    }
    return {
      allowed: true,
      requiresConfirmation: true,
      requiresReason: false,
      auditRequired: true,
    };
  }

  // Any other amount: manager/owner allowed
  return {
    allowed: true,
    requiresConfirmation: false,
    requiresReason: false,
    auditRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Cancel order check
// ---------------------------------------------------------------------------

/**
 * Check whether the given role can cancel an order with total `orderTotalCents`.
 *
 * Thresholds (defaults):
 *   > 10000 (100 EUR): manager/owner only
 *   Any amount: allowed but audit-logged
 */
export function checkCancelPermission(
  role: Role,
  orderTotalCents: number,
  restaurantId?: string,
): GuardrailResult {
  const config = getGuardrailConfig(restaurantId);
  const { order } = config;

  if (orderTotalCents > order.cancelManagerRequiredAboveCents) {
    if (!isManagerOrAbove(role)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        requiresReason: false,
        auditRequired: false,
        message: "guardrails.cancelExceedsManagerThreshold",
      };
    }
    return {
      allowed: true,
      requiresConfirmation: true,
      requiresReason: true,
      auditRequired: true,
      message: "guardrails.cancelHighRequiresConfirmation",
    };
  }

  return {
    allowed: true,
    requiresConfirmation: false,
    requiresReason: false,
    auditRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Cash register alert check
// ---------------------------------------------------------------------------

export interface CashRegisterAlertResult extends GuardrailResult {
  /** The absolute difference in cents. */
  differenceCents: number;
  /** The percentage difference from expected. */
  differencePercent: number;
}

/**
 * Check whether the cash register balance difference triggers alerts.
 *
 * @param expectedCents - Expected amount based on opening + transactions
 * @param actualCents   - Actual counted amount
 *
 * Returns:
 *   Opening: difference > 20% → warning
 *   Closing: difference > 5000 cents (50 EUR) → audit + notification
 */
export function checkCashRegisterAlert(
  expectedCents: number,
  actualCents: number,
  restaurantId?: string,
): CashRegisterAlertResult {
  const config = getGuardrailConfig(restaurantId);
  const { cashRegister } = config;

  const differenceCents = Math.abs(actualCents - expectedCents);
  const differencePercent =
    expectedCents > 0 ? (differenceCents / expectedCents) * 100 : 0;

  // Closing: large absolute difference
  if (differenceCents > cashRegister.closingBalanceAuditCents) {
    return {
      allowed: true,
      requiresConfirmation: true,
      requiresReason: true,
      auditRequired: true,
      message: "guardrails.cashRegisterLargeDifference",
      differenceCents,
      differencePercent,
    };
  }

  // Opening: percentage difference warning
  if (differencePercent > cashRegister.openingBalanceWarningPercent) {
    return {
      allowed: true,
      requiresConfirmation: false,
      requiresReason: false,
      auditRequired: true,
      message: "guardrails.cashRegisterPercentageDifference",
      differenceCents,
      differencePercent,
    };
  }

  // No alert
  return {
    allowed: true,
    requiresConfirmation: false,
    requiresReason: false,
    auditRequired: false,
    differenceCents,
    differencePercent,
  };
}

// ---------------------------------------------------------------------------
// Void transaction check
// ---------------------------------------------------------------------------

/**
 * Void transactions always require manager/owner + reason.
 */
export function checkVoidPermission(role: Role): GuardrailResult {
  if (!isManagerOrAbove(role)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      requiresReason: false,
      auditRequired: false,
      message: "guardrails.voidRequiresManager",
    };
  }
  return {
    allowed: true,
    requiresConfirmation: true,
    requiresReason: true,
    auditRequired: true,
  };
}

// ---------------------------------------------------------------------------
// Reopen order check
// ---------------------------------------------------------------------------

/**
 * Reopening an order always requires manager/owner + reason + audit.
 */
export function checkReopenPermission(role: Role): GuardrailResult {
  if (!isManagerOrAbove(role)) {
    return {
      allowed: false,
      requiresConfirmation: false,
      requiresReason: false,
      auditRequired: false,
      message: "guardrails.reopenRequiresManager",
    };
  }
  return {
    allowed: true,
    requiresConfirmation: true,
    requiresReason: true,
    auditRequired: true,
  };
}
