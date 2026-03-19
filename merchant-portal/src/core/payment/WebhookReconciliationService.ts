/**
 * WebhookReconciliationService - Processes Stripe webhook events client-side.
 *
 * Handles idempotency via IndexedDB (processed event IDs), updates order
 * status through Core RPC, and logs audit events for every financial mutation.
 *
 * ANTI-SUPABASE §4: All mutations go through Docker Core RPC.
 */

import { Logger } from "../logger";
import { logAuditEvent } from "../audit/AuditService";
import type { AuditAction } from "../audit/AuditService";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";
import {
  EVENT_ACTION_MAP,
  HANDLED_EVENT_TYPES,
  type ReconciliationResult,
  type ReconciliationStatus,
  type StripeWebhookEvent,
  type StripeWebhookEventType,
} from "./WebhookEventTypes";

// ---------------------------------------------------------------------------
// IndexedDB — processed events store (idempotency)
// ---------------------------------------------------------------------------

const DB_NAME = "chefiapp_webhook_events";
const STORE_NAME = "processed_events";
const DB_VERSION = 1;

interface ProcessedEventRecord {
  /** Stripe event ID (evt_...). */
  eventId: string;
  /** When the event was processed locally. */
  processedAt: string;
  /** The action taken. */
  action: string;
  /** The order affected. */
  orderId: string | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      Logger.error("[WebhookReconciliation] IndexedDB open failed", request.error);
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "eventId" });
        store.createIndex("processedAt", "processedAt", { unique: false });
      }
    };
  });
}

async function wasEventProcessed(eventId: string): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(eventId);
      req.onsuccess = () => resolve(req.result != null);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function markEventProcessed(record: ProcessedEventRecord): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        Logger.error("[WebhookReconciliation] Failed to mark event processed", req.error);
        resolve();
      };
    });
  } catch {
    // Non-blocking
  }
}

// ---------------------------------------------------------------------------
// Order mutation helpers (via Core RPC)
// ---------------------------------------------------------------------------

async function updateOrderStatus(
  orderId: string,
  status: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const core = getDockerCoreFetchClient();
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (metadata) {
    updatePayload.payment_metadata = metadata;
  }
  const res = await core
    .from("gm_orders")
    .update(updatePayload)
    .eq("id", orderId);
  if (res.error) {
    throw new Error(`Failed to update order ${orderId}: ${res.error.message}`);
  }
}

