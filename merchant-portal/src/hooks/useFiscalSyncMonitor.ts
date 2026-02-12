/**
 * useFiscalSyncMonitor — Monitora eventos FISCAL_SYNC_* do audit log
 *
 * Alimenta o painel de observabilidade com contadores e falhas recentes.
 * Ref: CORE_EVENTS_CONTRACT.md, OBSERVABILITY_MINIMA.md
 */

import { useCallback, useEffect, useState } from "react";
import { db } from "../core/db";

export interface FiscalSyncSummary {
  /** Total de eventos FISCAL_SYNC_SUCCESS no período */
  totalSuccess: number;
  /** Total de eventos FISCAL_SYNC_FAILED no período */
  totalFailed: number;
  /** Taxa de sucesso (0-100) */
  successRate: number;
}

export interface FiscalSyncFailure {
  id: string;
  restaurant_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface UseFiscalSyncMonitorResult {
  summary: FiscalSyncSummary;
  recentFailures: FiscalSyncFailure[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function startOfMonth(now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return d.toISOString();
}

export function useFiscalSyncMonitor(
  restaurantId: string | null,
): UseFiscalSyncMonitorResult {
  const [summary, setSummary] = useState<FiscalSyncSummary>({
    totalSuccess: 0,
    totalFailed: 0,
    successRate: 100,
  });
  const [recentFailures, setRecentFailures] = useState<FiscalSyncFailure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!restaurantId) {
      setSummary({ totalSuccess: 0, totalFailed: 0, successRate: 100 });
      setRecentFailures([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const from = startOfMonth(now);

      // Fetch all FISCAL_SYNC events this month
      const { data: events, error: dbError } = await db
        .from("gm_audit_logs")
        .select("id, event_type, restaurant_id, details, result, created_at")
        .eq("restaurant_id", restaurantId)
        .in("event_type", ["FISCAL_SYNC_SUCCESS", "FISCAL_SYNC_FAILED"])
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(200);

      if (dbError) {
        const msg = dbError.message ?? "Erro ao carregar eventos fiscais";
        const lower = msg.toLowerCase();
        if (lower.includes("failed to fetch") || lower.includes("network")) {
          // Core offline — degrade gracefully
          setError(null);
        } else {
          setError(msg);
        }
        return;
      }

      const rows = (events ?? []) as Array<{
        id: string;
        event_type: string;
        restaurant_id: string;
        details: Record<string, unknown>;
        result: string;
        created_at: string;
      }>;

      const successes = rows.filter(
        (e) => e.event_type === "FISCAL_SYNC_SUCCESS",
      ).length;
      const failures = rows.filter(
        (e) => e.event_type === "FISCAL_SYNC_FAILED",
      ).length;
      const total = successes + failures;
      const rate = total > 0 ? Math.round((successes / total) * 100) : 100;

      setSummary({
        totalSuccess: successes,
        totalFailed: failures,
        successRate: rate,
      });

      // Recent failures (last 10)
      const failureRows = rows
        .filter((e) => e.event_type === "FISCAL_SYNC_FAILED")
        .slice(0, 10)
        .map((e) => ({
          id: e.id,
          restaurant_id: e.restaurant_id,
          details: e.details || {},
          created_at: e.created_at,
        }));

      setRecentFailures(failureRows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      if (msg.toLowerCase().includes("failed to fetch")) {
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, recentFailures, loading, error, refresh: fetchData };
}
