import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { OfflineQueue, QueuedAction } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';

export interface SyncState {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSyncAt: Date | null;
}

export function useOfflineSync() {
    const [state, setState] = useState<SyncState>({
        isOnline: true,
        pendingCount: 0,
        isSyncing: false,
        lastSyncAt: null,
    });

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
            const isOnline = netState.isConnected ?? false;
            setState(prev => ({ ...prev, isOnline }));

            // Trigger sync when coming online
            if (isOnline && !state.isSyncing) {
                syncPendingActions();
            }
        });

        return () => unsubscribe();
    }, []);

    // Update pending count periodically
    useEffect(() => {
        const updatePendingCount = async () => {
            const count = await OfflineQueue.count();
            setState(prev => ({ ...prev, pendingCount: count }));
        };

        updatePendingCount();
        const interval = setInterval(updatePendingCount, 5000);
        return () => clearInterval(interval);
    }, []);

    /**
     * Process all pending actions
     */
    const syncPendingActions = useCallback(async () => {
        if (state.isSyncing) return;

        setState(prev => ({ ...prev, isSyncing: true }));

        try {
            const pending = await OfflineQueue.getPending();
            console.log(`[Sync] Processing ${pending.length} pending actions`);

            for (const action of pending) {
                try {
                    await processAction(action);
                    await OfflineQueue.remove(action.id);
                } catch (error) {
                    console.error(`[Sync] Failed to process ${action.id}:`, error);
                    await OfflineQueue.updateStatus(action.id, 'failed');
                }
            }

            const count = await OfflineQueue.count();
            setState(prev => ({
                ...prev,
                isSyncing: false,
                pendingCount: count,
                lastSyncAt: new Date(),
            }));
        } catch (error) {
            console.error('[Sync] Sync failed:', error);
            setState(prev => ({ ...prev, isSyncing: false }));
        }
    }, [state.isSyncing]);

    /**
     * Process individual action
     */
    const processAction = async (action: QueuedAction) => {
        await OfflineQueue.updateStatus(action.id, 'syncing');

        switch (action.type) {
            case 'CREATE_ORDER':
                await supabase.from('gm_orders').insert(action.payload);
                break;
            case 'UPDATE_ORDER':
                await supabase
                    .from('gm_orders')
                    .update(action.payload.updates)
                    .eq('id', action.payload.id);
                break;
            case 'ADD_ITEM':
                await supabase.from('gm_order_items').insert(action.payload);
                break;
            default:
                console.warn(`[Sync] Unknown action type: ${action.type}`);
        }
    };

    /**
     * Enqueue an action (handles offline automatically)
     */
    const enqueue = useCallback(async (type: QueuedAction['type'], payload: any) => {
        if (state.isOnline) {
            // Try to sync immediately
            try {
                await processAction({ id: 'immediate', type, payload, createdAt: Date.now(), retryCount: 0, status: 'syncing' });
                return;
            } catch (error) {
                console.log('[Sync] Immediate sync failed, queueing for later');
            }
        }

        // Queue for later
        await OfflineQueue.enqueue(type, payload);
        const count = await OfflineQueue.count();
        setState(prev => ({ ...prev, pendingCount: count }));
    }, [state.isOnline]);

    return {
        ...state,
        enqueue,
        syncNow: syncPendingActions,
    };
}
