import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { OfflineDB } from '../../../core/queue/db';
import type { OfflineQueueItem, QueueStatus } from '../../../core/queue/types';
import { OrderEngine, type OrderItemInput } from '../../../core/tpv/OrderEngine';
import { Logger } from '../../../core/monitoring/Logger';

// --- Types ---

export interface OfflineOrder {
    local_id: string; // UUID for local tracking
    payload: any; // The raw order object to be sent to DB
    status: 'pending' | 'syncing' | 'synced' | 'error';
    created_at: string;
    retry_count: number;
    error_message?: string;
}

interface OfflineContextType {
    isOffline: boolean;
    queue: OfflineOrder[];
    addToQueue: (orderPayload: any) => Promise<void>;
    forceSync: () => Promise<void>;
    clearQueue: () => void;
    pendingCount: number;
    isSyncing: boolean;
}

const OfflineOrderContext = createContext<OfflineContextType | null>(null);

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 segundo
const MAX_DELAY_MS = 30000; // 30 segundos

export const OfflineOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<OfflineOrder[]>([]);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const syncLockRef = useRef(false);

    // --- 1. Load from IndexedDB on Mount ---
    useEffect(() => {
        const loadQueue = async () => {
            try {
                const items = await OfflineDB.getAll();
                const offlineOrders: OfflineOrder[] = items
                    .filter(item => item.status === 'queued' || item.status === 'failed')
                    .map(item => ({
                        local_id: item.id,
                        payload: item.payload,
                        status: item.status === 'failed' ? 'error' : 'pending',
                        created_at: new Date(item.createdAt).toISOString(),
                        retry_count: item.attempts || 0,
                        error_message: item.lastError
                    }));
                setQueue(offlineOrders);
                Logger.info('Offline queue loaded', { count: offlineOrders.length });
            } catch (e) {
                Logger.error('Failed to load offline queue', { error: e });
            }
        };

        loadQueue();

        // Listen for online/offline events
        const handleOnline = () => {
            setIsOffline(false);
            // Trigger sync when coming back online
            setTimeout(() => processQueue(), 500);
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // --- 2. Auto-Sync when Online ---
    useEffect(() => {
        if (!isOffline && queue.length > 0 && !isSyncing) {
            processQueue();
        }
    }, [isOffline, queue.length]);

    // --- Core Actions ---

    const addToQueue = useCallback(async (orderPayload: any) => {
        const localId = uuidv4();
        const now = Date.now();

        // Create IndexedDB item
        const queueItem: OfflineQueueItem = {
            id: localId,
            type: 'ORDER_CREATE',
            status: 'queued',
            payload: orderPayload,
            createdAt: now,
            attempts: 0,
            nextRetryAt: null,
            lastError: null,
            lastAttemptAt: null
        };

        try {
            await OfflineDB.put(queueItem);
            
            const newOrder: OfflineOrder = {
                local_id: localId,
                payload: orderPayload,
                status: 'pending',
                created_at: new Date(now).toISOString(),
                retry_count: 0
            };

            setQueue(prev => [...prev, newOrder]);
            Logger.info('Order added to offline queue', { localId });

            // If online, try to sync immediately (optimistic)
            if (navigator.onLine && !isSyncing) {
                setTimeout(() => processQueue(), 100);
            }
        } catch (e) {
            Logger.error('Failed to add order to offline queue', { error: e });
            throw e;
        }
    }, [isSyncing]);

    const processQueue = async () => {
        if (syncLockRef.current || isSyncing) return;
        syncLockRef.current = true;
        setIsSyncing(true);

        try {
            Logger.info('Processing offline queue...');
            
            // Read fresh from IndexedDB
            const items = await OfflineDB.getAll();
            const pendingItems = items.filter(
                item => (item.status === 'queued' || item.status === 'failed') &&
                (!item.nextRetryAt || Date.now() >= item.nextRetryAt) &&
                (item.attempts || 0) < MAX_RETRIES
            );

            if (pendingItems.length === 0) {
                Logger.info('No pending items to sync');
                setQueue([]);
                return;
            }

            Logger.info(`Syncing ${pendingItems.length} pending items`);

            for (const item of pendingItems) {
                await syncSingleItem(item);
            }

            // Refresh queue after sync
            const updatedItems = await OfflineDB.getAll();
            const updatedQueue: OfflineOrder[] = updatedItems
                .filter(i => i.status === 'queued' || i.status === 'failed')
                .map(i => ({
                    local_id: i.id,
                    payload: i.payload,
                    status: i.status === 'failed' ? 'error' : 'pending',
                    created_at: new Date(i.createdAt).toISOString(),
                    retry_count: i.attempts || 0,
                    error_message: i.lastError || undefined
                }));
            setQueue(updatedQueue);

        } catch (err: any) {
            Logger.error('Error processing offline queue', { error: err });
        } finally {
            setIsSyncing(false);
            syncLockRef.current = false;
        }
    };

    const syncSingleItem = async (item: OfflineQueueItem) => {
        const attempts = (item.attempts || 0) + 1;

        // Update status to syncing
        await OfflineDB.update(item.id, {
            status: 'syncing' as QueueStatus,
            attempts,
            lastAttemptAt: Date.now()
        });

        try {
            if (item.type === 'ORDER_CREATE') {
                const payload = item.payload as {
                    restaurant_id: string;
                    table_number?: number;
                    table_id?: string;
                    operator_id?: string;
                    cash_register_id?: string;
                    items: Array<{
                        product_id: string;
                        name: string;
                        price: number;
                        quantity: number;
                        notes?: string;
                    }>;
                };

                // Convert to OrderEngine format
                const orderItems: OrderItemInput[] = payload.items.map(item => ({
                    productId: item.product_id,
                    name: item.name,
                    priceCents: item.price,
                    quantity: item.quantity,
                    notes: item.notes
                }));

                // Create order using OrderEngine
                await OrderEngine.createOrder({
                    restaurantId: payload.restaurant_id,
                    tableNumber: payload.table_number,
                    tableId: payload.table_id,
                    operatorId: payload.operator_id,
                    cashRegisterId: payload.cash_register_id,
                    items: orderItems
                });

                Logger.info('Order synced successfully', { localId: item.id });
            } else {
                throw new Error(`Unknown queue item type: ${item.type}`);
            }

            // Remove from queue on success
            await OfflineDB.remove(item.id);
            Logger.info('Order removed from queue', { localId: item.id });

        } catch (err: any) {
            Logger.error('Failed to sync order', { localId: item.id, error: err });
            
            const delay = calculateDelay(attempts);
            const nextRetryAt = Date.now() + delay;

            // Update status to failed
            await OfflineDB.update(item.id, {
                status: attempts >= MAX_RETRIES ? 'failed' as QueueStatus : 'queued' as QueueStatus,
                attempts,
                lastError: err.message || 'Unknown error',
                nextRetryAt: attempts >= MAX_RETRIES ? null : nextRetryAt
            });
        }
    };

    const calculateDelay = (attempts: number): number => {
        const delay = BASE_DELAY_MS * Math.pow(2, attempts - 1);
        return Math.min(delay, MAX_DELAY_MS);
    };

    const forceSync = async () => {
        await processQueue();
    };

    const clearQueue = async () => {
        try {
            const items = await OfflineDB.getAll();
            for (const item of items) {
                await OfflineDB.remove(item.id);
            }
            setQueue([]);
            Logger.info('Offline queue cleared');
        } catch (e) {
            Logger.error('Failed to clear offline queue', { error: e });
        }
    };

    return (
        <OfflineOrderContext.Provider value={{
            isOffline,
            queue,
            addToQueue,
            forceSync,
            clearQueue,
            pendingCount: queue.length,
            isSyncing
        }}>
            {children}
        </OfflineOrderContext.Provider>
    );
};

export const useOfflineOrder = () => {
    const context = useContext(OfflineOrderContext);
    if (!context) throw new Error('useOfflineOrder must be used within OfflineOrderProvider');
    return context;
};
