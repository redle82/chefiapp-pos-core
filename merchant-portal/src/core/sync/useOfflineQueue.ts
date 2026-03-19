/**
 * useOfflineQueue — Lei 2: Fast Offline (SYSTEM_TRUTH_CODEX).
 * Expõe estado da fila offline (SyncEngine): pendentes, rede, processando.
 * Ver: SYSTEM_TRUTH_CODEX.md, SyncEngine.ts, IndexedDBQueue.ts.
 */

import { useEffect, useState } from 'react';
import { SyncEngine, type SyncEngineState } from './SyncEngine';

export type OfflineQueueState = SyncEngineState;

export function useOfflineQueue(): OfflineQueueState {
  const [state, setState] = useState<SyncEngineState>({
    isProcessing: false,
    networkStatus: SyncEngine.getNetworkStatus(),
    connectivity: SyncEngine.getConnectivity(),
    pendingCount: 0,
  });

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe((next) => {
      setState({
        isProcessing: next.isProcessing,
        networkStatus: next.networkStatus,
        connectivity: next.connectivity,
        pendingCount: next.pendingCount,
      });
    });
    return unsubscribe;
  }, []);

  return state;
}
