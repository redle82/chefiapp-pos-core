/**
 * Payment Use Cases
 *
 * Application Layer facade for payment-related operations.
 * Orchestrates: domain invariants -> payment provider -> domain events -> metrics.
 *
 * NO React imports. Pure TypeScript orchestration.
 *
 * Bounded Context: Payment Processing
 */

import type { Order, Payment } from "../domain/order/types";
import type { UserRole } from "../core/context/ContextTypes";
import type { PaymentMethod } from "../domain/payment/types";
import {
  canProcessPayment,
  canRefund,
  validateTip,
} from "../domain/invariants/PaymentInvariants";
import { canSplitBill } from "../domain/invariants/OrderInvariants";
import { PaymentBroker } from "../core/payment/PaymentBroker";
import { saveTip, type TipType } from "../core/payment/TipService";
import {
  splitEqual,
  splitByItems,
  splitCustom,
  type SplitBillPart,
  type ItemAssignment,
} from "../core/orders/SplitBillService";
import {
  reconcilePayments as runReconciliation,
  type ReconciliationReport,
} from "../core/payment/PaymentReconciler";
import { updateOrderStatus } from "../core/infra/CoreOrdersApi";
import { emitDomainEvent } from "../domain/events/DomainEvents";
import { logAuditEvent } from "../core/audit/AuditService";
import { track } from "../analytics/track";
import { Logger } from "../core/logger";
import type { OrderSummaryItem } from "../pages/TPVMinimal/components/OrderSummaryPanel";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface ProcessPaymentParams {
  orderId: string;
  restaurantId: string;
  order: Order;
  method: PaymentMethod;
  amount: number;
  currency: string;
  tipCents?: number;
  tipType?: TipType;
  operatorId?: string;
  operatorName?: string;
  cashRegisterId?: string;
}

export interface RefundPaymentParams {
  paymentId: string;
  paymentIntentId: string;
  payment: Payment;
  role: UserRole;
  amount?: number;
  operatorId?: string;
  operatorName?: string;
  restaurantId: string;
}

export type SplitMode = "equal" | "by_items" | "custom";

export interface SplitBillParams {
  orderId: string;
  order: Order;
  mode: SplitMode;
  /** Required for "equal" mode. */
  numberOfPeople?: number;
  /** Required for "by_items" mode. */
  items?: OrderSummaryItem[];
  /** Required for "by_items" mode. */
  assignments?: ItemAssignment[];
  /** Required for "custom" mode. */
  customAmounts?: number[];
  totalCents: number;
  taxCents: number;
}

export interface ReconcilePaymentsParams {
  restaurantId: string;
  since?: Date;
}

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

/**
 * Process a payment for an order.
 *
 * 1. Validate canProcessPayment invariant.
 * 2. Validate tip if provided.
 * 3. Create payment via PaymentBroker.
 * 4. Save tip if provided.
 * 5. Update order status to PAID.
 * 6. Emit ORDER_PAID domain event.
 * 7. Track metrics.
 */
