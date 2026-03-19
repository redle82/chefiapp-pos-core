/**
 * OfflineDataCache — Caches essential operational data in IndexedDB for offline POS use.
 *
 * Stores:
 * - Product catalog (delegates to OfflineCatalogCache)
 * - Table list
 * - Active orders
 * - Operator info
 *
 * Auto-refreshes when online. Exposes hooks for React consumption.
 */

import { Logger } from '../logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedTable {
  id: string;
  number: number | string;
  label?: string;
  zone?: string;
  status?: string;
}

export interface CachedOrder {
  id: string;
  table_id?: string;
  table_number?: number | string;
  status: string;
  total_cents: number;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface CachedOperator {
  id: string;
  name: string;
  role?: string;
  pin_hash?: string;
}

interface OfflineDataStore {
  tables: CachedTable[];
  orders: CachedOrder[];
  operators: CachedOperator[];
  updatedAt: number;
  restaurantId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = 'chefiapp_offline_data';
const DB_VERSION = 1;
const STORE_NAME = 'data';
const DEFAULT_FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes

// ─── Database ─────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      Logger.error('[OfflineDataCache] DB open failed', request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'restaurantId' });
      }
    };
  });
}

// ─── OfflineDataCache ─────────────────────────────────────────────────────────

export const OfflineDataCache = {
  /**
   * Save tables, orders, and operators for a restaurant.
   */
  async save(
    restaurantId: string,
    data: {
      tables?: CachedTable[];
      orders?: CachedOrder[];
      operators?: CachedOperator[];
    },
  ): Promise<void> {
    try {
      const db = await openDB();
      const existing = await this._get(db, restaurantId);

      const store: OfflineDataStore = {
        restaurantId,
        tables: data.tables ?? existing?.tables ?? [],
        orders: data.orders ?? existing?.orders ?? [],
        operators: data.operators ?? existing?.operators ?? [],
        updatedAt: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const objectStore = tx.objectStore(STORE_NAME);
        const req = objectStore.put(store);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      Logger.info(
        `[OfflineDataCache] Saved for ${restaurantId}: ${store.tables.length} tables, ${store.orders.length} orders, ${store.operators.length} operators`,
      );
    } catch (err) {
      Logger.error('[OfflineDataCache] Save failed', err);
    }
  },

  /**
   * Get all cached data for a restaurant.
   */
  async get(restaurantId: string): Promise<OfflineDataStore | null> {
    try {
      const db = await openDB();
      return await this._get(db, restaurantId);
    } catch (err) {
      Logger.error('[OfflineDataCache] Get failed', err);
      return null;
    }
  },

  /**
   * Get cached tables for a restaurant.
   */
  async getTables(restaurantId: string): Promise<CachedTable[]> {
    const data = await this.get(restaurantId);
    return data?.tables ?? [];
  },

  /**
   * Get cached active orders for a restaurant.
   */
  async getOrders(restaurantId: string): Promise<CachedOrder[]> {
    const data = await this.get(restaurantId);
    return data?.orders ?? [];
  },

  /**
   * Get cached operators for a restaurant.
   */
  async getOperators(restaurantId: string): Promise<CachedOperator[]> {
    const data = await this.get(restaurantId);
    return data?.operators ?? [];
  },

  /**
   * Check if the cached data is still fresh.
   */
  async isFresh(
    restaurantId: string,
    maxAgeMs: number = DEFAULT_FRESHNESS_MS,
  ): Promise<boolean> {
    const data = await this.get(restaurantId);
    if (!data) return false;
    return Date.now() - data.updatedAt < maxAgeMs;
  },

  /**
   * Invalidate (delete) cached data for a restaurant.
   */
  async invalidate(restaurantId: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const objectStore = tx.objectStore(STORE_NAME);
        const req = objectStore.delete(restaurantId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      Logger.info(`[OfflineDataCache] Invalidated for ${restaurantId}`);
    } catch (err) {
      Logger.error('[OfflineDataCache] Invalidate failed', err);
    }
  },

  /** Internal: read from an already-opened DB. */
  async _get(
    db: IDBDatabase,
    restaurantId: string,
  ): Promise<OfflineDataStore | null> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const objectStore = tx.objectStore(STORE_NAME);
      const req = objectStore.get(restaurantId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  },
};
