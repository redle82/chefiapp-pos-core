/**
 * WebhookEventTypes - Stripe webhook event types and internal action mapping.
 *
 * Defines the subset of Stripe webhook events the system cares about and maps
 * each to an internal reconciliation action. The webhook endpoint lives on the
 * Docker Core (server-side); this module is used by the client-side
 * reconciliation service to classify events fetched via Core RPC.
 */

// ---------------------------------------------------------------------------
// Stripe event types we handle
// ---------------------------------------------------------------------------

export type StripeWebhookEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled"
  | "charge.refunded"
  | "charge.dispute.created";

/** All event types we subscribe to (useful for webhook endpoint config). */
export const HANDLED_EVENT_TYPES: readonly StripeWebhookEventType[] = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
  "charge.dispute.created",
] as const;

// ---------------------------------------------------------------------------
// Internal reconciliation actions
// ---------------------------------------------------------------------------

export type ReconciliationAction =
  | "MARK_PAID"
  | "MARK_PAYMENT_FAILED"
  | "MARK_CANCELLED"
  | "APPLY_REFUND"
  | "FLAG_DISPUTED";

/** Maps a Stripe event type to the internal action the system should perform. */
export const EVENT_ACTION_MAP: Record<
  StripeWebhookEventType,
  ReconciliationAction
> = {
  "payment_intent.succeeded": "MARK_PAID",
  "payment_intent.payment_failed": "MARK_PAYMENT_FAILED",
  "payment_intent.canceled": "MARK_CANCELLED",
  "charge.refunded": "APPLY_REFUND",
  "charge.dispute.created": "FLAG_DISPUTED",
} as const;

// ---------------------------------------------------------------------------
// Stripe webhook event shape (subset we need)
// ---------------------------------------------------------------------------

export interface StripeWebhookEvent {
  /** Stripe event ID (evt_...). Used for idempotency. */
  id: string;
  /** Event type string. */
  type: StripeWebhookEventType;
  /** ISO 8601 timestamp of the event. */
  created: number;
  /** Event payload — shape varies by event type. */
  data: {
    object: {
      /** PaymentIntent or Charge ID. */
      id: string;
      /** For payment_intent events: the PI status. */
      status?: string;
      /** Amount in smallest currency unit (cents). */
      amount?: number;
      /** Currency code (lowercase). */
      currency?: string;
      /** Metadata attached to the PI (contains order_id, restaurant_id). */
      metadata?: Record<string, string>;
      /** For charge.refunded: the refund amount. */
      amount_refunded?: number;
      /** For charge.dispute.created: the dispute reason. */
      reason?: string;
      /** For charge events: the associated payment_intent ID. */
      payment_intent?: string;
    };
  };
  /** Whether this is a live-mode event. */
  livemode: boolean;
}

// ---------------------------------------------------------------------------
// Reconciliation result
// ---------------------------------------------------------------------------

export type ReconciliationStatus = "applied" | "skipped" | "error";

export interface ReconciliationResult {
  /** The Stripe event ID that was processed. */
  eventId: string;
  /** The internal action that was (or would have been) taken. */
  action: ReconciliationAction;
  /** Whether the action was applied, skipped (duplicate), or errored. */
  status: ReconciliationStatus;
  /** The order ID affected (if resolved from metadata). */
  orderId: string | null;
  /** Human-readable description of what happened. */
  message: string;
}
