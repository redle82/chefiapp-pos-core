/**
 * OfflineSyncBridge — Bridge between OfflineOrderStore and SyncEngine.
 *
 * When connectivity returns, this bridge:
 * 1. Reads all pending local orders from OfflineOrderStore
 * 2. Enqueues them into the SyncEngine queue (IndexedDBQueue)
 * 3. Tracks sync results and updates local order status
 * 4. Handles conflict resolution for orders that diverged
 */

import { Logger } from '../logger';
import { IndexedDBQueue } from './IndexedDBQueue';
import { OfflineOrderStore, type LocalOrder } from './OfflineOrderStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  /** Total orders that were pending sync. */
  total: number;
  /** Orders successfully enqueued for sync. */
  enqueued: number;
  /** Orders that failed to enqueue. */
  failed: number;
  /** Orders already synced (skipped). */
  skipped: number;
}

// Use the SyncEngine instance type (singleton pattern in codebase)
type SyncEngineInstance = {
  forceSync: () => void;
  subscribe: (listener: (state: { isProcessing: boolean }) => void) => () => void;
  getConnectivity: () => string;
};

// ─── OfflineSyncBridge ───────────────────────────────────────────────────────

export class OfflineSyncBridge {
  private syncing = false;

  constructor(
    private readonly syncEngine: SyncEngineInstance,
    private readonly orderStore: OfflineOrderStore,
  ) {}

  /**
   * Push all pending local orders into the SyncEngine queue.
   * Called when connectivity is restored.
   *
   * @returns Summary of the sync operation
   */
  async syncPendingOrders(): Promise<SyncResult> {
    if (this.syncing) {
      Logger.info('[OfflineSyncBridge] Sync already in progress, skipping');
      return { total: 0, enqueued: 0, failed: 0, skipped: 0 };
    }

    this.syncing = true;
    const result: SyncResult = { total: 0, enqueued: 0, failed: 0, skipped: 0 };

    try {
      const pending = await this.orderStore.getPendingSyncOrders();
      result.total = pending.length;

      if (pending.length === 0) {
        Logger.info('[OfflineSyncBridge] No pending orders to sync');
        return result;
      }

      Logger.info(`[OfflineSyncBridge] Syncing ${pending.length} pending orders`);

      for (const order of pending) {
        try {
          // Skip orders that are already being synced or synced
          if (order.syncStatus === 'syncing') {
            result.skipped++;
            continue;
          }

          // Mark as syncing in local store
          await this.orderStore.updateOrder(order.id, { syncStatus: 'syncing' });

          // Enqueue to SyncEngine via IndexedDBQueue
          await IndexedDBQueue.put({
            id: `order-create-${order.id}`,
            type: 'ORDER_CREATE',
            payload: {
              localId: order.id,
              restaurant_id: order.restaurantId,
              table_number: order.tableNumber?.toString(),
              items: order.items.map((item) => ({
                product_id: item.productId,
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unitPriceCents,
              })),
              source: 'offline_sync_bridge',
            },
            createdAt: order.createdAt,
            attempts: 0,
            status: 'queued',
            idempotency_key: `order-create-${order.id}`,
          });

          result.enqueued++;
        } catch (err) {
          Logger.error(`[OfflineSyncBridge] Failed to enqueue order ${order.id}`, err);
          await this.orderStore.updateOrder(order.id, {
            syncStatus: 'local',
            syncError: err instanceof Error ? err.message : String(err),
          });
          result.failed++;
        }
      }

      // Trigger SyncEngine to process the queue
      if (result.enqueued > 0) {
        this.syncEngine.forceSync();
      }

      Logger.info(
        `[OfflineSyncBridge] Sync complete: ${result.enqueued} enqueued, ${result.failed} failed, ${result.skipped} skipped`,
      );
    } catch (err) {
      Logger.error('[OfflineSyncBridge] Critical error during sync', err);
    } finally {
      this.syncing = false;
    }

    return result;
  }

  /**
   * Handle conflict resolution when a local order diverges from Core state.
   * Strategy: Local order data takes precedence (LWW by createdAt).
   * If Core already has the order (by idempotency key), we mark local as synced.
   *
   * @param localOrder - The local order
   * @param coreOrder - The order state from Core (if found)
   */
  async resolveConflict(localOrder: LocalOrder, coreOrder: { id: string; status?: string }): Promise<void> {
    try {
      if (coreOrder?.id) {
        // Core already has this order — mark local as synced
        await this.orderStore.markSynced(localOrder.id, coreOrder.id);
        Logger.info(
          `[OfflineSyncBridge] Conflict resolved: local ${localOrder.id} mapped to core ${coreOrder.id}`,
        );
      } else {
        // Mark as conflict for manual resolution
        await this.orderStore.updateOrder(localOrder.id, {
          syncStatus: 'conflict',
          syncError: 'Order not found in Core after sync attempt',
        });
        Logger.warn(
          `[OfflineSyncBridge] Order ${localOrder.id} marked as conflict — core order not found`,
        );
      }
    } catch (err) {
      Logger.error(`[OfflineSyncBridge] Failed to resolve conflict for order ${localOrder.id}`, err);
    }
  }
}
