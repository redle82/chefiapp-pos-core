/**
 * DeliveryStatusService — Manages delivery order lifecycle transitions.
 *
 * Handles accept/reject/ready/completed status changes for external delivery
 * orders (Glovo, UberEats, etc). Each status transition:
 *   1. Updates the local `integration_orders` table
 *   2. Queues a webhook callback to the delivery platform (offline-resilient)
 *   3. Logs an audit event to the local IndexedDB audit trail
 *
 * Offline resilience: webhook callbacks are stored in IndexedDB and processed
 * by a dedicated sync loop when connectivity is available.
 */

import { db } from "../../core/db";
import { Logger } from "../../core/logger";
import { ConnectivityService } from "../../core/sync/ConnectivityService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliveryOrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "rejected";

export type RejectReason =
  | "out_of_stock"
  | "too_busy"
  | "closing_soon"
  | "other";

export interface StatusUpdateResult {
  success: boolean;
  error?: string;
  newStatus: DeliveryOrderStatus;
}

interface WebhookQueueItem {
  id: string;
  orderId: string;
  externalId: string;
  source: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: number;
  status: "queued" | "sent" | "failed";
  attempts: number;
}

// ---------------------------------------------------------------------------
// Allowed status transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, DeliveryOrderStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "rejected"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  rejected: [],
};

// ---------------------------------------------------------------------------
// IndexedDB for webhook queue (offline-resilient)
// ---------------------------------------------------------------------------

const WEBHOOK_DB_NAME = "chefiapp_delivery_webhooks";
const WEBHOOK_STORE = "webhook_queue";
const WEBHOOK_DB_VERSION = 1;

function openWebhookDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WEBHOOK_DB_NAME, WEBHOOK_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(WEBHOOK_STORE)) {
        const store = database.createObjectStore(WEBHOOK_STORE, {
          keyPath: "id",
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

async function enqueueWebhook(item: WebhookQueueItem): Promise<void> {
  try {
    const database = await openWebhookDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(WEBHOOK_STORE, "readwrite");
      const store = tx.objectStore(WEBHOOK_STORE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    Logger.error("[DeliveryStatusService] Failed to enqueue webhook", err);
  }
}

async function getPendingWebhooks(): Promise<WebhookQueueItem[]> {
  try {
    const database = await openWebhookDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(WEBHOOK_STORE, "readonly");
      const store = tx.objectStore(WEBHOOK_STORE);
      const index = store.index("status");
      const req = index.getAll("queued");
      req.onsuccess = () => {
        const items = (req.result as WebhookQueueItem[]).sort(
          (a, b) => a.createdAt - b.createdAt,
        );
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function markWebhookSent(id: string): Promise<void> {
  try {
    const database = await openWebhookDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(WEBHOOK_STORE, "readwrite");
      const store = tx.objectStore(WEBHOOK_STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result as WebhookQueueItem | undefined;
        if (!item) {
          resolve();
          return;
        }
        const putReq = store.put({ ...item, status: "sent" });
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    Logger.error("[DeliveryStatusService] Failed to mark webhook sent", err);
  }
}

// ---------------------------------------------------------------------------
// Audit helper (non-blocking)
// ---------------------------------------------------------------------------

async function logDeliveryAudit(
  action: string,
  orderId: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const { logAuditEvent } = await import(
      "../../core/audit/AuditService"
    );
    await logAuditEvent({
      action: "ORDER_CANCELLED" as any, // Reuse closest existing type
      orderId,
      operatorId: details.operatorId as string || "system",
      operatorName: details.operatorName as string || "System",
      reason: `delivery_${action}`,
      timestamp: new Date().toISOString(),
      metadata: details,
    });
  } catch (err) {
    Logger.warn("[DeliveryStatusService] Audit log failed (non-blocking)", err);
  }
}

// ---------------------------------------------------------------------------
// Core status update (local DB)
// ---------------------------------------------------------------------------

async function updateLocalStatus(
  orderId: string,
  newStatus: DeliveryOrderStatus,
  extra?: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    ...extra,
  };

  const { error } = await db
    .from("integration_orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (error) {
    Logger.error(
      `[DeliveryStatusService] DB update failed for ${orderId}`,
      error,
    );
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a status transition is valid.
 */
export function isValidTransition(
  currentStatus: string,
  targetStatus: DeliveryOrderStatus,
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

/**
 * Accept an incoming delivery order.
 * Transitions: pending -> accepted
 */
export async function acceptOrder(
  orderId: string,
  externalId: string,
  source: string,
  estimatedPrepMinutes: number = 15,
): Promise<StatusUpdateResult> {
  const result = await updateLocalStatus(orderId, "accepted", {
    estimated_prep_minutes: estimatedPrepMinutes,
    accepted_at: new Date().toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error, newStatus: "pending" };
  }

  // Queue webhook callback to delivery platform
  await enqueueWebhook({
    id: `wh-accept-${orderId}-${Date.now()}`,
    orderId,
    externalId,
    source,
    action: "accept",
    payload: {
      status: "accepted",
      estimated_prep_minutes: estimatedPrepMinutes,
      accepted_at: new Date().toISOString(),
    },
    createdAt: Date.now(),
    status: "queued",
    attempts: 0,
  });

  // Audit trail (non-blocking)
  logDeliveryAudit("accept", orderId, {
    source,
    externalId,
    estimatedPrepMinutes,
  });

  Logger.info(
    `[DeliveryStatusService] Order ${orderId} accepted (ETA: ${estimatedPrepMinutes}min)`,
  );

  // Attempt immediate webhook flush
  processWebhookQueue();

  return { success: true, newStatus: "accepted" };
}

/**
 * Reject an incoming delivery order.
 * Transitions: pending -> rejected, accepted -> rejected
 */
export async function rejectOrder(
  orderId: string,
  externalId: string,
  source: string,
  reason: RejectReason,
  notes?: string,
): Promise<StatusUpdateResult> {
  const result = await updateLocalStatus(orderId, "rejected", {
    rejection_reason: reason,
    rejection_notes: notes || null,
    rejected_at: new Date().toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error, newStatus: "pending" };
  }

  await enqueueWebhook({
    id: `wh-reject-${orderId}-${Date.now()}`,
    orderId,
    externalId,
    source,
    action: "reject",
    payload: {
      status: "rejected",
      reason,
      notes: notes || undefined,
      rejected_at: new Date().toISOString(),
    },
    createdAt: Date.now(),
    status: "queued",
    attempts: 0,
  });

  logDeliveryAudit("reject", orderId, { source, externalId, reason, notes });

  Logger.info(
    `[DeliveryStatusService] Order ${orderId} rejected (reason: ${reason})`,
  );

  processWebhookQueue();

  return { success: true, newStatus: "rejected" };
}

/**
 * Mark order as ready for pickup by the delivery driver.
 * Transitions: accepted -> preparing -> ready (allows skipping preparing)
 */
export async function markReady(
  orderId: string,
  externalId: string,
  source: string,
): Promise<StatusUpdateResult> {
  const result = await updateLocalStatus(orderId, "ready", {
    ready_at: new Date().toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error, newStatus: "accepted" };
  }

  await enqueueWebhook({
    id: `wh-ready-${orderId}-${Date.now()}`,
    orderId,
    externalId,
    source,
    action: "ready",
    payload: {
      status: "ready",
      ready_at: new Date().toISOString(),
    },
    createdAt: Date.now(),
    status: "queued",
    attempts: 0,
  });

  logDeliveryAudit("ready", orderId, { source, externalId });

  Logger.info(`[DeliveryStatusService] Order ${orderId} marked ready`);

  processWebhookQueue();

  return { success: true, newStatus: "ready" };
}

/**
 * Mark order as completed (picked up by driver).
 * Transitions: ready -> completed
 */
export async function markCompleted(
  orderId: string,
  externalId: string,
  source: string,
): Promise<StatusUpdateResult> {
  const result = await updateLocalStatus(orderId, "completed", {
    completed_at: new Date().toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error, newStatus: "ready" };
  }

  await enqueueWebhook({
    id: `wh-completed-${orderId}-${Date.now()}`,
    orderId,
    externalId,
    source,
    action: "completed",
    payload: {
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    createdAt: Date.now(),
    status: "queued",
    attempts: 0,
  });

  logDeliveryAudit("completed", orderId, { source, externalId });

  Logger.info(`[DeliveryStatusService] Order ${orderId} marked completed`);

  processWebhookQueue();

  return { success: true, newStatus: "completed" };
}

/**
 * Transition to "preparing" status (intermediate step between accepted and ready).
 * Transitions: accepted -> preparing
 */
export async function markPreparing(
  orderId: string,
  externalId: string,
  source: string,
): Promise<StatusUpdateResult> {
  const result = await updateLocalStatus(orderId, "preparing", {
    preparing_at: new Date().toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error, newStatus: "accepted" };
  }

  await enqueueWebhook({
    id: `wh-preparing-${orderId}-${Date.now()}`,
    orderId,
    externalId,
    source,
    action: "preparing",
    payload: {
      status: "preparing",
      preparing_at: new Date().toISOString(),
    },
    createdAt: Date.now(),
    status: "queued",
    attempts: 0,
  });

  logDeliveryAudit("preparing", orderId, { source, externalId });

  Logger.info(`[DeliveryStatusService] Order ${orderId} is now preparing`);

  processWebhookQueue();

  return { success: true, newStatus: "preparing" };
}

// ---------------------------------------------------------------------------
// Webhook queue processor (offline-resilient)
// ---------------------------------------------------------------------------

let isProcessingWebhooks = false;

/**
 * Process queued webhooks. Called automatically after each status change
 * and can be invoked manually for retry.
 */
export async function processWebhookQueue(): Promise<void> {
  if (isProcessingWebhooks) return;
  if (ConnectivityService.getConnectivity() === "offline") return;

  isProcessingWebhooks = true;

  try {
    const pending = await getPendingWebhooks();
    if (pending.length === 0) return;

    Logger.info(
      `[DeliveryStatusService] Processing ${pending.length} pending webhooks`,
    );

    for (const item of pending) {
      try {
        // In production, this would call the delivery platform's API.
        // For now, we use an RPC that the backend proxy handles.
        const { error } = await db.rpc("delivery_status_callback", {
          p_order_id: item.orderId,
          p_external_id: item.externalId,
          p_source: item.source,
          p_action: item.action,
          p_payload: item.payload,
        });

        if (error) {
          Logger.warn(
            `[DeliveryStatusService] Webhook RPC failed for ${item.orderId}`,
            error,
          );
          // Leave as queued for retry
          continue;
        }

        await markWebhookSent(item.id);
        Logger.info(
          `[DeliveryStatusService] Webhook sent for ${item.orderId} (${item.action})`,
        );
      } catch (err) {
        Logger.warn(
          `[DeliveryStatusService] Webhook delivery failed for ${item.orderId}`,
          err,
        );
      }
    }
  } catch (err) {
    Logger.error(
      "[DeliveryStatusService] Critical error in webhook processing",
      err,
    );
  } finally {
    isProcessingWebhooks = false;
  }
}

/**
 * Get count of pending (unsent) webhooks.
 */
export async function getPendingWebhookCount(): Promise<number> {
  const pending = await getPendingWebhooks();
  return pending.length;
}