export async function processPayment(
  params: ProcessPaymentParams,
): Promise<Result<{ paymentIntentId: string; clientSecret: string }>> {
  // 1. Validate order can be paid
  const check = canProcessPayment(params.order);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Validate tip
  if (params.tipCents !== undefined && params.tipCents > 0) {
    const tipCheck = validateTip(params.tipCents, params.order.subtotal);
    if (!tipCheck.allowed) {
      return { success: false, error: tipCheck.reason };
    }
  }

  // 3. Create payment
  try {
    const paymentResult = await PaymentBroker.createPaymentIntent({
      orderId: params.orderId,
      amount: params.amount + (params.tipCents ?? 0),
      currency: params.currency,
      restaurantId: params.restaurantId,
      operatorId: params.operatorId,
      cashRegisterId: params.cashRegisterId,
    });

    // 4. Save tip (non-blocking)
    if (params.tipCents && params.tipCents > 0) {
      saveTip(params.restaurantId, {
        orderId: params.orderId,
        amountCents: params.tipCents,
        type: params.tipType ?? "fixed",
        operatorId: params.operatorId ?? null,
        operatorName: params.operatorName ?? null,
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        Logger.warn("[PaymentUseCases.processPayment] Failed to save tip", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    // 5. Mark order as PAID
    await updateOrderStatus({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      new_status: "paid",
      origin: "TPV_PAYMENT",
    });

    // 6. Emit domain event
    emitDomainEvent(
      {
        type: "ORDER_PAID",
        orderId: params.orderId,
        paymentId: paymentResult.id,
        totalCents: params.amount,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 7. Metrics
    track("payment.processed", {
      orderId: params.orderId,
      method: params.method,
      amount: params.amount,
      tipCents: params.tipCents ?? 0,
    });

    return {
      success: true,
      data: {
        paymentIntentId: paymentResult.id,
        clientSecret: paymentResult.clientSecret,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error processing payment";
    Logger.error("[PaymentUseCases.processPayment]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Refund a payment.
 *
 * 1. Validate canRefund invariant (role + payment status).
 * 2. Create refund via PaymentBroker.
 * 3. Log audit event.
 * 4. Emit PAYMENT_REFUNDED domain event.
 * 5. Track metrics.
 */
export async function refundPayment(
  params: RefundPaymentParams,
): Promise<Result<{ refundId: string; status: string; amount: number }>> {
  // 1. Validate
  const check = canRefund(params.payment, params.role, params.amount);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const refundResult = await PaymentBroker.createRefund({
      paymentIntentId: params.paymentIntentId,
      amount: params.amount,
    });

    // 3. Audit
    logAuditEvent({
      action: "PAYMENT_REFUNDED",
      orderId: params.payment.orderId,
      operatorId: params.operatorId ?? "",
      operatorName: params.operatorName ?? "",
      reason: `Refund of ${refundResult.amount} cents on payment ${params.paymentId}`,
      timestamp: new Date().toISOString(),
      metadata: {
        paymentId: params.paymentId,
        refundId: refundResult.refundId,
        amount: refundResult.amount,
        role: params.role,
      },
    }).catch(() => {});

    // 4. Emit domain event
    emitDomainEvent(
      {
        type: "PAYMENT_REFUNDED",
        paymentId: params.paymentId,
        amountCents: refundResult.amount,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 5. Metrics
    track("payment.refunded", {
      paymentId: params.paymentId,
      amount: refundResult.amount,
    });

    return { success: true, data: refundResult };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error processing refund";
    Logger.error("[PaymentUseCases.refundPayment]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Split a bill into multiple parts.
 *
 * 1. Validate canSplitBill invariant.
 * 2. Compute splits based on mode (equal, by_items, custom).
 * 3. Track metrics.
 */
export function splitBill(
  params: SplitBillParams,
): Result<{ parts: SplitBillPart[] }> {
  // 1. Validate
  const check = canSplitBill(params.order);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Compute splits
  try {
    let parts: SplitBillPart[];

    switch (params.mode) {
      case "equal": {
        if (!params.numberOfPeople || params.numberOfPeople < 2) {
          return { success: false, error: "At least 2 people required for equal split." };
        }
        parts = splitEqual(params.totalCents, params.taxCents, params.numberOfPeople);
        break;
      }
      case "by_items": {
        if (!params.items || !params.assignments) {
          return { success: false, error: "Items and assignments required for by-items split." };
        }
        parts = splitByItems(
          params.items,
          params.assignments,
          params.totalCents,
          params.taxCents,
        );
        break;
      }
      case "custom": {
        if (!params.customAmounts || params.customAmounts.length < 2) {
          return { success: false, error: "At least 2 custom amounts required." };
        }
        parts = splitCustom(params.customAmounts, params.totalCents, params.taxCents);
        break;
      }
      default:
        return { success: false, error: `Unknown split mode: ${params.mode as string}` };
    }

    // 3. Metrics
    track("payment.split_bill", {
      orderId: params.orderId,
      mode: params.mode,
      parts: parts.length,
    });

    return { success: true, data: { parts } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error splitting bill";
    Logger.error("[PaymentUseCases.splitBill]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Reconcile payments with external providers (Stripe).
 *
 * 1. Run PaymentReconciler.
 * 2. Track metrics.
 */
export async function reconcilePayments(
  params: ReconcilePaymentsParams,
): Promise<Result<ReconciliationReport>> {
  try {
    const report = await runReconciliation(params.restaurantId, params.since);

    // Metrics
    track("payment.reconciliation", {
      restaurantId: params.restaurantId,
      totalChecked: report.totalChecked,
      matched: report.matched,
      autoFixed: report.autoFixed,
      needsReview: report.needsReview,
    });

    return { success: true, data: report };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error during reconciliation";
    Logger.error("[PaymentUseCases.reconcilePayments]", { error: message });
    return { success: false, error: message };
  }
}
