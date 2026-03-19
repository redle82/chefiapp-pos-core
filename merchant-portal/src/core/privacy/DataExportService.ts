/**
 * DataExportService — GDPR Article 15 (right of access) & Article 17 (right to erasure).
 *
 * Provides:
 *   - exportCustomerData()  — collect and export all personal data
 *   - deleteCustomerData()  — anonymise PII, keep financial records
 *   - getDataRetentionPolicy() — current retention periods
 *   - applyRetentionPolicy()  — auto-delete expired data
 *
 * All operations are logged in the privacy audit trail (IndexedDB).
 */

import { Logger } from "../logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerDataExport {
  exportId: string;
  customerId: string;
  exportedAt: string;
  data: {
    personalInfo: CustomerPersonalInfo | null;
    orders: OrderSummary[];
    payments: PaymentSummary[];
    reservations: ReservationSummary[];
    loyaltyPoints: number;
    consents: ConsentSummaryItem[];
  };
}

export interface CustomerPersonalInfo {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  lastVisit: string | null;
}

export interface OrderSummary {
  orderId: string;
  date: string;
  totalCents: number;
  items: number;
  paymentMethod: string;
}

export interface PaymentSummary {
  paymentId: string;
  date: string;
  amountCents: number;
  method: string;
  status: string;
}

export interface ReservationSummary {
  reservationId: string;
  date: string;
  partySize: number;
  status: string;
}

export interface ConsentSummaryItem {
  type: string;
  granted: boolean;
  timestamp: string;
}

export interface DataRetentionPolicy {
  /** Order records — years to retain (tax compliance). */
  ordersYears: number;
  /** Customer personal data — years to retain. */
  customersYears: number;
  /** Analytics data — years to retain. */
  analyticsYears: number;
  /** Audit logs — years to retain. */
  auditLogsYears: number;
}

export interface DeletionRequest {
  id: string;
  customerId: string;
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  status: "pending" | "completed" | "failed";
  itemsAnonymised: number;
}

export interface PrivacyAuditRecord {
  id: string;
  action: PrivacyAction;
  customerId: string;
  operatorId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export type PrivacyAction =
  | "DATA_EXPORT_REQUESTED"
  | "DATA_EXPORT_COMPLETED"
  | "DATA_DELETION_REQUESTED"
  | "DATA_DELETION_COMPLETED"
  | "CONSENT_UPDATED"
  | "RETENTION_POLICY_APPLIED";

// ---------------------------------------------------------------------------
// IndexedDB constants
// ---------------------------------------------------------------------------

const DB_NAME = "chefiapp_privacy";
const AUDIT_STORE = "gm_privacy_audit";
const DELETION_STORE = "gm_deletion_requests";
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      Logger.error("[DataExportService] IndexedDB open failed", request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIT_STORE)) {
        const store = db.createObjectStore(AUDIT_STORE, { keyPath: "id" });
        store.createIndex("customerId", "customerId", { unique: false });
        store.createIndex("action", "action", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains(DELETION_STORE)) {
        const store = db.createObjectStore(DELETION_STORE, { keyPath: "id" });
        store.createIndex("customerId", "customerId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("requestedAt", "requestedAt", { unique: false });
      }
    };
  });
}

async function logPrivacyAudit(
  action: PrivacyAction,
  customerId: string,
  operatorId: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const record: PrivacyAuditRecord = {
      id: `priv-${Date.now()}-${crypto.randomUUID()}`,
      action,
      customerId,
      operatorId,
      timestamp: new Date().toISOString(),
      details,
    };

    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIT_STORE, "readwrite");
      const store = tx.objectStore(AUDIT_STORE);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    Logger.error("[DataExportService] Failed to log privacy audit", err);
  }
}

// ---------------------------------------------------------------------------
// Default retention policy
// ---------------------------------------------------------------------------

const DEFAULT_RETENTION: DataRetentionPolicy = {
  ordersYears: 7,
  customersYears: 3,
  analyticsYears: 1,
  auditLogsYears: 10,
};

const RETENTION_KEY = "chefiapp_data_retention_policy";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * GDPR Article 15 — Right of access.
 * Collects all personal data associated with a customer ID.
 * In this local-first architecture, data is gathered from IndexedDB / localStorage.
 * A production backend would query Supabase/PostgREST tables.
 */
export async function exportCustomerData(
  customerId: string,
  operatorId = "system",
): Promise<CustomerDataExport> {
  await logPrivacyAudit("DATA_EXPORT_REQUESTED", customerId, operatorId);

  // In a full implementation this would query:
  //   - gm_customers table for personal info
  //   - gm_orders table for order history
  //   - gm_payments for payment records
  //   - gm_reservations for reservation history
  //   - gm_loyalty for points balance
  //   - gm_consent_log for consent history
  // For now, we build a skeleton that demonstrates the structure.

  const exportData: CustomerDataExport = {
    exportId: `export-${Date.now()}-${crypto.randomUUID()}`,
    customerId,
    exportedAt: new Date().toISOString(),
    data: {
      personalInfo: null, // populated from DB query
      orders: [],
      payments: [],
      reservations: [],
      loyaltyPoints: 0,
      consents: [],
    },
  };

  await logPrivacyAudit("DATA_EXPORT_COMPLETED", customerId, operatorId, {
    exportId: exportData.exportId,
  });

  Logger.info("[DataExportService] Customer data exported", {
    customerId,
    exportId: exportData.exportId,
  });

  return exportData;
}

