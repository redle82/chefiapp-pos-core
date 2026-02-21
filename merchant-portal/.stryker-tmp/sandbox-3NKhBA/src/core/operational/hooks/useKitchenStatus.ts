// @ts-nocheck
import { useEffect } from "react";
import {
  type KitchenStatus,
  useOperationalStore,
} from "../useOperationalStore";

export interface UseKitchenStatusOptions {
  /** Limiar (em segundos) para estado amarelo. */
  yellowThresholdSeconds?: number;
  /** Limiar (em segundos) para estado vermelho. */
  redThresholdSeconds?: number;
}

/**
 * Hook para derivar o semáforo da cozinha a partir de métricas básicas
 * (tempo médio de preparação e nº de pedidos atrasados).
 *
 * Fase 1: pode funcionar inteiramente com mocks alimentados em `setKitchenMetrics`.
 */
export function useKitchenStatus(options: UseKitchenStatusOptions = {}) {
  const yellowThresholdSeconds = options.yellowThresholdSeconds ?? 10 * 60; // 10 min
  const redThresholdSeconds = options.redThresholdSeconds ?? 20 * 60; // 20 min

  const avgPrepTimeSeconds = useOperationalStore(
    (state) => state.kitchen.avgPrepTimeSeconds,
  );
  const delayedOrdersCount = useOperationalStore(
    (state) => state.kitchen.delayedOrdersCount,
  );
  const kitchenStatus = useOperationalStore(
    (state) => state.kpis.kitchenStatus,
  );
  const setKpis = useOperationalStore((state) => state.setKpis);

  useEffect(() => {
    let nextStatus: KitchenStatus = "GREEN";

    if (
      avgPrepTimeSeconds != null &&
      avgPrepTimeSeconds >= redThresholdSeconds
    ) {
      nextStatus = "RED";
    } else if (
      avgPrepTimeSeconds != null &&
      avgPrepTimeSeconds >= yellowThresholdSeconds
    ) {
      nextStatus = "YELLOW";
    }

    // Se há muitos pedidos atrasados, forçar pelo menos amarelo.
    if (delayedOrdersCount >= 3 && nextStatus === "GREEN") {
      nextStatus = "YELLOW";
    }

    if (nextStatus !== kitchenStatus) {
      setKpis({ kitchenStatus: nextStatus });
    }
  }, [
    avgPrepTimeSeconds,
    delayedOrdersCount,
    kitchenStatus,
    redThresholdSeconds,
    setKpis,
    yellowThresholdSeconds,
  ]);

  return {
    kitchenStatus,
    avgPrepTimeSeconds,
    delayedOrdersCount,
  };
}

