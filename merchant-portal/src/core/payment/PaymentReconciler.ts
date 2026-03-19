/**
 * PaymentReconciler - Compares Stripe payment intents with local order statuses.
 *
 * Fetches recent payment intents from Stripe (via Core RPC) and cross-references
 * them with local orders. Identifies mismatches (e.g., Stripe says "succeeded"
 * but order is still "OPEN") and auto-fixes them.
 *
 * ANTI-SUPABASE §4: All reads/writes go through Docker Core.
 */

import { Logger } from "../logger";
import { logAuditEvent } from "../audit/AuditService";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReconciliationMismatch {
  orderId: string;
  paymentIntentId: string;
  stripeStatus: string;
  localOrderStatus: string;
  localPaymentStatus: string | null;
  action: "auto_fixed" | "needs_review";
  detail: string;
}

export interface ReconciliationReport {
  /** When the reconciliation ran. */
  timestamp: string;
  /** Restaurant that was reconciled. */
  restaurantId: string;
  /** Period covered (since). */
  since: string;
  /** Total Stripe payment intents checked. */
  totalChecked: number;
  /** Payment intents that matched local state. */
  matched: number;
  /** Payment intents with mismatches. */
  mismatches: ReconciliationMismatch[];
  /** Mismatches that were auto-corrected. */
  autoFixed: number;
  /** Mismatches that need manual review. */
  needsReview: number;
  /** Errors encountered during reconciliation. */
  errors: string[];
}

interface StripePaymentIntentSummary {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  created: number;
}

