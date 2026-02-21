/**
 * useMultiUnitOverview — Dashboard multi-unidade (olhar de dono)
 *
 * Consome RPC get_multiunit_overview do Core (views agregadas).
 * Ref: docs/architecture/MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md
 */

import { useCallback, useEffect, useState } from "react";
import { invokeRpc } from "../core/infra/coreRpc";
import type { MultiUnitCard } from "../features/admin/reports/MultiUnitOverviewReportPage";

export interface MultiUnitOverviewRow {
  restaurant_id: string;
  restaurant_name: string | null;
  revenue_cents: number;
  open_orders_count: number;
  critical_tasks_count: number;
  critical_stock_count: number;
  shift_status: string | null;
  tpv_online: boolean;
  kds_online: boolean;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mapRowToCard(row: MultiUnitOverviewRow): MultiUnitCard {
  const shiftStatus =
    row.shift_status === "OPEN" || row.shift_status === "CLOSED"
      ? row.shift_status
      : "UNKNOWN";
  return {
    id: row.restaurant_id,
    name: row.restaurant_name ?? "Unidade",
    revenueToday: Number(row.revenue_cents) / 100,
    openOrders: Number(row.open_orders_count) || 0,
    criticalTasks: Number(row.critical_tasks_count) || 0,
    criticalStockItems: Number(row.critical_stock_count) || 0,
    shiftStatus,
    kdsOnline: Boolean(row.kds_online),
    tpvOnline: Boolean(row.tpv_online),
  };
}

export interface UseMultiUnitOverviewOptions {
  periodDate?: Date;
}

export function useMultiUnitOverview(options?: UseMultiUnitOverviewOptions) {
  const periodDate = options?.periodDate ?? new Date();
  const [data, setData] = useState<MultiUnitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p_period_date = toIsoDate(periodDate);
      const { data: result, error: rpcError } = await invokeRpc<
        MultiUnitOverviewRow[]
      >("get_multiunit_overview", { p_period_date });
      if (rpcError) {
        const msg =
          rpcError.message ?? "Erro ao carregar visão multi-unidade";
        const isUnavailable =
          rpcError.code === "BACKEND_UNAVAILABLE" ||
          rpcError.code === "FUNCTION_UNAVAILABLE" ||
          msg.toLowerCase().includes("backend indisponível") ||
          (msg.toLowerCase().includes("function") &&
            msg.toLowerCase().includes("not found"));
        if (isUnavailable) {
          setError(null);
          setData([]);
        } else {
          setError(msg);
          setData([]);
        }
        return;
      }
      const rows = Array.isArray(result) ? result : [];
      setData(rows.map(mapRowToCard));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar visão multi-unidade";
      const lower = msg.toLowerCase();
      const isUnavailable =
        lower.includes("unexpected token") ||
        lower.includes("failed to fetch") ||
        lower.includes("backend indisponível") ||
        lower.includes("network");
      if (isUnavailable) {
        setError(null);
        setData([]);
      } else {
        setError(msg);
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [periodDate.getTime()]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refresh: fetchOverview };
}
