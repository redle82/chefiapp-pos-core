// @ts-nocheck
import { useMemo } from "react";
import { useOperationalStore } from "../useOperationalStore";

export interface CurrentOrderDerived {
  /** Milissegundos desde o início do pedido (startedAt). */
  elapsedSinceStartMs: number | null;
  /** Milissegundos desde o envio para cozinha (sentToKitchenAt). */
  elapsedSinceSentMs: number | null;
  /** Verdadeiro quando o pedido é considerado \"lento\" segundo o threshold. */
  isSlow: boolean;
}

export interface UseCurrentOrderOperationalOptions {
  /** Threshold em segundos para considerar o pedido \"lento\" após envio para cozinha. */
  slowThresholdSeconds?: number;
}

/**
 * Hook para o painel lateral do pedido: devolve o estado bruto do pedido
 * operacional e derivados de tempo (duração, atraso).
 */
export function useCurrentOrderOperational(
  options: UseCurrentOrderOperationalOptions = {},
) {
  const slowThresholdSeconds = options.slowThresholdSeconds ?? 10 * 60; // 10 minutos por defeito

  const currentOrder = useOperationalStore((state) => state.currentOrder);

  const derived: CurrentOrderDerived = useMemo(() => {
    const now = Date.now();

    const startedAtTime = currentOrder.startedAt
      ? Date.parse(currentOrder.startedAt)
      : null;
    const sentAtTime = currentOrder.sentToKitchenAt
      ? Date.parse(currentOrder.sentToKitchenAt)
      : null;

    const elapsedSinceStartMs =
      startedAtTime != null ? Math.max(0, now - startedAtTime) : null;
    const elapsedSinceSentMs =
      sentAtTime != null ? Math.max(0, now - sentAtTime) : null;

    const isSlow =
      elapsedSinceSentMs != null &&
      elapsedSinceSentMs > slowThresholdSeconds * 1000;

    return {
      elapsedSinceStartMs,
      elapsedSinceSentMs,
      isSlow,
    };
  }, [currentOrder.startedAt, currentOrder.sentToKitchenAt, slowThresholdSeconds]);

  return {
    currentOrder,
    ...derived,
  };
}

