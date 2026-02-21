import { useShallow } from "zustand/react/shallow";
import type { OperationalState } from "../useOperationalStore";
import { useOperationalStore } from "../useOperationalStore";

export interface HardwareStatusSummary {
  printerStatusByStation: OperationalState["hardware"]["printerStatusByStation"];
  hasAnyPrinterOffline: boolean;
}

/**
 * Hook para ler o estado das impressoras e derivar um sinal agregado
 * (se existe alguma offline).
 *
 * Uses useShallow to prevent infinite re-renders — Zustand's
 * useSyncExternalStore requires stable (referentially equal) snapshots.
 */
export function useHardwareStatus(): HardwareStatusSummary {
  return useOperationalStore(
    useShallow((state) => {
      const stations = Object.values(state.hardware.printerStatusByStation);
      const hasAnyPrinterOffline = stations.some(
        (p) => p.status === "OFFLINE" || p.status === "UNKNOWN",
      );

      return {
        printerStatusByStation: state.hardware.printerStatusByStation,
        hasAnyPrinterOffline,
      };
    }),
  );
}
