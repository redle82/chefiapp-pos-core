/**
 * Stripe Webhook → Billing Sync
 *
 * Maps Stripe subscription/invoice events to gm_restaurants.billing_status.
 * Simulated entry point (no full Stripe SDK). Call from webhook handler.
 *
 * Stripe → BillingStatus:
 *   trialing → trial
 *   active → active
 *   past_due → past_due
 *   unpaid → canceled
 *   incomplete → incomplete
 *   incomplete_expired → trial_expired
 *   canceled → canceled
 *   paused → paused
 */

export type { BillingState as BillingStatus } from "../../../billing-core/billingStateMachine";
import {
  mapStripeStatus as mapStripeStatusCentral,
  type BillingState,
} from "../../../billing-core/billingStateMachine";

// Local alias for backward compat
type BillingStatus = BillingState;

/**
 * Map Stripe subscription status to Core billing_status.
 * Delegates to the central billing state machine.
 */
export function mapStripeSubscriptionStatus(
  stripeStatus: string,
): BillingStatus {
  return mapStripeStatusCentral(stripeStatus);
}

export type StripeWebhookEventType =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed";

export interface SyncResult {
  ok: boolean;
  restaurantId?: string;
  billingStatus?: BillingStatus;
  message: string;
  idempotent?: boolean;
}

/** Idempotency store (in-memory for simulation; use Redis/DB in prod). */
const processedEvents = new Set<string>();

/**
 * Check if event was already processed (idempotency).
 */
export function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed.
 */
export function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
}

/** Reset idempotency store (for tests only). */
export function resetProcessedEvents(): void {
  processedEvents.clear();
}

/**
 * Extract restaurant_id from Stripe event (metadata or subscription).
 */
export function extractRestaurantId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const data = obj.data as Record<string, unknown> | undefined;
  const evt = data?.object as Record<string, unknown> | undefined;
  if (!evt) return null;
  const meta = evt.metadata as Record<string, string> | undefined;
  if (meta?.restaurant_id) return meta.restaurant_id;
  return null;
}

/**
 * Simulated webhook handler entry point.
 * In production: receive raw Stripe event, verify signature, then call this.
 */
export function handleStripeBillingEvent(
  eventId: string,
  eventType: string,
  payload: unknown,
  persist: (restaurantId: string, status: BillingStatus) => Promise<void>,
  log: (msg: string, meta?: Record<string, unknown>) => void,
): Promise<SyncResult> {
  if (isEventProcessed(eventId)) {
    log("Stripe billing event already processed (idempotent)", { eventId });
    return Promise.resolve({
      ok: true,
      message: "Idempotent skip",
      idempotent: true,
    });
  }

  const restaurantId = extractRestaurantId(payload);
  if (!restaurantId) {
    log("Stripe event missing restaurant_id", { eventId, eventType });
    return Promise.resolve({
      ok: false,
      message: "restaurant_id not found in payload",
    });
  }

  const handlers: Record<string, () => BillingStatus | null> = {
    "customer.subscription.created": () => {
      const obj = (payload as Record<string, unknown>)?.data as
        | Record<string, unknown>
        | undefined;
      const sub = obj?.object as Record<string, unknown> | undefined;
      const status = sub?.status as string | undefined;
      return status ? mapStripeSubscriptionStatus(status) : "trial";
    },
    "customer.subscription.updated": () => {
      const obj = (payload as Record<string, unknown>)?.data as
        | Record<string, unknown>
        | undefined;
      const sub = obj?.object as Record<string, unknown> | undefined;
      const status = sub?.status as string | undefined;
      return status ? mapStripeSubscriptionStatus(status) : null;
    },
    "customer.subscription.deleted": () =>
      mapStripeSubscriptionStatus("canceled"),
    "invoice.payment_succeeded": () => mapStripeSubscriptionStatus("active"),
    "invoice.payment_failed": () => mapStripeSubscriptionStatus("past_due"),
  };

  const mapFn = handlers[eventType];
  const status = mapFn ? mapFn() : null;
  if (!status) {
    log("Unhandled or unknown event type", { eventId, eventType });
    return Promise.resolve({
      ok: false,
      message: `Unhandled event type: ${eventType}`,
    });
  }

  return persist(restaurantId, status)
    .then(() => {
      markEventProcessed(eventId);
      log("Stripe billing sync applied", {
        eventId,
        restaurantId,
        billingStatus: status,
      });
      return {
        ok: true,
        restaurantId,
        billingStatus: status,
        message: "Synced",
      };
    })
    .catch((err: Error) => {
      log("Stripe billing sync failed", {
        eventId,
        restaurantId,
        error: err.message,
      });
      return {
        ok: false,
        restaurantId,
        message: err.message,
      };
    });
}
