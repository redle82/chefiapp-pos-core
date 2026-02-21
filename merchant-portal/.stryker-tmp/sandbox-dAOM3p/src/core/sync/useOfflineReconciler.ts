/**
 * useOfflineReconciler — Lei 2: Fast Offline (SYSTEM_TRUTH_CODEX).
 * Expõe acção de reconciliar a fila offline (processar ao reconectar).
 * Ver: SYSTEM_TRUTH_CODEX.md, SyncEngine.ts.
 */
// @ts-nocheck


import { useCallback } from 'react';
import { SyncEngine } from './SyncEngine';

export function useOfflineReconciler() {
  const reconcile = useCallback(() => {
    SyncEngine.processQueue();
  }, []);

  return { reconcile };
}
