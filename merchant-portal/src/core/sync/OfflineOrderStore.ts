/**
 * OfflineOrderStore — Local order persistence in IndexedDB for offline POS operation.
 *
 * Stores orders created while Core is unreachable. Each order carries a syncStatus
 * that tracks its lifecycle from local creation through synchronisation with Core.
 *
 * IndexedDB database: chefiapp_orders_local
 * Store: orders (keyPath: id)
 * Indexes: restaurantId, syncStatus, createdAt
 */

import { openDB, type IDBPDatabase } from 'idb';
import { Logger } from '../logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderSyncStatus = 'local' | 'syncing' | 'synced' | 'conflict';

export type LocalOrderStatus = 'OPEN' | 'PREPARING' | 'READY' | 'CLOSED';

export interface LocalOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  modifiers?: Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
  notes?: string;
}

export interface LocalOrder {
  id: string;
  restaurantId: string;
  tableNumber?: number;
  operatorId: string;
  operatorName: string;
  items: LocalOrderItem[];
  status: LocalOrderStatus;
  totalCents: number;
  taxCents: number;
  createdAt: number;
  updatedAt?: number;
  syncStatus: OrderSyncStatus;
  coreOrderId?: string;
  syncError?: string;
}

// ─── Database Schema ─────────────────────────────────────────────────────────

const DB_NAME = 'chefiapp_orders_local';
const DB_VERSION = 1;
const STORE_NAME = 'orders';

interface OrdersDB {
  orders: {
    key: string;
    value: LocalOrder;
    indexes: {
      restaurantId: string;
      syncStatus: OrderSyncStatus;
      createdAt: number;
    };
  };
}

async function getDB(): Promise<IDBPDatabase<OrdersDB>> {
  return openDB<OrdersDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('restaurantId', 'restaurantId', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
    blocked() {
      Logger.warn('[OfflineOrderStore] DB upgrade blocked by another tab');
    },
    blocking() {
      Logger.warn('[OfflineOrderStore] This tab is blocking a DB upgrade');
    },
  });
}

// ─── OfflineOrderStore ───────────────────────────────────────────────────────

export class OfflineOrderStore {
  private dbPromise: Promise<IDBPDatabase<OrdersDB>> | null = null;

  /** Lazy-initialise the database connection. */
  private async db(): Promise<IDBPDatabase<OrdersDB>> {
    if (!this.dbPromise) {
      this.dbPromise = getDB().catch((err) => {
        this.dbPromise = null;
        throw err;
      });
    }
    return this.dbPromise;
  }

  /**
   * Create a new local order.
   *
   * @param order - The order to store locally
   * @returns The order ID
   */
  async createOrder(order: LocalOrder): Promise<string> {
    try {
      const db = await this.db();
      await db.put(STORE_NAME, {
        ...order,
        syncStatus: order.syncStatus ?? 'local',
        createdAt: order.createdAt ?? Date.now(),
      });
      Logger.info(`[OfflineOrderStore] Created local order ${order.id}`);
      return order.id;
    } catch (err) {
      Logger.error('[OfflineOrderStore] Failed to create order', err);
      throw err;
    }
  }

  /**
   * Update an existing local order with partial data.
   *
   * @param id - Order ID
   * @param updates - Partial order fields to update
   */
  async updateOrder(id: string, updates: Partial<LocalOrder>): Promise<void> {
    try {
      const db = await this.db();
      const existing = await db.get(STORE_NAME, id);
      if (!existing) {
        throw new Error(`Order ${id} not found in local store`);
      }
      const updated: LocalOrder = {
        ...existing,
        ...updates,
        id, // Ensure ID is never overwritten
        updatedAt: Date.now(),
      };
      await db.put(STORE_NAME, updated);
      Logger.info(`[OfflineOrderStore] Updated order ${id}`);
    } catch (err) {
      Logger.error(`[OfflineOrderStore] Failed to update order ${id}`, err);
      throw err;
    }
  }

  /**
   * Retrieve a single order by ID.
   *
   * @param id - Order ID
   * @returns The order, or null if not found
   */
  async getOrder(id: string): Promise<LocalOrder | null> {
    try {
      const db = await this.db();
      const result = await db.get(STORE_NAME, id);
      return result ?? null;
    } catch (err) {
      Logger.error(`[OfflineOrderStore] Failed to get order ${id}`, err);
      return null;
    }
  }

  /**
   * Get all active (non-CLOSED) orders for a restaurant, sorted by creation time.
   *
   * @param restaurantId - Restaurant identifier
   * @returns Active local orders
   */
  async getActiveOrders(restaurantId: string): Promise<LocalOrder[]> {
    try {
      const db = await this.db();
      const all = await db.getAllFromIndex(STORE_NAME, 'restaurantId', restaurantId);
      return all
        .filter((o) => o.status !== 'CLOSED')
        .sort((a, b) => a.createdAt - b.createdAt);
    } catch (err) {
      Logger.error('[OfflineOrderStore] Failed to get active orders', err);
      return [];
    }
  }

  /**
   * Mark a local order as synced with Core.
   *
   * @param localId - Local order ID
   * @param coreOrderId - The ID assigned by Core after sync
   */
  async markSynced(localId: string, coreOrderId: string): Promise<void> {
    try {
      await this.updateOrder(localId, {
        syncStatus: 'synced',
        coreOrderId,
        syncError: undefined,
      });
      Logger.info(`[OfflineOrderStore] Order ${localId} synced as ${coreOrderId}`);
    } catch (err) {
      Logger.error(`[OfflineOrderStore] Failed to mark order ${localId} as synced`, err);
      throw err;
    }
  }

  /**
   * Get all orders that need to be synced with Core.
   * Returns orders with syncStatus 'local' or 'conflict', sorted FIFO.
   *
   * @returns Orders pending synchronisation
   */
  async getPendingSyncOrders(): Promise<LocalOrder[]> {
    try {
      const db = await this.db();
      const local = await db.getAllFromIndex(STORE_NAME, 'syncStatus', 'local');
      const conflict = await db.getAllFromIndex(STORE_NAME, 'syncStatus', 'conflict');
      return [...local, ...conflict].sort((a, b) => a.createdAt - b.createdAt);
    } catch (err) {
      Logger.error('[OfflineOrderStore] Failed to get pending sync orders', err);
      return [];
    }
  }

  /**
   * Delete a local order.
   *
   * @param id - Order ID to delete
   */
  async deleteOrder(id: string): Promise<void> {
    try {
      const db = await this.db();
      await db.delete(STORE_NAME, id);
      Logger.info(`[OfflineOrderStore] Deleted order ${id}`);
    } catch (err) {
      Logger.error(`[OfflineOrderStore] Failed to delete order ${id}`, err);
      throw err;
    }
  }
}
