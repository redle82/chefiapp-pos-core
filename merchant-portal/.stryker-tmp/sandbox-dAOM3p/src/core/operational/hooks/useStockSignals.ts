// @ts-nocheck
import { useShallow } from "zustand/react/shallow";
import { useOperationalStore } from "../useOperationalStore";

export interface ProductStockSignals {
  isCritical: boolean;
  isUnavailable: boolean;
  marginPct: number | null;
}

/**
 * Hook para ler sinais de estoque/margem para um produto específico.
 * Fase 1: pode ser alimentado via mocks no useOperationalStore.
 *
 * Uses useShallow to prevent infinite re-renders — Zustand's
 * useSyncExternalStore requires stable (referentially equal) snapshots.
 */
export function useStockSignals(productId: string | null | undefined) {
  return useOperationalStore(
    useShallow((state) => {
      if (!productId) {
        return {
          isCritical: false,
          isUnavailable: false,
          marginPct: null,
        } satisfies ProductStockSignals;
      }

      const signals = state.stock[productId];
      if (!signals) {
        return {
          isCritical: false,
          isUnavailable: false,
          marginPct: null,
        } satisfies ProductStockSignals;
      }

      const isCritical =
        signals.currentQty != null &&
        signals.criticalThreshold != null &&
        signals.currentQty <= signals.criticalThreshold &&
        !signals.isUnavailable;

      return {
        isCritical,
        isUnavailable: signals.isUnavailable,
        marginPct:
          typeof signals.marginPct === "number" ? signals.marginPct : null,
      } satisfies ProductStockSignals;
    }),
  );
}
