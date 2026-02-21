import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IndexedDBQueue } from '../../../core/sync/IndexedDBQueue';
import { SyncEngine, type SyncEngineState } from '../../../core/sync/SyncEngine';
import type { OfflineQueueItem } from '../../../core/sync/types';
import { Logger } from '../../../core/logger';

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
    updateOfflineOrder: (orderId: string, action: 'ADD_ITEM' | 'UPDATE_QTY' | 'REMOVE_ITEM' | 'PAY', payload: any) => Promise<void>;
    forceSync: () => Promise<void>;
    clearQueue: () => void;
    pendingCount: number;
    isSyncing: boolean;
}

const OfflineOrderContext = createContext<OfflineContextType | null>(null);

export const OfflineOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<OfflineOrder[]>([]);
    const [isOffline, setIsOffline] = useState(SyncEngine.getNetworkStatus() === 'offline');
    const [isSyncing, setIsSyncing] = useState(false);

    // --- Sync with SyncEngine State ---
    const updateLocalState = useCallback(async (state?: SyncEngineState) => {
        if (state) {
            setIsOffline(state.networkStatus === 'offline');
            setIsSyncing(state.isProcessing);
        }

        // Always refresh queue from DB on state change to stay accurate
        try {
            const items = await IndexedDBQueue.getAll();
            const offlineOrders: OfflineOrder[] = items
                .filter(item => item.status === 'queued' || item.status === 'failed' || item.status === 'syncing')
                .map(item => ({
                    local_id: item.id,
                    payload: item.payload,
                    status: item.status === 'failed' ? 'error' : (item.status === 'syncing' ? 'syncing' : 'pending'),
                    created_at: new Date(item.createdAt).toISOString(),
                    retry_count: item.attempts || 0,
                    error_message: item.lastError
                }));
            setQueue(offlineOrders);
        } catch (e) {
            Logger.error('Failed to load offline queue details', e);
        }
    }, []);

    useEffect(() => {
        // Initial load
        updateLocalState();

        // Subscribe to SyncEngine
        const unsubscribe = SyncEngine.subscribe((state) => {
            updateLocalState(state);
        });

        return () => unsubscribe();
    }, [updateLocalState]);


    // --- Core Actions ---

    const addToQueue = useCallback(async (orderPayload: any) => {
        const localId = uuidv4();
        const now = Date.now();

        const queueItem: OfflineQueueItem = {
            id: localId,
            type: 'ORDER_CREATE',
            status: 'queued',
            payload: { ...orderPayload, localId }, // Ensure localId is in payload for idempotency
            createdAt: now,
            attempts: 0
        };

        try {
            await IndexedDBQueue.put(queueItem);
            Logger.info('Order added to offline queue', { localId });

            // Trigger Sync Engine
            SyncEngine.processQueue();
        } catch (e) {
            Logger.error('Failed to add order to offline queue', { error: e });
            throw e;
        }
    }, []);

    const updateOfflineOrder = useCallback(async (orderId: string, action: 'ADD_ITEM' | 'UPDATE_QTY' | 'REMOVE_ITEM' | 'PAY', payload: any) => {
        try {
            // MERGE STRATEGY: Check if order is pending creation in queue
            const currentQueue = await IndexedDBQueue.getPending();
            const pendingCreation = currentQueue.find(
                item => item.type === 'ORDER_CREATE' &&
                    (item.payload as any).localId === orderId || (item.payload as any).id === orderId
            );

            if (pendingCreation) {
                Logger.info('Merging action into pending creation', { orderId, action });
                const orderPayload = pendingCreation.payload as any;

                if (action === 'ADD_ITEM') {
                    orderPayload.items.push({
                        // Standardize item structure for storage
                        product_id: payload.productId,
                        name: payload.name,
                        price: payload.price, // cents?
                        quantity: payload.quantity,
                        notes: payload.notes,
                        // If payload has other fields, preserve them
                        ...payload
                    });

                    // Update existing item in DB
                    await IndexedDBQueue.put({ ...pendingCreation, payload: orderPayload });

                    // Trigger update of local state
                    updateLocalState();
                    return;
                }
                // Handle other merge actions if needed
            }

            // APPEND LOGIC
            const localId = uuidv4();
            const now = Date.now();

            let type: OfflineQueueItem['type'];
            switch (action) {
                case 'ADD_ITEM': type = 'ORDER_ADD_ITEM'; break;
                case 'UPDATE_QTY': type = 'ORDER_UPDATE_ITEM_QTY'; break;
                case 'REMOVE_ITEM': type = 'ORDER_REMOVE_ITEM'; break;
                case 'PAY': type = 'ORDER_PAY'; break;
                default: throw new Error(`Unknown action ${action}`);
            }

            const queueItem: OfflineQueueItem = {
                id: localId,
                type,
                status: 'queued',
                payload: { orderId, ...payload, restaurantId: payload.restaurantId }, // Ensure IDs
                createdAt: now,
                attempts: 0
            };

            await IndexedDBQueue.put(queueItem);
            Logger.info('Offline action queued', { type, orderId });

            SyncEngine.processQueue();

        } catch (e) {
            Logger.error('Failed to update offline order', { error: e });
            throw e;
        }
    }, [updateLocalState]);

    const forceSync = async () => {
        await SyncEngine.processQueue();
    };

    const clearQueue = async () => {
        try {
            const items = await IndexedDBQueue.getAll();
            for (const item of items) {
                await IndexedDBQueue.remove(item.id);
            }
            updateLocalState();
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
            updateOfflineOrder,
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
