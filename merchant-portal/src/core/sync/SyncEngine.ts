import { IndexedDBQueue } from './IndexedDBQueue';
import { calculateNextRetry, MAX_RETRIES } from './RetryStrategy';
import type { OfflineQueueItem } from './types';
import { Logger } from '../logger';
import { supabase } from '../supabase';
import { DbWriteGate } from '../governance/DbWriteGate';
import { ConflictResolver } from './ConflictResolver';
import { PaymentEngine } from '../tpv/PaymentEngine';

/**
 * SyncEngine - The Core Worker
 * 
 * Responsibilities:
 * 1. Monitors Network Status
 * 2. Process Offline Queue
 * 3. Handles Retries with Backoff
 * 4. Ensures Idempotency via RPCs
 * 5. Notifies UI of state changes
 */

export type SyncEngineState = {
    isProcessing: boolean;
    networkStatus: 'online' | 'offline';
    pendingCount: number;
};

export type SyncListener = (state: SyncEngineState) => void;

class SyncEngineClass {
    private isProcessing = false;
    private networkStatus: 'online' | 'offline' = navigator.onLine ? 'online' : 'offline';
    private pendingCount = 0;
    private listeners: SyncListener[] = [];
    private heartbeatInterval: any = null;
    private readonly HEARTBEAT_MS = 10000; // Check every 10s for retries

    constructor() {
        this.setupNetworkListeners();
        // Initial count check
        this.updatePendingCount();
    }

