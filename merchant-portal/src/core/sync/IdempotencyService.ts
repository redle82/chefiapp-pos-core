/**
 * IdempotencyService — Prevents duplicate mutations in offline-first POS.
 *
 * Every mutation gets a unique idempotency key. Before sending to the server,
 * we check if this key was already processed. Server responses are cached
 * so duplicate retries return the cached result instantly.
 *
 * Storage: IndexedDB with 24h TTL auto-cleanup.
 * Key generation: deterministic from (action, entityId) to deduplicate
 * identical operations even across queue restarts.
 */

import { openDB, type IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProcessedEntry {
  key: string;
  processedAt: number;
  response: unknown;
  expiresAt: number;
}

interface IdempotencyDB {
  processed: {
    key: string;
    value: ProcessedEntry;
    indexes: {
      expiresAt: number;
    };
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_NAME = 'chefiapp_idempotency';
const DB_VERSION = 1;
const STORE_NAME = 'processed';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ─── Service ─────────────────────────────────────────────────────────────────

class IdempotencyServiceClass {
  private dbPromise: Promise<IDBPDatabase<IdempotencyDB>> | null = null;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  private async db(): Promise<IDBPDatabase<IdempotencyDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<IdempotencyDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            store.createIndex('expiresAt', 'expiresAt', { unique: false });
          }
        },
      }).catch((err) => {
        this.dbPromise = null;
        throw err;
      });
    }
    return this.dbPromise;
  }

  /**
   * Generate a deterministic idempotency key for a given action and entity.
   * Same action + entityId always produces the same key within a session,
   * preventing duplicate operations even if the queue item is re-created.
   *
   * For truly unique operations (no entity yet), pass no entityId to get a UUID.
   */
  generateKey(action: string, entityId?: string): string {
    if (entityId) {
      return `${action}:${entityId}`;
    }
    return `${action}:${uuidv4()}`;
  }

  /**
   * Check if an idempotency key was already processed (and not expired).
   */
  async isProcessed(key: string): Promise<boolean> {
    try {
      const database = await this.db();
      const entry = await database.get(STORE_NAME, key);
      if (!entry) return false;
      if (entry.expiresAt < Date.now()) {
        // Expired — clean up and treat as not processed
        await database.delete(STORE_NAME, key);
        return false;
      }
      return true;
    } catch (err) {
      Logger.error('[IdempotencyService] isProcessed check failed', err);
      // Fail-open: allow the operation to proceed rather than block
      return false;
    }
  }

  /**
   * Mark a key as processed with the server response.
   * Stored with a 24h TTL.
   */
  async markProcessed(key: string, response: unknown): Promise<void> {
    try {
      const database = await this.db();
      const entry: ProcessedEntry = {
        key,
        processedAt: Date.now(),
        response,
        expiresAt: Date.now() + TTL_MS,
      };
      await database.put(STORE_NAME, entry);
      Logger.info(`[IdempotencyService] Marked processed: ${key}`);
    } catch (err) {
      Logger.error('[IdempotencyService] markProcessed failed', err);
      // Non-fatal: worst case is a duplicate that the server should also reject
    }
  }

  /**
   * Get the cached response for a previously processed key.
   * Returns null if not found or expired.
   */
  async getProcessedResult(key: string): Promise<unknown | null> {
    try {
      const database = await this.db();
      const entry = await database.get(STORE_NAME, key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        await database.delete(STORE_NAME, key);
        return null;
      }
      return entry.response;
    } catch (err) {
      Logger.error('[IdempotencyService] getProcessedResult failed', err);
      return null;
    }
  }

  /**
   * Remove expired entries from the store.
   * Called periodically via the cleanup interval.
   */
  async cleanupExpired(): Promise<number> {
    try {
      const database = await this.db();
      const now = Date.now();
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const index = tx.store.index('expiresAt');

      let removed = 0;
      let cursor = await index.openCursor(IDBKeyRange.upperBound(now));

      while (cursor) {
        await cursor.delete();
        removed++;
        cursor = await cursor.continue();
      }

      await tx.done;

      if (removed > 0) {
        Logger.info(`[IdempotencyService] Cleaned up ${removed} expired entries`);
      }
      return removed;
    } catch (err) {
      Logger.error('[IdempotencyService] Cleanup failed', err);
      return 0;
    }
  }

  /**
   * Start periodic cleanup of expired entries.
   * Should be called once at app startup.
   */
  startCleanupInterval(): void {
    if (this.cleanupIntervalId) return;
    // Run cleanup immediately on start
    this.cleanupExpired();
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpired();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop the cleanup interval (for testing / shutdown).
   */
  stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
}

export const IdempotencyService = new IdempotencyServiceClass();
