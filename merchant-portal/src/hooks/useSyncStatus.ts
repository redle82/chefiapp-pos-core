/**
 * useSyncStatus — React hook that exposes SyncEngine state for UI consumption.
 *
 * Returns the derived sync status (synced | syncing | offline | pending | error),
 * pending item count, last sync timestamp, and a manual syncNow trigger.
 *
 * Subscribes to SyncEngine listeners for real-time updates and falls back to
 * periodic polling (every 30s) to catch queue changes that bypass notifications.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { SyncEngine, type SyncEngineState } from "../core/sync/SyncEngine";

export type SyncStatus = "synced" | "syncing" | "offline" | "pending" | "error";

export interface SyncStatusState {
  /** Derived UI status from SyncEngine state */
  status: SyncStatus;
  /** Number of items still in the offline queue */
  pendingCount: number;
  /** Timestamp of last successful sync (null if never synced) */
  lastSyncAt: Date | null;
  /** Trigger an immediate queue flush */
  syncNow: () => void;
}

const POLL_INTERVAL_MS = 30_000;

function deriveStatus(state: SyncEngineState): SyncStatus {
  // Offline takes priority
  if (state.connectivity === "offline") return "offline";

  // Actively processing the queue
  if (state.isProcessing) return "syncing";

  // Online but items still queued (failed retries, etc.)
  if (state.pendingCount > 0) return "pending";

  // All clear
  return "synced";
}

export function useSyncStatus(): SyncStatusState {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const prevPendingRef = useRef<number | null>(null);

  useEffect(() => {
    // Subscribe to SyncEngine state changes
    const unsubscribe = SyncEngine.subscribe((state: SyncEngineState) => {
      const derived = deriveStatus(state);
      setStatus(derived);
      setPendingCount(state.pendingCount);

      // Track when pending count drops to 0 (sync completed)
      if (
        prevPendingRef.current !== null &&
        prevPendingRef.current > 0 &&
        state.pendingCount === 0 &&
        !state.isProcessing
      ) {
        setLastSyncAt(new Date());
      }
      prevPendingRef.current = state.pendingCount;
    });

    // Periodic poll to catch any missed updates
    const pollId = setInterval(() => {
      SyncEngine.forceSync();
    }, POLL_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(pollId);
    };
  }, []);

  const syncNow = useCallback(() => {
    SyncEngine.forceSync();
  }, []);

  return { status, pendingCount, lastSyncAt, syncNow };
}