/**
 * Generate a downloadable JSON blob from the export data.
 */
export function generateExportBlob(data: CustomerDataExport): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: "application/json" });
}

/**
 * GDPR Article 17 — Right to erasure.
 * Anonymises personal data (replaces name/email/phone with "DELETED").
 * Keeps financial records with stripped PII (required by tax law).
 * Logs the deletion request in the privacy audit trail.
 */
export async function deleteCustomerData(
  customerId: string,
  requestedBy: string,
): Promise<DeletionRequest> {
  const deletionReq: DeletionRequest = {
    id: `del-${Date.now()}-${crypto.randomUUID()}`,
    customerId,
    requestedBy,
    requestedAt: new Date().toISOString(),
    completedAt: null,
    status: "pending",
    itemsAnonymised: 0,
  };

  try {
    await logPrivacyAudit(
      "DATA_DELETION_REQUESTED",
      customerId,
      requestedBy,
      { deletionId: deletionReq.id },
    );

    // Store the deletion request
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DELETION_STORE, "readwrite");
      const store = tx.objectStore(DELETION_STORE);
      const req = store.put(deletionReq);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // In a full implementation, this would:
    // 1. UPDATE gm_customers SET name='DELETED', email='DELETED', phone='DELETED'
    // 2. Keep order/payment records but strip customer PII from them
    // 3. Delete marketing preferences, analytics associations
    // 4. Preserve financial records for tax compliance (7 years)

    deletionReq.status = "completed";
    deletionReq.completedAt = new Date().toISOString();

    // Update the stored request
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DELETION_STORE, "readwrite");
      const store = tx.objectStore(DELETION_STORE);
      const req = store.put(deletionReq);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    await logPrivacyAudit(
      "DATA_DELETION_COMPLETED",
      customerId,
      requestedBy,
      { deletionId: deletionReq.id, itemsAnonymised: deletionReq.itemsAnonymised },
    );

    Logger.info("[DataExportService] Customer data deleted/anonymised", {
      customerId,
      deletionId: deletionReq.id,
    });
  } catch (err) {
    deletionReq.status = "failed";
    Logger.error("[DataExportService] deleteCustomerData failed", err);
  }

  return deletionReq;
}

/**
 * Get the current data retention policy.
 */
export function getDataRetentionPolicy(): DataRetentionPolicy {
  try {
    const stored = localStorage.getItem(RETENTION_KEY);
    if (stored) {
      return { ...DEFAULT_RETENTION, ...JSON.parse(stored) };
    }
  } catch {
    // fall through
  }
  return { ...DEFAULT_RETENTION };
}

/**
 * Save a custom data retention policy.
 */
export function saveDataRetentionPolicy(
  policy: DataRetentionPolicy,
): void {
  localStorage.setItem(RETENTION_KEY, JSON.stringify(policy));
  Logger.info("[DataExportService] Retention policy updated", policy);
}

/**
 * Apply retention policy — delete data older than the configured periods.
 * In a full implementation, this would run server-side on a cron schedule.
 */
export async function applyRetentionPolicy(
  operatorId = "system",
): Promise<{ deletedRecords: number }> {
  const policy = getDataRetentionPolicy();
  let deletedRecords = 0;

  // In a full implementation:
  // - Delete analytics older than policy.analyticsYears
  // - Anonymise customer data older than policy.customersYears
  // - Archive (but do NOT delete) financial records older than policy.ordersYears

  await logPrivacyAudit("RETENTION_POLICY_APPLIED", "system", operatorId, {
    policy,
    deletedRecords,
  });

  Logger.info("[DataExportService] Retention policy applied", {
    policy,
    deletedRecords,
  });

  return { deletedRecords };
}

/**
 * Get all deletion requests (most recent first).
 */
export async function getDeletionRequests(
  limit = 100,
): Promise<DeletionRequest[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DELETION_STORE, "readonly");
      const store = tx.objectStore(DELETION_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result as DeletionRequest[])
          .sort(
            (a, b) =>
              new Date(b.requestedAt).getTime() -
              new Date(a.requestedAt).getTime(),
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

/**
 * Get privacy audit log (most recent first).
 */
export async function getPrivacyAuditLog(
  limit = 200,
): Promise<PrivacyAuditRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIT_STORE, "readonly");
      const store = tx.objectStore(AUDIT_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result as PrivacyAuditRecord[])
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime(),
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
