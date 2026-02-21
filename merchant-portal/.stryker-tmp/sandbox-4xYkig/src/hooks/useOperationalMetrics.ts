/**
 * useOperationalMetrics - Métricas operacionais por tenant e período (RPC get_operational_metrics)
 *
 * O5.7: Fonte única — usa coreRpc (Core Docker only).
 * FASE D: Se systemState === "SETUP" não chama RPC. Se RPC falha (schema cache / function not found)
 * trata como "sem dados", não fatal — não derruba sessão.
 */

import { useCallback, useEffect, useState } from "react";
import { invokeRpc } from "../core/infra/coreRpc";
import type { SystemState } from "../core/lifecycle/LifecycleState";

export interface OperationalMetricsPayload {
  schema_version: string;
  tenant_id: string;
  period: { start: string; end: string };
  orders_created_total: number;
  orders_cancelled_total: number;
  payments_recorded_total: number;
  payments_amount_cents: number;
  active_shifts_count: number;
  export_requested_count: number;
  daily_revenue_cents: number;
  daily_orders_count: number;
  avg_order_value_cents: number;
}

function startOfDayUTC(d: Date): string {
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
  return start.toISOString();
}

function endOfDayUTC(d: Date): string {
  const end = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
  return end.toISOString();
}

/** Erro de RPC inexistente ou backend indisponível = "sem dados", não fatal (API_ERROR_CONTRACT). */
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

export function useOperationalMetrics(
  restaurantId: string | null,
  systemState: SystemState = "SETUP"
) {
  const [data, setData] = useState<OperationalMetricsPayload | null>(null);
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
      const now = new Date();
      const p_from = startOfDayUTC(now);
      const p_to = endOfDayUTC(now);
      const { data: result, error: rpcError } =
        await invokeRpc<OperationalMetricsPayload>("get_operational_metrics", {
          p_restaurant_id: restaurantId,
          p_from,
          p_to,
        });
      if (rpcError) {
        const msg = rpcError.message ?? "Erro ao carregar métricas";
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
        err instanceof Error ? err.message : "Erro ao carregar métricas";
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
