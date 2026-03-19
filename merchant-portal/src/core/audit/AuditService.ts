/**
 * AuditService — Local IndexedDB audit trail for sensitive POS operations.
 *
 * Stores audit events in the `gm_audit_log` IndexedDB object store.
 * Non-blocking: failures are logged but never throw.
 *
 * Actions tracked:
 *   ORDER_REOPENED, ORDER_CANCELLED, RECEIPT_REPRINTED, DISCOUNT_APPLIED
 */

import { Logger } from "../logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | "ORDER_REOPENED"
  | "ORDER_CANCELLED"
  | "RECEIPT_REPRINTED"
  | "DISCOUNT_APPLIED"
  | "PAYMENT_REFUNDED";

export interface AuditEvent {
  /** The action that was performed. */
  action: AuditAction;
  /** Related order UUID (if applicable). */
  orderId: string;
  /** Staff member who performed the action. */
  operatorId: string;
  /** Human-readable operator name for display. */
  operatorName: string;
  /** Mandatory reason / justification. */
  reason: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Arbitrary extra context. */
  metadata?: Record<string, unknown>;
}

/** Stored record includes an auto-generated id. */
export interface AuditRecord extends AuditEvent {
  id: string;
}

// ---------------------------------------------------------------------------
// IndexedDB constants
// ---------------------------------------------------------------------------

const DB_NAME = "chefiapp_audit";
const STORE_NAME = "gm_audit_log";
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      Logger.error("[AuditService] IndexedDB open failed", request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("action", "action", { unique: false });
        store.createIndex("orderId", "orderId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("operatorId", "operatorId", { unique: false });
      }
    };
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Log an audit event to the local IndexedDB store.
 * Non-blocking: errors are swallowed and logged.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const record: AuditRecord = {
      ...event,
      id: `audit-${Date.now()}-${crypto.randomUUID()}`,
    };

    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => {
        Logger.info("[AuditService] Event logged", {
          action: event.action,
          orderId: event.orderId,
          operatorId: event.operatorId,
        });
        resolve();
      };
      request.onerror = () => {
        Logger.error("[AuditService] Failed to write audit event", request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    // Non-blocking: audit logging should never break the main flow
    Logger.error("[AuditService] logAuditEvent error", err);
  }
}

/**
 * Retrieve audit events for a given order (most recent first).
 */
export async function getAuditEventsByOrder(
  orderId: string,
): Promise<AuditRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("orderId");
      const request = index.getAll(orderId);
      request.onsuccess = () => {
        const records = (request.result as AuditRecord[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Retrieve all audit events (most recent first, with optional limit).
 */
export async function getAllAuditEvents(
  limit = 200,
): Promise<AuditRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result as AuditRecord[])
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, limit);
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}
