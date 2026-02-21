// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { db } from "../core/db";

export interface FiscalReconciliationItem {
  id: string;
  restaurant_id: string;
  shift_id: string | null;
  fiscal_snapshot_id: string | null;
  total_operational_cents: number;
  total_fiscal_cents: number;
  difference_cents: number;
  status: "OK" | "DIVERGENT" | "PENDING_DATA";
  reason_code: string | null;
  notes: string | null;
  reconciled_by: string | null;
  created_at: string;
}

export interface UseFiscalReconciliationOptions {
  daysBack?: number;
}

function startOfDaysAgo(now: Date, days: number): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfToday(now: Date): string {
  const d = new Date(now);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

export function useFiscalReconciliation(
  restaurantId: string | null,
  options?: UseFiscalReconciliationOptions,
) {
  const daysBack = options?.daysBack ?? 7;
  const [data, setData] = useState<FiscalReconciliationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReconciliations = useCallback(async () => {
    if (!restaurantId) {
      setData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = startOfDaysAgo(now, daysBack);
      const to = endOfToday(now);

      const { data: rows, error: dbError } = await db
        .from("gm_reconciliations")
        .select(
          "id, restaurant_id, shift_id, fiscal_snapshot_id, total_operational_cents, total_fiscal_cents, difference_cents, status, reason_code, notes, reconciled_by, created_at",
        )
        .eq("restaurant_id", restaurantId)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(50);

      if (dbError) {
        const msg = dbError.message ?? "Erro ao carregar reconciliações fiscais";
        const lower = msg.toLowerCase();
        const isUnavailable =
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
        return;
      }

      setData((rows as FiscalReconciliationItem[]) ?? []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar reconciliações";
      const lower = msg.toLowerCase();
      const isUnavailable =
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
  }, [restaurantId, daysBack]);

  useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

  return { data, loading, error, refresh: fetchReconciliations };
}