async function updatePaymentRecord(
  orderId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const core = getDockerCoreFetchClient();
  const res = await core
    .from("gm_payments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("order_id", orderId);
  if (res.error) {
    Logger.warn("[WebhookReconciliation] Payment record update failed (may not exist yet)", {
      orderId,
      error: res.error.message,
    });
  }
}

// ---------------------------------------------------------------------------
// Audit logging helpers
// ---------------------------------------------------------------------------

function logReconciliationAudit(
  action: AuditAction,
  orderId: string,
  reason: string,
  metadata?: Record<string, unknown>,
): void {
  logAuditEvent({
    action,
    orderId,
    operatorId: "system:webhook",
    operatorName: "Stripe Webhook",
    reason,
    timestamp: new Date().toISOString(),
    metadata,
  }).catch(() => {
    // Non-blocking
  });
}

// ---------------------------------------------------------------------------
// Event processors
// ---------------------------------------------------------------------------

async function handlePaymentSucceeded(
  event: StripeWebhookEvent,
): Promise<{ orderId: string | null; message: string }> {
  const obj = event.data.object;
  const orderId = obj.metadata?.order_id ?? null;
  if (!orderId) {
    return { orderId: null, message: "No order_id in metadata; skipped order update." };
  }

  await updateOrderStatus(orderId, "PAID", {
    stripe_payment_intent_id: obj.id,
    stripe_amount: obj.amount,
    stripe_currency: obj.currency,
    paid_at: new Date().toISOString(),
  });

  await updatePaymentRecord(orderId, {
    status: "completed",
    provider_id: obj.id,
  });

  logReconciliationAudit("PAYMENT_REFUNDED", orderId, "Payment confirmed via Stripe webhook", {
    payment_intent_id: obj.id,
    amount: obj.amount,
    currency: obj.currency,
    event_id: event.id,
  });

  return { orderId, message: `Order ${orderId} marked as PAID.` };
}

async function handlePaymentFailed(
  event: StripeWebhookEvent,
): Promise<{ orderId: string | null; message: string }> {
  const obj = event.data.object;
  const orderId = obj.metadata?.order_id ?? null;
  if (!orderId) {
    return { orderId: null, message: "No order_id in metadata; skipped." };
  }

  await updatePaymentRecord(orderId, {
    status: "failed",
    provider_id: obj.id,
    failure_reason: obj.status,
  });

  logReconciliationAudit("ORDER_CANCELLED", orderId, "Payment failed via Stripe webhook", {
    payment_intent_id: obj.id,
    event_id: event.id,
  });

  return { orderId, message: `Order ${orderId} payment marked as FAILED.` };
}

async function handlePaymentCanceled(
  event: StripeWebhookEvent,
): Promise<{ orderId: string | null; message: string }> {
  const obj = event.data.object;
  const orderId = obj.metadata?.order_id ?? null;
  if (!orderId) {
    return { orderId: null, message: "No order_id in metadata; skipped." };
  }

  await updatePaymentRecord(orderId, {
    status: "failed",
    provider_id: obj.id,
    failure_reason: "canceled",
  });

  logReconciliationAudit("ORDER_CANCELLED", orderId, "Payment canceled via Stripe webhook", {
    payment_intent_id: obj.id,
    event_id: event.id,
  });

  return { orderId, message: `Order ${orderId} payment canceled.` };
}

async function handleChargeRefunded(
  event: StripeWebhookEvent,
): Promise<{ orderId: string | null; message: string }> {
  const obj = event.data.object;
  const paymentIntentId = obj.payment_intent ?? obj.id;
  const orderId = obj.metadata?.order_id ?? null;
  if (!orderId) {
    return { orderId: null, message: "No order_id in metadata; skipped refund update." };
  }

  await updatePaymentRecord(orderId, {
    status: "refunded",
    provider_id: paymentIntentId,
    refund_amount: obj.amount_refunded,
  });

  logReconciliationAudit("PAYMENT_REFUNDED", orderId, "Charge refunded via Stripe webhook", {
    charge_id: obj.id,
    payment_intent_id: paymentIntentId,
    amount_refunded: obj.amount_refunded,
    event_id: event.id,
  });

  return { orderId, message: `Order ${orderId} refund recorded (${obj.amount_refunded} cents).` };
}

async function handleDisputeCreated(
  event: StripeWebhookEvent,
): Promise<{ orderId: string | null; message: string }> {
  const obj = event.data.object;
  const orderId = obj.metadata?.order_id ?? null;
  const paymentIntentId = obj.payment_intent ?? obj.id;

  if (!orderId) {
    return { orderId: null, message: "No order_id in metadata; dispute logged without order link." };
  }

  await updatePaymentRecord(orderId, {
    status: "disputed",
    provider_id: paymentIntentId,
    dispute_reason: obj.reason,
  });

  logReconciliationAudit("ORDER_CANCELLED", orderId, "Dispute created via Stripe webhook", {
    charge_id: obj.id,
    payment_intent_id: paymentIntentId,
    dispute_reason: obj.reason,
    event_id: event.id,
  });

  return { orderId, message: `Order ${orderId} flagged as DISPUTED (reason: ${obj.reason}).` };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process a single Stripe webhook event.
 *
 * Idempotent: if the event ID was already processed, returns status "skipped".
 * Unrecognized event types are silently skipped.
 */
export async function processWebhookEvent(
  event: StripeWebhookEvent,
): Promise<ReconciliationResult> {
  const eventType = event.type;

  // Validate event type
  if (!HANDLED_EVENT_TYPES.includes(eventType)) {
    return {
      eventId: event.id,
      action: "MARK_PAID", // placeholder
      status: "skipped",
      orderId: null,
      message: `Unhandled event type: ${eventType}`,
    };
  }

  const action = EVENT_ACTION_MAP[eventType];

  // Idempotency check
  const alreadyProcessed = await wasEventProcessed(event.id);
  if (alreadyProcessed) {
    Logger.info("[WebhookReconciliation] Duplicate event skipped", { eventId: event.id });
    return {
      eventId: event.id,
      action,
      status: "skipped",
      orderId: null,
      message: `Event ${event.id} already processed.`,
    };
  }

  let status: ReconciliationStatus = "applied";
  let orderId: string | null = null;
  let message: string;

  try {
    let result: { orderId: string | null; message: string };

    switch (eventType) {
      case "payment_intent.succeeded":
        result = await handlePaymentSucceeded(event);
        break;
      case "payment_intent.payment_failed":
        result = await handlePaymentFailed(event);
        break;
      case "payment_intent.canceled":
        result = await handlePaymentCanceled(event);
        break;
      case "charge.refunded":
        result = await handleChargeRefunded(event);
        break;
      case "charge.dispute.created":
        result = await handleDisputeCreated(event);
        break;
      default: {
        // Exhaustive check — should never reach here
        const _exhaustive: never = eventType;
        result = { orderId: null, message: `Unknown event: ${_exhaustive}` };
      }
    }

    orderId = result.orderId;
    message = result.message;
  } catch (err) {
    status = "error";
    message = err instanceof Error ? err.message : String(err);
    Logger.error("[WebhookReconciliation] Event processing failed", {
      eventId: event.id,
      eventType,
      error: message,
    });
  }

  // Record that this event was processed (even on error, to avoid retry loops)
  await markEventProcessed({
    eventId: event.id,
    processedAt: new Date().toISOString(),
    action,
    orderId,
  });

  return { eventId: event.id, action, status, orderId, message };
}

/**
 * Process a batch of webhook events. Returns results for each event.
 */
export async function processWebhookEvents(
  events: StripeWebhookEvent[],
): Promise<ReconciliationResult[]> {
  const results: ReconciliationResult[] = [];
  for (const event of events) {
    const result = await processWebhookEvent(event);
    results.push(result);
  }
  return results;
}

/**
 * Fetch pending/recent webhook events from Core and process them.
 * This is the main entry point for manual reconciliation triggers.
 */
export async function fetchAndProcessWebhookEvents(
  restaurantId: string,
  since?: Date,
): Promise<ReconciliationResult[]> {
  const core = getDockerCoreFetchClient();
  const sinceISO = (since ?? new Date(Date.now() - 24 * 60 * 60 * 1000)).toISOString();

  const res = await core.rpc("stripe-payment", {
    action: "list-webhook-events",
    restaurant_id: restaurantId,
    since: sinceISO,
  });

  if (res.error) {
    Logger.error("[WebhookReconciliation] Failed to fetch webhook events", res.error);
    return [];
  }

  const events = (res.data as StripeWebhookEvent[] | null) ?? [];
  if (events.length === 0) {
    Logger.info("[WebhookReconciliation] No webhook events to process");
    return [];
  }

  Logger.info("[WebhookReconciliation] Processing webhook events", { count: events.length });
  return processWebhookEvents(events);
}
