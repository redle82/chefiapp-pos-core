/**
 * ConsentService — GDPR-compliant consent management via IndexedDB.
 *
 * Immutable append-only log: consent records are never deleted or modified.
 * The latest record per (customerId, type) determines current consent state.
 *
 * Consent types:
 *   marketing_email, marketing_sms, data_processing, analytics, third_party
 */

import { Logger } from "../logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsentType =
  | "marketing_email"
  | "marketing_sms"
  | "data_processing"
  | "analytics"
  | "third_party";

export const ALL_CONSENT_TYPES: ConsentType[] = [
  "marketing_email",
  "marketing_sms",
  "data_processing",
  "analytics",
  "third_party",
];

export type ConsentSource =
  | "checkout"
  | "cookie_banner"
  | "settings"
  | "admin_manual"
  | "api";

export interface ConsentRecord {
  id: string;
  customerId: string;
  type: ConsentType;
  granted: boolean;
  source: ConsentSource;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Optional metadata (IP hash, user-agent, etc.). */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// IndexedDB constants
// ---------------------------------------------------------------------------

const DB_NAME = "chefiapp_consent";
const STORE_NAME = "gm_consent_log";
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      Logger.error("[ConsentService] IndexedDB open failed", request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("customerId", "customerId", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex(
          "customerId_type",
          ["customerId", "type"],
          { unique: false },
        );
      }
    };
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Append an immutable consent record.
 * Never modifies or deletes existing records (audit trail).
 */
export async function recordConsent(
  customerId: string,
  type: ConsentType,
  granted: boolean,
  source: ConsentSource,
  metadata?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const record: ConsentRecord = {
      id: `consent-${Date.now()}-${crypto.randomUUID()}`,
      customerId,
      type,
      granted,
      source,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => {
        Logger.info("[ConsentService] Consent recorded", {
          customerId,
          type,
          granted,
          source,
        });
        resolve(record.id);
      };
      request.onerror = () => {
        Logger.error("[ConsentService] Failed to write consent", request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    Logger.error("[ConsentService] recordConsent error", err);
    return null;
  }
}

/**
 * Get all consent records for a customer (most recent first).
 */
export async function getConsents(
  customerId: string,
): Promise<ConsentRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("customerId");
      const request = index.getAll(customerId);
      request.onsuccess = () => {
        const records = (request.result as ConsentRecord[]).sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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
 * Revoke a specific consent type for a customer.
 * Appends a new record with granted=false (immutable log).
 */
export async function revokeConsent(
  customerId: string,
  type: ConsentType,
  source: ConsentSource = "settings",
): Promise<string | null> {
  return recordConsent(customerId, type, false, source);
}

/**
 * Check if a customer has active consent for a given type.
 * Returns the latest record's `granted` value, or false if no records exist.
 */
export async function hasConsent(
  customerId: string,
  type: ConsentType,
): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("customerId_type");
      const request = index.getAll([customerId, type]);
      request.onsuccess = () => {
        const records = request.result as ConsentRecord[];
        if (records.length === 0) {
          resolve(false);
          return;
        }
        // Latest record determines current state
        records.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        resolve(records[0].granted);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }
}

/**
 * Get the current consent state for all types for a customer.
 */
export async function getConsentSummary(
  customerId: string,
): Promise<Record<ConsentType, boolean>> {
  const result: Record<ConsentType, boolean> = {
    marketing_email: false,
    marketing_sms: false,
    data_processing: false,
    analytics: false,
    third_party: false,
  };

  const records = await getConsents(customerId);

  // Latest record per type wins
  const seen = new Set<ConsentType>();
  for (const r of records) {
    if (!seen.has(r.type)) {
      result[r.type] = r.granted;
      seen.add(r.type);
    }
  }

  return result;
}
