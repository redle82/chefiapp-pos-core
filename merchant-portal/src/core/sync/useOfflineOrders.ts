/**
 * useOfflineOrders — React hook for offline-first order management.
 *
 * When online: delegates order creation to the existing SyncEngine queue
 *   (which immediately processes via Core).
 * When offline: stores orders locally in OfflineOrderStore (IndexedDB).
 * When connectivity returns: triggers sync of pending local orders via OfflineSyncBridge.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Logger } from '../logger';
import { ConnectivityService } from './ConnectivityService';
import { IndexedDBQueue } from './IndexedDBQueue';
import {
  OfflineOrderStore,
  type LocalOrder,
  type LocalOrderItem,
  type LocalOrderStatus,
} from './OfflineOrderStore';
import { OfflineSyncBridge } from './OfflineSyncBridge';
import { SyncEngine } from './SyncEngine';

// ─── Singleton instances ─────────────────────────────────────────────────────

const orderStore = new OfflineOrderStore();
const syncBridge = new OfflineSyncBridge(SyncEngine, orderStore);

// ─── Input type ──────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  restaurantId: string;
  tableNumber?: number;
  operatorId: string;
  operatorName: string;
  items: LocalOrderItem[];
}

// ─── Return type ─────────────────────────────────────────────────────────────

export interface OfflineOrdersState {
  /** Active orders for the given restaurant (local + synced). */
  orders: LocalOrder[];
  /** Count of orders waiting to be synced with Core. */
  pendingSyncCount: number;
  /** Create a new order (works both online and offline). */
  createOrder: (input: CreateOrderInput) => Promise<string>;
  /** Update an order's status. */
  updateOrderStatus: (id: string, status: LocalOrderStatus) => Promise<void>;
  /** True when operating without Core connectivity. */
  isOfflineMode: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function calculateTotal(items: LocalOrderItem[]): { totalCents: number; taxCents: number } {
  let totalCents = 0;
  for (const item of items) {
    const modifierCents = (item.modifiers ?? []).reduce((sum, m) => sum + m.priceCents, 0);
    totalCents += (item.unitPriceCents + modifierCents) * item.quantity;
  }
  // Tax is embedded in totalCents for POS (IVA included); taxCents is informational
  return { totalCents, taxCents: 0 };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOfflineOrders(restaurantId: string): OfflineOrdersState {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(
    () => ConnectivityService.getConnectivity() !== 'online',
  );

  const mountedRef = useRef(true);

  /** Reload orders from the local store. */
  const reloadOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const active = await orderStore.getActiveOrders(restaurantId);
      const pending = await orderStore.getPendingSyncOrders();
      if (mountedRef.current) {
        setOrders(active);
        setPendingSyncCount(pending.filter((o) => o.restaurantId === restaurantId).length);
      }
    } catch (err) {
      Logger.error('[useOfflineOrders] Failed to reload orders', err);
    }
  }, [restaurantId]);

  /**
   * Create a new order.
   * When online: also enqueues to SyncEngine for immediate Core dispatch.
   * When offline: stores locally for later sync.
   */
  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<string> => {
      const id = generateId();
      const { totalCents, taxCents } = calculateTotal(input.items);
      const now = Date.now();

      const localOrder: LocalOrder = {
        id,
        restaurantId: input.restaurantId,
        tableNumber: input.tableNumber,
        operatorId: input.operatorId,
        operatorName: input.operatorName,
        items: input.items,
        status: 'OPEN',
        totalCents,
        taxCents,
        createdAt: now,
        syncStatus: 'local',
      };

      // Always store locally first (offline-first)
      await orderStore.createOrder(localOrder);

      const isOnline = ConnectivityService.getConnectivity() === 'online';
      if (isOnline) {
        // Enqueue to SyncEngine for immediate processing
        try {
          await IndexedDBQueue.put({
            id: `order-create-${id}`,
            type: 'ORDER_CREATE',
            payload: {
              localId: id,
              restaurant_id: input.restaurantId,
              table_number: input.tableNumber?.toString(),
              items: input.items.map((item) => ({
                product_id: item.productId,
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unitPriceCents,
              })),
              source: 'offline_orders_hook',
            },
            createdAt: now,
            attempts: 0,
            status: 'queued',
            idempotency_key: `order-create-${id}`,
          });
          await orderStore.updateOrder(id, { syncStatus: 'syncing' });
          SyncEngine.forceSync();
        } catch (queueErr: any) {
          Logger.warn('[useOfflineOrders] Failed to enqueue, will sync later', { error: queueErr?.message });
        }
      }

      await reloadOrders();
      return id;
    },
    [reloadOrders],
  );

  /**
   * Update an order's status locally. When online, also queues a sync.
   */
  const updateOrderStatus = useCallback(
    async (id: string, status: LocalOrderStatus): Promise<void> => {
      await orderStore.updateOrder(id, { status });

      const isOnline = ConnectivityService.getConnectivity() === 'online';
      const order = await orderStore.getOrder(id);
      if (isOnline && order?.coreOrderId) {
        const actionMap: Record<string, string> = {
          PREPARING: 'send',
          READY: 'serve',
          CLOSED: 'close',
        };
        const action = actionMap[status];
        if (action) {
          try {
            await IndexedDBQueue.put({
              id: `order-update-${id}-${status}-${Date.now()}`,
              type: 'ORDER_UPDATE',
              payload: {
                orderId: order.coreOrderId,
                restaurantId: order.restaurantId,
                action,
              },
              createdAt: Date.now(),
              attempts: 0,
              status: 'queued',
            });
            SyncEngine.forceSync();
          } catch (queueErr: any) {
            Logger.warn('[useOfflineOrders] Failed to enqueue status update', { error: queueErr?.message });
          }
        }
      }

      await reloadOrders();
    },
    [reloadOrders],
  );

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    reloadOrders();
    return () => {
      mountedRef.current = false;
    };
  }, [reloadOrders]);

  // Listen to connectivity changes
  useEffect(() => {
    let previousStatus = ConnectivityService.getConnectivity();

    const unsubscribe = ConnectivityService.subscribe((status) => {
      const offline = status !== 'online';
      if (mountedRef.current) setIsOfflineMode(offline);

      // When connectivity returns, sync pending orders
      if (previousStatus !== 'online' && status === 'online') {
        Logger.info('[useOfflineOrders] Connectivity restored, syncing pending orders');
        syncBridge.syncPendingOrders().then(() => {
          if (mountedRef.current) reloadOrders();
        });
      }
      previousStatus = status;
    });

    return unsubscribe;
  }, [reloadOrders]);

  // Reload when SyncEngine finishes processing (orders may have been synced)
  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe((state) => {
      if (!state.isProcessing && mountedRef.current) {
        reloadOrders();
      }
    });
    return unsubscribe;
  }, [reloadOrders]);

  return { orders, pendingSyncCount, createOrder, updateOrderStatus, isOfflineMode };
}
