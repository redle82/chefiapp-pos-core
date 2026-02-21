/**
 * useDailyMetrics — Métricas diárias agregadas (RPC get_daily_metrics)
 *
 * Fonte única — usa coreRpc (Core Docker only).
 * Se systemState === "SETUP" não chama RPC. Se RPC falha (schema cache / function not found)
 * trata como "sem dados", não fatal — não derruba sessão.
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import { invokeRpc } from "../core/infra/coreRpc";
import type { SystemState } from "../core/lifecycle/LifecycleState";

export interface HourlySales {
  hour: number;
  total_cents: number;
}

export interface DailyMetricsPayload {
  total_sales_cents: number;
  total_orders: number;
  avg_ticket_cents: number;
  sales_by_hour: HourlySales[];
}

/** Erro de RPC inexistente ou backend indisponível = "sem dados", não fatal. */
function isRpcUnavailableError(message: string, code?: string): boolean {
  if (code === "BACKEND_UNAVAILABLE") return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("backend indisponível") ||
    lower.includes("schema cache") ||
    (lower.includes("function") && lower.includes("not found")) ||
    lower.includes("does not exist")
  );
}

export function useDailyMetrics(
  restaurantId: string | null,
  systemState: SystemState = "SETUP",
) {
  const [data, setData] = useState<DailyMetricsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!restaurantId || systemState === "SETUP") {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: rpcError } =
        await invokeRpc<DailyMetricsPayload>("get_daily_metrics", {
          p_restaurant_id: restaurantId,
        });
      if (rpcError) {
        const msg = rpcError.message ?? "Erro ao carregar métricas diárias";
        if (isRpcUnavailableError(msg, rpcError.code)) {
          setError(null);
          setData(null);
        } else {
          setError(msg);
          setData(null);
        }
        return;
      }
      setData(result ?? null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao carregar métricas diárias";
      if (isRpcUnavailableError(msg)) {
        setError(null);
        setData(null);
      } else {
        setError(msg);
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, systemState]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, error, refresh: fetchMetrics };
}
