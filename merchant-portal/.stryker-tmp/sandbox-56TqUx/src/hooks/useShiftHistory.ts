/**
 * useShiftHistory - Histórico por turno (Onda 5 O5.6)
 *
 * O5.7: Fonte única — usa coreRpc (Core Docker only).
 * Ref.: docs/ops/DASHBOARD_METRICS.md § Fonte única.
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import { invokeRpc } from "../core/infra/coreRpc";

/** FASE 2.3: vendas por método e totais esperado/declarado para fecho */
export interface ShiftHistoryItem {
  shift_id: string;
  opened_at: string;
  closed_at: string | null;
  total_sales_cents: number;
  orders_count: number;
  /** Saldo de abertura (centavos) */
  opening_balance_cents?: number;
  /** Total declarado no fecho (centavos); null se caixa ainda aberta */
  closing_balance_cents?: number | null;
  opened_by?: string | null;
  closed_by?: string | null;
  /** Totais por método: { cash: 1000, card: 5000, other: 0 } (centavos) */
  sales_by_method?: Record<string, number> | null;
}

function startOfDaysAgo(d: Date, days: number): string {
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

function endOfToday(d: Date): string {
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end.toISOString();
}

export function startOfDay(d: Date): string {
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

export function endOfDay(d: Date): string {
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end.toISOString();
}

export interface UseShiftHistoryOptions {
  daysBack?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useShiftHistory(
  restaurantId: string | null,
  options?: UseShiftHistoryOptions
) {
  const daysBack = options?.daysBack ?? 7;
  const dateFrom = options?.dateFrom;
  const dateTo = options?.dateTo;
  const [data, setData] = useState<ShiftHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!restaurantId) {
      setData([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const p_from =
        dateFrom && dateTo
          ? startOfDay(dateFrom)
          : startOfDaysAgo(now, daysBack);
      const p_to = dateFrom && dateTo ? endOfDay(dateTo) : endOfToday(now);
      const { data: result, error: rpcError } = await invokeRpc<
        ShiftHistoryItem[]
      >("get_shift_history", { p_restaurant_id: restaurantId, p_from, p_to });
      if (rpcError) {
        // API_ERROR_CONTRACT: backend indisponível / RPC inexistente = estado vazio, não erro de UI
        const msg = rpcError.message ?? "Erro ao carregar histórico de turnos";
        const isUnavailable =
          rpcError.code === "BACKEND_UNAVAILABLE" ||
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
      const list = Array.isArray(result) ? result : [];
      setData(list);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar histórico";
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
  }, [restaurantId, daysBack, dateFrom?.getTime(), dateTo?.getTime()]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, loading, error, refresh: fetchHistory };
}
