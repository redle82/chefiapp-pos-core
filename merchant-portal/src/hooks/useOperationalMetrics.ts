/**
 * useOperationalMetrics - Métricas operacionais por tenant e período (RPC get_operational_metrics)
 *
 * Alinhado a [DASHBOARD_METRICS](../../../docs/ops/DASHBOARD_METRICS.md) e METRICS_DICTIONARY.
 * Usado pelo dashboard operacional por tenant (G4 Onda 3).
 */

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "../core/infra/supabaseClient";

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
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  return start.toISOString();
}

function endOfDayUTC(d: Date): string {
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return end.toISOString();
}

export function useOperationalMetrics(restaurantId: string | null) {
  const [data, setData] = useState<OperationalMetricsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!restaurantId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      const now = new Date();
      const p_from = startOfDayUTC(now);
      const p_to = endOfDayUTC(now);
      const { data: result, error: rpcError } = await client.rpc("get_operational_metrics", {
        p_restaurant_id: restaurantId,
        p_from,
        p_to,
      });
      if (rpcError) {
        setError(rpcError.message ?? "Erro ao carregar métricas");
        setData(null);
        return;
      }
      setData((result as OperationalMetricsPayload) ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar métricas";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, error, refresh: fetchMetrics };
}
