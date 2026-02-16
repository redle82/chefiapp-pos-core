import {
  OfflineQueueService,
  type MutationType,
  type QueueItem,
} from "@/services/OfflineQueueService";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";

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

  // Refs to avoid stale closures in callbacks without re-triggering effects
  const isSyncingRef = useRef(state.isSyncing);
  isSyncingRef.current = state.isSyncing;

  /**
   * Process all pending actions
   */
  const syncPendingActions = useCallback(async () => {
    if (isSyncingRef.current) return;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const pending = await OfflineQueueService.getPending();
      console.log(`[Sync] Processing ${pending.length} pending actions`);

      for (const action of pending) {
        try {
          await OfflineQueueService.updateStatus(action.id, "syncing");
          const success = await OfflineQueueService.processItem(action);
          if (success) {
            await OfflineQueueService.dequeue(action.id);
          } else {
            await OfflineQueueService.updateStatus(action.id, "failed");
          }
        } catch (error) {
          console.error(`[Sync] Failed to process ${action.id}:`, error);
          await OfflineQueueService.updateStatus(action.id, "failed");
        }
      }

      const count = await OfflineQueueService.count();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        pendingCount: count,
        lastSyncAt: new Date(),
      }));
    } catch (error) {
      console.error("[Sync] Sync failed:", error);
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []); // stable — uses ref for isSyncing guard

  // Monitor network status — subscribe once, never re-subscribe
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isOnline = netState.isConnected ?? false;
      setState((prev) => {
        // Bail out if nothing changed to avoid unnecessary re-renders
        if (prev.isOnline === isOnline) return prev;
        return { ...prev, isOnline };
      });

      // Trigger sync when coming online
      if (isOnline && !isSyncingRef.current) {
        syncPendingActions();
      }
    });

    return () => unsubscribe();
  }, [syncPendingActions]);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await OfflineQueueService.count();
      setState((prev) => ({ ...prev, pendingCount: count }));
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Enqueue an action (handles offline automatically)
   */
  // Keep a ref so enqueue reads current value without re-creating the callback
  const isOnlineRef = useRef(state.isOnline);
  isOnlineRef.current = state.isOnline;

  const enqueue = useCallback(async (type: MutationType, payload: any) => {
    if (isOnlineRef.current) {
      // Try to sync immediately
      try {
        const immediateItem: QueueItem = {
          id: "immediate",
          mutationType: type,
          payload,
          timestamp: Date.now(),
          retryCount: 0,
          status: "syncing",
        };
        const success = await OfflineQueueService.processItem(immediateItem);
        if (success) return;
      } catch (error) {
        console.log("[Sync] Immediate sync failed, queueing for later");
      }
    }

    // Queue for later
    await OfflineQueueService.enqueue(type, payload);
    const count = await OfflineQueueService.count();
    setState((prev) => ({ ...prev, pendingCount: count }));
  }, []);

  return {
    ...state,
    enqueue,
    syncNow: syncPendingActions,
  };
}
