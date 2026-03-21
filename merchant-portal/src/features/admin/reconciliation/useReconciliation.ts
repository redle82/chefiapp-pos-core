import { useCallback, useEffect, useState } from "react";
import {
  getReconciliationReport,
  type ReconciliationReport,
} from "../../../core/reconciliation/coreReconciliationApi";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface UseReconciliationResult {
  report: ReconciliationReport | null;
  loading: boolean;
  error: string | null;
  date: string;
  setDate: (date: string) => void;
  refetch: () => Promise<void>;
  /** Week data for heatmap: [{ date, discrepancyCents }] */
  weekData: { date: string; discrepancyCents: number }[];
  loadingWeek: boolean;
  fetchWeek: () => Promise<void>;
}

function getWeekDates(centerDate: string): string[] {
  const d = new Date(centerDate);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    out.push(formatDate(x));
  }
  return out;
}

export function useReconciliation(restaurantId: string | null): UseReconciliationResult {
  const [date, setDate] = useState<string>(() => formatDate(new Date()));
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekData, setWeekData] = useState<{ date: string; discrepancyCents: number }[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!restaurantId) {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getReconciliationReport(restaurantId, date);
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, date]);

  const fetchWeek = useCallback(async () => {
    if (!restaurantId) return;
    setLoadingWeek(true);
    try {
      const dates = getWeekDates(date);
      const results = await Promise.all(
        dates.map(async (d) => {
          const r = await getReconciliationReport(restaurantId, d);
          const discrepancy =
            r ? r.total_order_amount - r.total_receipt_amount : 0;
          return { date: d, discrepancyCents: discrepancy };
        })
      );
      setWeekData(results);
    } finally {
      setLoadingWeek(false);
    }
  }, [restaurantId, date]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return {
    report,
    loading,
    error,
    date,
    setDate,
    refetch: fetchReport,
    weekData,
    loadingWeek,
    fetchWeek,
  };
}
