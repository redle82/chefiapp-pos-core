/**
 * Payment Invariants
 *
 * Pure business rules for payment operations.
 * No side effects, no DB calls, no React dependencies.
 *
 * Bounded Context: Payment Processing
 * - Guards for payment creation, refunds, tips, and reconciliation.
 */

import type { Order, Payment } from "../order/types";
import type { UserRole } from "../../core/context/ContextTypes";
import type { InvariantResult } from "./OrderInvariants";

// ---------------------------------------------------------------------------
// Elevated roles
// ---------------------------------------------------------------------------

const ELEVATED_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "manager",
  "owner",
]);

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * An order can be paid when:
 *  - It has at least one item.
 *  - Its total is greater than zero.
 *  - It is not already PAID or CANCELLED.
 */
export function canProcessPayment(order: Order): InvariantResult {
  if (order.status === "PAID") {
    return { allowed: false, reason: "Order is already paid." };
  }
  if (order.status === "CANCELLED") {
    return { allowed: false, reason: "Cannot pay a cancelled order." };
  }
  if (order.items.length === 0) {
    return { allowed: false, reason: "Order has no items." };
  }
  if (order.total <= 0) {
    return { allowed: false, reason: "Order total must be greater than zero." };
  }

  return { allowed: true };
}

/**
 * A payment can be refunded when:
 *  - The payment status is "completed".
 *  - The refund amount (if specified) does not exceed the original amount.
 *  - The operator has an elevated role (manager/owner).
 */
export function canRefund(
  payment: Payment,
  role: UserRole,
  refundAmountCents?: number,
): InvariantResult {
  if (payment.status !== "completed") {
    return {
      allowed: false,
      reason: `Payment status is "${payment.status}" — only completed payments can be refunded.`,
    };
  }

  if (!ELEVATED_ROLES.has(role)) {
    return {
      allowed: false,
      reason: "Only managers or owners can issue refunds.",
    };
  }

  if (refundAmountCents !== undefined) {
    if (refundAmountCents <= 0) {
      return { allowed: false, reason: "Refund amount must be greater than zero." };
    }
    if (refundAmountCents > payment.amount) {
      return {
        allowed: false,
        reason: `Refund amount (${refundAmountCents}) exceeds original payment (${payment.amount}).`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Tip cannot exceed 100% of the subtotal.
 * Both values are expected in cents (integers).
 */
export function validateTip(
  tipCents: number,
  subtotalCents: number,
): InvariantResult {
  if (tipCents < 0) {
    return { allowed: false, reason: "Tip cannot be negative." };
  }
  if (subtotalCents <= 0) {
    return { allowed: false, reason: "Subtotal must be greater than zero to add a tip." };
  }
  if (tipCents > subtotalCents) {
    return {
      allowed: false,
      reason: `Tip (${tipCents}) exceeds 100% of subtotal (${subtotalCents}).`,
    };
  }

  return { allowed: true };
}

/**
 * A payment can be reconciled (matched against an external provider record)
 * only if it has a completed status and carries an external reference.
 */
export function canReconcile(payment: Payment & { externalReference?: string }): InvariantResult {
  if (payment.status !== "completed") {
    return {
      allowed: false,
      reason: `Payment status is "${payment.status}" — only completed payments can be reconciled.`,
    };
  }

  if (!payment.externalReference) {
    return {
      allowed: false,
      reason: "Payment has no external reference — cannot reconcile.",
    };
  }

  return { allowed: true };
}
