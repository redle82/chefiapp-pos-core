
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Alert } from 'react-native';

const QUEUE_KEY = '@mutation_queue_v1';

export type MutationType =
    | 'CREATE_ORDER'
    | 'UPDATE_ORDER_STATUS'
    | 'ADD_ORDER_ITEMS'
    | 'CLOSE_SHIFT'
    | 'ADD_PAYMENT';

export interface QueueItem {
    id: string; // UUID of the item being acted on (if available) or random
    mutationType: MutationType;
    payload: any;
    timestamp: number;
    retryCount: number;
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const OfflineQueueService = {
    storage: AsyncStorage as any,
    db: supabase as any,

    /**
     * For testing/DI
     */
    init(storageVal: any, dbVal: any) {
        this.storage = storageVal;
        this.db = dbVal;
    },

    /**
     * Add an item to the queue
     */
    async enqueue(mutationType: MutationType, payload: any) {
        try {
            const currentQueue = await this.getQueue();
            const newItem: QueueItem = {
                id: generateUUID(),
                mutationType,
                payload,
                timestamp: Date.now(),
                retryCount: 0
            };

            const newQueue = [...currentQueue, newItem];
            await this.storage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
            console.log(`[OfflineQueue] Enqueued ${mutationType}`, payload);
            return newItem.id;
        } catch (e) {
            console.error('[OfflineQueue] Enqueue Failed', e);
            return null;
        }
    },

    /**
     * Get all pending items
     */
    async getQueue(): Promise<QueueItem[]> {
        try {
            const json = await this.storage.getItem(QUEUE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('[OfflineQueue] GetQueue Failed', e);
            return [];
        }
    },

    /**
     * Remove an item (after success)
     */
    async dequeue(itemId: string) {
        try {
            const currentQueue = await this.getQueue();
            const newQueue = currentQueue.filter(i => i.id !== itemId);
            await this.storage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
        } catch (e) {
            console.error('[OfflineQueue] Dequeue Failed', e);
        }
    },

    /**
     * Clear Queue (Safety Valve)
     */
    async clearQueue() {
        await this.storage.removeItem(QUEUE_KEY);
    },

    /**
     * Process the entire queue (Simple FIFO)
     * Returns number of items successfully processed
     */
    async processQueue(): Promise<number> {
        const queue = await this.getQueue();
        if (queue.length === 0) return 0;

        console.log(`[OfflineQueue] Processing ${queue.length} items...`);
        let successCount = 0;

        for (const item of queue) {
            const success = await this.processItem(item);
            if (success) {
                await this.dequeue(item.id);
                successCount++;
            } else {
                // Stop on first failure to preserve order/dependencies for now.
                console.warn(`[OfflineQueue] Item ${item.id} failed. Stopping queue processing.`);
                break;
            }
        }
        return successCount;
    },

    /**
     * Validates and executes a single mutation
     */
    async processItem(item: QueueItem): Promise<boolean> {
        try {
            switch (item.mutationType) {
                case 'UPDATE_ORDER_STATUS':
                    return await this.syncUpdateOrderStatus(item.payload);
                case 'ADD_PAYMENT':
                    return await this.syncAddPayment(item.payload);
                case 'CLOSE_SHIFT':
                    return await this.syncCloseShift(item.payload);
                default:
                    console.warn(`[OfflineQueue] Unknown mutation type: ${item.mutationType}`);
                    return true; // Dequeue unknown items to prevent blocking
            }
        } catch (e) {
            console.error(`[OfflineQueue] Process Error [${item.mutationType}]`, e);
            return false;
        }
    },

    // --- WORKERS ---

    async syncCreateOrder(payload: any) {
        console.log('[OfflineQueue] Replaying CREATE_ORDER');
        const { error } = await this.db.from('gm_orders').insert(payload);
        if (error) {
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    },

    async syncAddOrderItems(payload: any) {
        console.log('[OfflineQueue] Replaying ADD_ORDER_ITEMS');
        const { error } = await this.db.from('gm_order_items').insert(payload);
        if (error) {
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    },

    async syncUpdateOrderStatus(payload: any) {
        console.log('[OfflineQueue] Replaying UPDATE_ORDER_STATUS', payload);
        const { orderId, status } = payload;
        const { error } = await this.db
            .from('gm_orders')
            .update({ status })
            .eq('id', orderId);

        if (error) {
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    },

    async syncAddPayment(payload: any) {
        console.log('[OfflineQueue] Replaying ADD_PAYMENT', payload);
        const { orderId, method, status } = payload;
        const updatePayload: any = { status: status || 'PAID', payment_method: method, payment_status: 'paid' };

        const { error } = await this.db
            .from('gm_orders')
            .update(updatePayload)
            .eq('id', orderId);

        if (error) {
            // Handle if payment_method column doesn't exist yet (resilience)
            if (error.message?.includes('payment_method')) {
                delete updatePayload.payment_method;
                const { error: retryError } = await this.db
                    .from('gm_orders')
                    .update(updatePayload)
                    .eq('id', orderId);
                if (retryError) return false;
                return true;
            }
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    },

    async syncCloseShift(payload: any) {
        console.log('[OfflineQueue] Replaying CLOSE_SHIFT');
        const { shiftId, ...updates } = payload;
        const { error } = await this.db
            .from('gm_shifts')
            .update(updates)
            .eq('id', shiftId);

        if (error) {
            console.error('[OfflineQueue] Sync Error:', error.message);
            return false;
        }
        return true;
    }
};
