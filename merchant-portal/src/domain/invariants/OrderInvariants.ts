/**
 * Order Invariants
 *
 * Pure business rules for order operations.
 * No side effects, no DB calls, no React dependencies.
 *
 * Bounded Context: Order Management
 * - Validates state transitions and authorization for order mutations.
 * - Each function returns { allowed, reason? } for uniform guard composition.
 */

import type { Order, OrderStatus } from "../order/types";
import type { UserRole } from "../../core/context/ContextTypes";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface InvariantResult {
  allowed: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Discount descriptor (matches what the POS passes)
// ---------------------------------------------------------------------------

export interface DiscountDescriptor {
  /** Discount amount in cents */
  amountCents: number;
  /** Optional minimum order total in cents to qualify */
  minOrderCents?: number;
  /** ISO date string — discount expires after this date */
  expiresAt?: string;
  /** Maximum number of uses allowed (undefined = unlimited) */
  maxUses?: number;
  /** Current number of uses already recorded */
  currentUses?: number;
}

// ---------------------------------------------------------------------------
// Modifiable statuses
// ---------------------------------------------------------------------------

const MODIFIABLE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "OPEN",
  "PREPARING",
]);

const ELEVATED_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "manager",
  "owner",
]);

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * Only OPEN or PREPARING orders can be modified (items added/removed).
 * DRAFT is not in the current OrderStatus enum, but OPEN is the initial state.
 */
export function canModifyOrder(order: Order): InvariantResult {
  if (MODIFIABLE_STATUSES.has(order.status)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Order in status "${order.status}" cannot be modified. Only OPEN or PREPARING orders are editable.`,
  };
}

/**
 * Any active order can be cancelled by any role, but cancelling a PAID order
 * requires manager or owner authorization.
 */
export function canCancelOrder(order: Order, role: UserRole): InvariantResult {
  if (order.status === "CANCELLED") {
    return { allowed: false, reason: "Order is already cancelled." };
  }

  if (order.status === "PAID") {
    if (!ELEVATED_ROLES.has(role)) {
      return {
        allowed: false,
        reason: "Only managers or owners can cancel a PAID order.",
      };
    }
    return { allowed: true };
  }

  // OPEN, PREPARING, READY, DELIVERED — any role can cancel
  return { allowed: true };
}

/**
 * Reopening moves a closed/paid/cancelled order back to OPEN.
 * Requires elevated role and a non-empty reason (audit compliance).
 */
export function canReopenOrder(
  order: Order,
  role: UserRole,
  reason: string,
): InvariantResult {
  if (!ELEVATED_ROLES.has(role)) {
    return {
      allowed: false,
      reason: "Only managers or owners can reopen orders.",
    };
  }

  if (!reason.trim()) {
    return {
      allowed: false,
      reason: "A reason must be provided to reopen an order.",
    };
  }

  if (order.status === "OPEN" || order.status === "PREPARING") {
    return {
      allowed: false,
      reason: `Order is already in "${order.status}" status — reopening is unnecessary.`,
    };
  }

  return { allowed: true };
}

/**
 * Validates whether a discount can be applied to the current order.
 *
 * Checks:
 *  - Order must be modifiable (OPEN/PREPARING).
 *  - Discount amount must be positive and not exceed order subtotal.
 *  - Minimum order threshold (if set) must be met.
 *  - Discount must not be expired.
 *  - Max uses must not be exceeded.
 */
export function canApplyDiscount(
  order: Order,
  discount: DiscountDescriptor,
): InvariantResult {
  const modifiable = canModifyOrder(order);
  if (!modifiable.allowed) {
    return {
      allowed: false,
      reason: `Cannot apply discount: ${modifiable.reason}`,
    };
  }

  if (discount.amountCents <= 0) {
    return { allowed: false, reason: "Discount amount must be greater than zero." };
  }

  if (discount.amountCents > order.subtotal) {
    return {
      allowed: false,
      reason: `Discount (${discount.amountCents}) exceeds order subtotal (${order.subtotal}).`,
    };
  }

  if (
    discount.minOrderCents !== undefined &&
    order.subtotal < discount.minOrderCents
  ) {
    return {
      allowed: false,
      reason: `Order subtotal (${order.subtotal}) does not meet minimum (${discount.minOrderCents}) for this discount.`,
    };
  }

  if (discount.expiresAt) {
    const expiry = new Date(discount.expiresAt).getTime();
    if (Date.now() > expiry) {
      return { allowed: false, reason: "Discount has expired." };
    }
  }

  if (
    discount.maxUses !== undefined &&
    discount.currentUses !== undefined &&
    discount.currentUses >= discount.maxUses
  ) {
    return {
      allowed: false,
      reason: `Discount has reached its maximum number of uses (${discount.maxUses}).`,
    };
  }

  return { allowed: true };
}

/**
 * Split bill is only available once the order has been sent to the kitchen
 * (PREPARING or later) and is not yet fully settled (PAID/CANCELLED).
 */
export function canSplitBill(order: Order): InvariantResult {
  if (order.status === "PAID") {
    return { allowed: false, reason: "Order is already paid — cannot split." };
  }
  if (order.status === "CANCELLED") {
    return { allowed: false, reason: "Order is cancelled — cannot split." };
  }
  if (order.status === "OPEN") {
    return {
      allowed: false,
      reason: "Order must be sent to the kitchen before splitting the bill.",
    };
  }
  if (order.items.length === 0) {
    return { allowed: false, reason: "Order has no items to split." };
  }

  return { allowed: true };
}