interface LocalOrderRow {
  id: string;
  status: string;
  payment_status?: string;
  payment_intent_id?: string;
  total?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given a Stripe PI status, what should the local order status be?
 * Returns null if the PI status doesn't imply a specific order status.
 */
function expectedOrderStatus(stripeStatus: string): string | null {
  switch (stripeStatus) {
    case "succeeded":
      return "PAID";
    case "canceled":
      return null; // Canceled PIs don't necessarily mean canceled order
    default:
      return null;
  }
}

/**
 * Given a Stripe PI status, what should the local payment status be?
 */
function expectedPaymentStatus(stripeStatus: string): string | null {
  switch (stripeStatus) {
    case "succeeded":
      return "completed";
    case "canceled":
      return "failed";
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
    case "processing":
      return "pending";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reconcile Stripe payment intents with local order statuses.
 *
 * @param restaurantId - The restaurant to reconcile.
 * @param since - How far back to look (defaults to 24 hours).
 * @returns A detailed reconciliation report.
 */
export async function reconcilePayments(
  restaurantId: string,
  since?: Date,
): Promise<ReconciliationReport> {
  const sinceDate = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    restaurantId,
    since: sinceDate.toISOString(),
    totalChecked: 0,
    matched: 0,
    mismatches: [],
    autoFixed: 0,
    needsReview: 0,
    errors: [],
  };

  const core = getDockerCoreFetchClient();

  // Step 1: Fetch recent payment intents from Stripe via Core RPC
  let stripeIntents: StripePaymentIntentSummary[] = [];
  try {
    const res = await core.rpc("stripe-payment", {
      action: "list-payment-intents",
      restaurant_id: restaurantId,
      since: sinceDate.toISOString(),
    });

    if (res.error) {
      report.errors.push(`Failed to fetch Stripe PIs: ${res.error.message}`);
      Logger.error("[PaymentReconciler] Failed to fetch Stripe PIs", res.error);
      return report;
    }

    stripeIntents = (res.data as StripePaymentIntentSummary[] | null) ?? [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    report.errors.push(`Stripe fetch error: ${msg}`);
    Logger.error("[PaymentReconciler] Stripe fetch error", { error: msg });
    return report;
  }

  report.totalChecked = stripeIntents.length;

  if (stripeIntents.length === 0) {
    Logger.info("[PaymentReconciler] No payment intents found for period");
    return report;
  }

  // Step 2: Collect order IDs from PI metadata
  const orderIdMap = new Map<string, StripePaymentIntentSummary>();
  for (const pi of stripeIntents) {
    const orderId = pi.metadata?.order_id;
    if (orderId) {
      orderIdMap.set(orderId, pi);
    }
  }

  if (orderIdMap.size === 0) {
    report.matched = stripeIntents.length;
    Logger.info("[PaymentReconciler] No PIs with order_id metadata found");
    return report;
  }

  // Step 3: Fetch local orders
  const orderIds = Array.from(orderIdMap.keys());
  let localOrders: LocalOrderRow[] = [];
  try {
    const res = await core
      .from("gm_orders")
      .select("id,status,payment_status,payment_intent_id,total")
      .in("id", orderIds);

    if (res.error) {
      report.errors.push(`Failed to fetch local orders: ${res.error.message}`);
      Logger.error("[PaymentReconciler] Failed to fetch local orders", res.error);
      return report;
    }

    localOrders = (res.data as LocalOrderRow[] | null) ?? [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    report.errors.push(`Local orders fetch error: ${msg}`);
    return report;
  }

  // Build lookup
  const localOrderMap = new Map<string, LocalOrderRow>();
  for (const order of localOrders) {
    localOrderMap.set(order.id, order);
  }

  // Step 4: Compare and reconcile
  for (const [orderId, pi] of orderIdMap) {
    const localOrder = localOrderMap.get(orderId);

    if (!localOrder) {
      // Order exists in Stripe but not locally — needs review
      report.mismatches.push({
        orderId,
        paymentIntentId: pi.id,
        stripeStatus: pi.status,
        localOrderStatus: "NOT_FOUND",
        localPaymentStatus: null,
        action: "needs_review",
        detail: `Order ${orderId} referenced in Stripe PI ${pi.id} but not found locally.`,
      });
      report.needsReview++;
      continue;
    }

    const expectedOrder = expectedOrderStatus(pi.status);
    const expectedPayment = expectedPaymentStatus(pi.status);

    // Check if order status matches expectation
    const orderMismatch =
      expectedOrder !== null && localOrder.status !== expectedOrder;
    const paymentMismatch =
      expectedPayment !== null &&
      localOrder.payment_status !== undefined &&
      localOrder.payment_status !== expectedPayment;

    if (!orderMismatch && !paymentMismatch) {
      report.matched++;
      continue;
    }

    // We have a mismatch — attempt auto-fix for clear cases
    const mismatch: ReconciliationMismatch = {
      orderId,
      paymentIntentId: pi.id,
      stripeStatus: pi.status,
      localOrderStatus: localOrder.status,
      localPaymentStatus: localOrder.payment_status ?? null,
      action: "needs_review",
      detail: "",
    };

    if (pi.status === "succeeded" && localOrder.status !== "PAID") {
      // Clear case: Stripe says paid, local doesn't — auto-fix
      try {
        await core
          .from("gm_orders")
          .update({
            status: "PAID",
            payment_status: "completed",
            payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        mismatch.action = "auto_fixed";
        mismatch.detail = `Order was "${localOrder.status}", Stripe PI succeeded. Auto-corrected to PAID.`;
        report.autoFixed++;

        logAuditEvent({
          action: "PAYMENT_REFUNDED", // closest audit action available
          orderId,
          operatorId: "system:reconciler",
          operatorName: "Payment Reconciler",
          reason: `Auto-reconciled: order status corrected from "${localOrder.status}" to "PAID" based on Stripe PI ${pi.id}.`,
          timestamp: new Date().toISOString(),
          metadata: {
            payment_intent_id: pi.id,
            stripe_status: pi.status,
            previous_status: localOrder.status,
          },
        }).catch(() => {});

        Logger.info("[PaymentReconciler] Auto-fixed order status", {
          orderId,
          from: localOrder.status,
          to: "PAID",
          pi: pi.id,
        });
      } catch (err) {
        mismatch.action = "needs_review";
        mismatch.detail = `Auto-fix failed: ${err instanceof Error ? err.message : String(err)}`;
        report.needsReview++;
        report.errors.push(`Auto-fix failed for ${orderId}: ${mismatch.detail}`);
      }
    } else {
      // Ambiguous case — flag for manual review
      mismatch.detail = `Stripe status "${pi.status}" vs local order "${localOrder.status}" / payment "${localOrder.payment_status ?? "unknown"}".`;
      report.needsReview++;
    }

    report.mismatches.push(mismatch);
  }

  Logger.info("[PaymentReconciler] Reconciliation complete", {
    restaurantId,
    totalChecked: report.totalChecked,
    matched: report.matched,
    autoFixed: report.autoFixed,
    needsReview: report.needsReview,
    errors: report.errors.length,
  });

  return report;
}

/**
 * Persist a reconciliation report to Core for audit / history.
 * Non-blocking: failures are logged but don't throw.
 */
export async function saveReconciliationReport(
  report: ReconciliationReport,
): Promise<void> {
  try {
    const core = getDockerCoreFetchClient();
    await core.from("gm_audit_logs").insert({
      id: `recon-${Date.now()}-${crypto.randomUUID()}`,
      action: "PAYMENT_RECONCILIATION",
      resource_entity: "gm_orders",
      restaurant_id: report.restaurantId,
      metadata: {
        since: report.since,
        total_checked: report.totalChecked,
        matched: report.matched,
        auto_fixed: report.autoFixed,
        needs_review: report.needsReview,
        mismatches: report.mismatches,
        errors: report.errors,
      },
      created_at: report.timestamp,
    });
  } catch (err) {
    Logger.error("[PaymentReconciler] Failed to save reconciliation report", err);
  }
}