    private setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.setNetworkStatus('online');
            this.processQueue();
        });
        window.addEventListener('offline', () => {
            this.setNetworkStatus('offline');
        });
    }

    private setNetworkStatus(status: 'online' | 'offline') {
        this.networkStatus = status;
        this.notifyListeners(); // Notify UI
        Logger.info(`[SyncEngine] Network is now ${status}`);
    }

    private async updatePendingCount() {
        try {
            const pending = await IndexedDBQueue.getPending();
            this.pendingCount = pending.length;
            this.notifyListeners();
        } catch (e) {
            // Ignore error on counting
        }
        this.manageHeartbeat();
    }

    private notifyListeners() {
        const state: SyncEngineState = {
            isProcessing: this.isProcessing,
            networkStatus: this.networkStatus,
            pendingCount: this.pendingCount
        };
        this.listeners.forEach(l => l(state));
    }

    public subscribe(listener: SyncListener) {
        this.listeners.push(listener);
        // Immediate callback with current state
        listener({
            isProcessing: this.isProcessing,
            networkStatus: this.networkStatus,
            pendingCount: this.pendingCount
        });
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public getNetworkStatus() {
        return this.networkStatus;
    }

    private manageHeartbeat() {
        if (this.pendingCount > 0 && this.networkStatus === 'online') {
            this.startHeartbeat();
        } else {
            this.stopHeartbeat();
        }
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) return;
        Logger.info('[SyncEngine] Starting Heartbeat ❤️');
        this.heartbeatInterval = setInterval(() => {
            if (!this.isProcessing && this.networkStatus === 'online') {
                this.processQueue();
            }
        }, this.HEARTBEAT_MS);
    }

    private stopHeartbeat() {
        if (!this.heartbeatInterval) return;
        Logger.info('[SyncEngine] Stopping Heartbeat 💤');
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
    }

    /**
     * Main Processing Loop
     */
    public async processQueue() {
        if (this.isProcessing) return;
        if (this.networkStatus === 'offline') return;

        this.isProcessing = true;
        this.notifyListeners();
        Logger.info('[SyncEngine] Starting queue processing...');

        try {
            const pendingItems = await IndexedDBQueue.getPending();

            if (pendingItems.length === 0) {
                Logger.info('[SyncEngine] No pending items.');
                this.isProcessing = false;
                this.notifyListeners();
                return;
            }

            Logger.info(`[SyncEngine] Found ${pendingItems.length} pending items.`);

            for (const item of pendingItems) {
                // Double check connectivity
                if (!navigator.onLine) {
                    this.setNetworkStatus('offline');
                    break;
                }

                await this.processItem(item);
            }

        } catch (err) {
            Logger.error('[SyncEngine] Critical error in processing loop', err);
        } finally {
            this.isProcessing = false;
            await this.updatePendingCount(); // Ensure count uses DB truth
            this.notifyListeners();
            this.manageHeartbeat(); // Re-evaluate heartbeat
        }
    }

    /**
     * Process Individual Item
     */
    private async processItem(item: OfflineQueueItem) {
        try {
            // Mark as syncing
            await IndexedDBQueue.updateStatus(item.id, 'syncing');
            this.notifyListeners(); // Update syncing status UI

            // Dispatch to Processor
            await this.dispatch(item);

            // Mark as applied
            await IndexedDBQueue.updateStatus(item.id, 'applied');
            Logger.info(`[SyncEngine] Item ${item.id} applied successfully.`);

        } catch (err: any) {
            const currentAttempts = (item.attempts || 0) + 1;

            if (currentAttempts > MAX_RETRIES) {
                Logger.error(`[SyncEngine] Item ${item.id} reached max retries (${MAX_RETRIES}). Moving to Dead Letter. Error: ${err.message}`);
                await IndexedDBQueue.updateStatus(item.id, 'dead_letter', err.message || 'Max retries exceeded');
                return;
            }

            // Calculate Retry
            const nextRetry = Date.now() + calculateNextRetry(item.attempts || 0);

            await IndexedDBQueue.updateStatus(
                item.id,
                'failed',
                err.message || 'Unknown error',
                nextRetry
            );

            Logger.warn(`[SyncEngine] Item ${item.id} failed. Retrying in ${(nextRetry - Date.now()) / 1000}s`, err);
        }
    }

    /**
     * Dispatcher - Routes to appropriate RPC/Mutation
     */
    private async dispatch(item: OfflineQueueItem) {
        switch (item.type) {
            case 'ORDER_CREATE':
                await this.syncOrderCreate(item.payload);
                break;
            case 'ORDER_UPDATE':
                await this.syncOrderUpdate(item.payload, item.createdAt);
                break;
            case 'ORDER_PAY':
                await this.syncOrderPay(item.payload);
                break;
            // Legacy/Mapping support
            case 'ORDER_ADD_ITEM':
            case 'ORDER_UPDATE_ITEM_QTY':
            case 'ORDER_REMOVE_ITEM':
            case 'ORDER_CANCEL':
                // Remap legacy types to generic update if needed aimed at same endpoint?
                // For now, assume payload has enough info or map carefully.
                // Better to throw if not supported yet to avoid data corruption.
                await this.syncOrderUpdate({ ...(item.payload as any), action: this.mapLegacyTypeToAction(item.type) }, item.createdAt);
                break;
            default:
                throw new Error(`Unknown item type: ${item.type}`);
        }
    }

    private mapLegacyTypeToAction(type: string): string {
        if (type === 'ORDER_ADD_ITEM') return 'add_item';
        if (type === 'ORDER_UPDATE_ITEM_QTY') return 'update_quantity';
        if (type === 'ORDER_REMOVE_ITEM') return 'remove_item';
        if (type === 'ORDER_CANCEL') return 'cancel';
        return 'update';
    }

    /**
     * Handler: ORDER_CREATE
     * Uses create_order_atomic RPC which MUST handle idempotency via localId
     */
    private async syncOrderCreate(payload: any) {
        // Ensure payload has minimal required fields for RPC
        if (!payload.items || payload.items.length === 0) {
            throw new Error('Order has no items');
        }

        // Call RPC
        const { data, error } = await supabase.rpc('create_order_atomic', {
            p_restaurant_id: payload.restaurantId,
            p_table_number: payload.tableNumber,
            p_items: payload.items,
            p_source: payload.source || 'offline_sync',
            p_sync_metadata: {
                localId: payload.localId,
                syncedAt: new Date().toISOString()
            }
        });

        if (error) throw error;
        return data;
    }

    /**
     * Handler: ORDER_PAY
     */
    private async syncOrderPay(payload: any) {
        // Ensure required fields
        if (!payload.orderId || !payload.restaurantId || !payload.amountCents || !payload.method || !payload.cashRegisterId) {
            throw new Error('Missing required fields for payment sync');
        }

        const input = {
            orderId: payload.orderId,
            restaurantId: payload.restaurantId,
            cashRegisterId: payload.cashRegisterId,
            amountCents: payload.amountCents,
            method: payload.method,
            metadata: { operatorId: payload.operatorId, ...payload.metadata },
            // Use existing idempotency or generate deterministic one
            idempotencyKey: payload.idempotencyKey || `offline-pay-${payload.orderId}-${payload.amountCents}`
        };

        if (payload.isPartial) {
            await PaymentEngine.processSplitPayment(input);
        } else {
            await PaymentEngine.processPayment(input);
        }
    }

    /**
     * Handler: ORDER_UPDATE
     */
    private async syncOrderUpdate(payload: any, timestamp: number) {
        const { orderId, action, restaurantId } = payload;

        if (!orderId || !restaurantId) throw new Error('Missing orderId or restaurantId for update');

        // Conflict Resolution (LWW) - Skip if stale
        // Only check for full status updates or generic updates. 
        // 'add_item' might be append-only, so strictly LWW on "updated_at" might not block appending items?
        // BUT if the order is CLOSED remotely, we shouldn't add items?
        // For simplicity, apply LWW check to the Order Entity itself.
        const shouldApply = await ConflictResolver.shouldApplyUpdate('gm_orders', orderId, timestamp);
        if (!shouldApply) {
            Logger.info(`[SyncEngine] Dropping stale update for order ${orderId} (Action: ${action})`);
            return;
        }

        Logger.info(`[SyncEngine] Syncing update: ${action} for ${orderId}`);

        // Replicate DbWriteGate logic from OrderContext
        if (action === 'add_item' && payload.items) {
            // Recalculate total? In async mode, we might trust the payload's total
            // or just append items safely.
            // Using DbWriteGate to ensure consistency.

            await DbWriteGate.insert('SyncEngine', 'gm_order_items', payload.items.map((item: any) => ({
                order_id: orderId,
                product_id: item.id || item.product_id,
                name_snapshot: item.name,
                price_snapshot: Math.round(item.price * 100), // Ensure cents
                quantity: item.quantity,
                subtotal_cents: Math.round(item.price * item.quantity * 100)
            })), { tenantId: restaurantId });

            // Update header total if provided
            if (payload.total !== undefined) {
                await DbWriteGate.update('SyncEngine', 'gm_orders', {
                    total_cents: Math.round(payload.total * 100),
                    updated_at: new Date().toISOString()
                }, { id: orderId }, { tenantId: restaurantId });
            }
        }
        else if (action === 'cancel') {
            await DbWriteGate.update('SyncEngine', 'gm_orders', {
                status: 'CANCELLED',
                updated_at: new Date().toISOString()
            }, { id: orderId }, { tenantId: restaurantId });
        }
        else if (action === 'send' || action === 'serve' || action === 'close') {
            let status = 'IN_PREP';
            if (action === 'serve' || action === 'close') status = 'COMPLETED';

            await DbWriteGate.update('SyncEngine', 'gm_orders', {
                status,
                updated_at: new Date().toISOString()
            }, { id: orderId }, { tenantId: restaurantId });
        }
        else {
            // Generic update fallback
            await DbWriteGate.update('SyncEngine', 'gm_orders', {
                updated_at: new Date().toISOString(),
                ...payload.updates // specific field updates
            }, { id: orderId }, { tenantId: restaurantId });
        }
    }
}

export const SyncEngine = new SyncEngineClass();
