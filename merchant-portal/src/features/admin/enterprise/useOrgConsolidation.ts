import { useCallback, useEffect, useState } from "react";
import {
  getOrgDailyConsolidation,
  ORG_CONSOLIDATION_ERROR,
  OrgConsolidationError,
  type OrgDailyConsolidation,
} from "../../../core/finance/orgConsolidationApi";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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

export interface OrgLocationWeekData {
  restaurant_id: string;
  restaurant_name: string;
  days: { date: string; discrepancyCents: number }[];
}

export type OrgConsolidationErrorKind = "backend_missing" | "core_error" | null;

export interface UseOrgConsolidationResult {
  data: OrgDailyConsolidation | null;
  loading: boolean;
  error: string | null;
  /** Discriminates 404/backend missing vs 500/generic */
  errorKind: OrgConsolidationErrorKind;
  date: string;
  setDate: (date: string) => void;
  refetch: () => Promise<void>;
  /** Per-location weekly data for heatmap: [{ restaurant_id, restaurant_name, days }] */
  weekDataPerLocation: OrgLocationWeekData[];
  /** Revenue per day (last 7 days) for trend chart */
  weekRevenueByDate: { date: string; revenueCents: number }[];
  loadingWeek: boolean;
  fetchWeek: () => Promise<void>;
}

export function useOrgConsolidation(
  orgId: string | null
): UseOrgConsolidationResult {
  const [date, setDate] = useState<string>(() => formatDate(new Date()));
  const [data, setData] = useState<OrgDailyConsolidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<OrgConsolidationErrorKind>(null);
  const [weekDataPerLocation, setWeekDataPerLocation] = useState<
    OrgLocationWeekData[]
  >([]);
  const [weekRevenueByDate, setWeekRevenueByDate] = useState<
    { date: string; revenueCents: number }[]
  >([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!orgId) {
      setData(null);
      setLoading(false);
      setErrorKind(null);
      return;
    }
    setLoading(true);
    setError(null);
    setErrorKind(null);
    try {
      const result = await getOrgDailyConsolidation(orgId, date);
      setData(result);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to load org consolidation";
      setError(msg);
      setData(null);
      if (e instanceof OrgConsolidationError) {
        setErrorKind(
          e.code === ORG_CONSOLIDATION_ERROR.BACKEND_MISSING
            ? "backend_missing"
            : "core_error"
        );
      } else {
        setErrorKind("core_error");
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, date]);

  const fetchWeek = useCallback(async () => {
    if (!orgId) return;
    setLoadingWeek(true);
    try {
      const dates = getWeekDates(date);
      const dayResults = await Promise.all(
        dates.map(async (d) => {
          const r = await getOrgDailyConsolidation(orgId, d);
          return {
            date: d,
            locations: r?.locations ?? [],
            revenueCents: r?.total_revenue_cents ?? 0,
          };
        })
      );
      const locMap = new Map<
        string,
        { name: string; days: { date: string; discrepancyCents: number }[] }
      >();
      for (const { date: d, locations: locs } of dayResults) {
        for (const loc of locs) {
          let entry = locMap.get(loc.restaurant_id);
          if (!entry) {
            entry = { name: loc.restaurant_name, days: [] };
            locMap.set(loc.restaurant_id, entry);
          }
          entry.days.push({ date: d, discrepancyCents: loc.discrepancy_cents });
        }
      }
      const results: OrgLocationWeekData[] = Array.from(locMap.entries()).map(
        ([id, { name, days }]) => ({
          restaurant_id: id,
          restaurant_name: name,
          days: dates.map((d) => {
            const found = days.find((x) => x.date === d);
            return {
              date: d,
              discrepancyCents: found?.discrepancyCents ?? 0,
            };
          }),
        })
      );
      setWeekDataPerLocation(results);
      setWeekRevenueByDate(
        dayResults.map(({ date: d, revenueCents }) => ({ date: d, revenueCents }))
      );
    } finally {
      setLoadingWeek(false);
    }
  }, [orgId, date]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return {
    data,
    loading,
    error,
    errorKind,
    date,
    setDate,
    refetch: fetchReport,
    weekDataPerLocation,
    weekRevenueByDate,
    loadingWeek,
    fetchWeek,
  };
}
