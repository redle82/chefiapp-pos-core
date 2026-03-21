/**
 * useRevenueDashboard — Internal admin revenue metrics.
 * Fetches enterprise revenue metrics from Core RPC.
 */

import { useCallback, useEffect, useState } from "react";
import { getDockerCoreFetchClient } from "../../../core/infra/dockerCoreFetchClient";

export interface RevenueByCountry {
  country: string;
  mrrCents: number;
  orgCount: number;
}

export interface RevenueDashboardData {
  totalMrrCents: number;
  totalArrCents: number;
  activeOrgs: number;
  graceOrgs: number;
  suspendedOrgs: number;
  revenueByCountry: RevenueByCountry[];
  churnRatePct: number;
  /** Month-over-month MRR growth % (for growth badge) */
  mrrGrowthMonthOverMonthPct: number | null;
  /** Average revenue per unit (org) in cents */
  arpuCents: number | null;
  /** Lifetime value in cents */
  ltvCents: number | null;
  /** Net Revenue Retention % */
  nrrPct: number | null;
  /** ARR Growth Year-over-Year % */
  arrGrowthYoYPct: number | null;
}

export interface UseRevenueDashboardResult {
  data: RevenueDashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

type RevenueMetricsRpcRow = {
  country?: string;
  mrr?: number;
  org_count?: number;
};

type RevenueMetricsRpcPayload = {
  mrr_cents?: number;
  arr_cents?: number;
  active_orgs?: number;
  grace_orgs?: number;
  suspended_orgs?: number;
  revenue_by_country?: RevenueMetricsRpcRow[];
  churn_rate_pct?: number;
  mrr_growth_mom_pct?: number | null;
  arr_growth_yoy_pct?: number | null;
  arpu_cents?: number | null;
  ltv_cents?: number | null;
  net_revenue_retention_pct?: number | null;
};

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return toSafeNumber(value);
}

function currentReferenceMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeRevenueByCountry(
  rows: RevenueMetricsRpcRow[] | undefined,
): RevenueByCountry[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    country:
      typeof row.country === "string" && row.country.trim().length > 0
        ? row.country
        : "unknown",
    mrrCents: toSafeNumber(row.mrr),
    orgCount: toSafeNumber(row.org_count),
  }));
}

function mapRpcToDashboardData(
  payload: RevenueMetricsRpcPayload,
): RevenueDashboardData {
  return {
    totalMrrCents: toSafeNumber(payload.mrr_cents),
    totalArrCents: toSafeNumber(payload.arr_cents),
    activeOrgs: toSafeNumber(payload.active_orgs),
    graceOrgs: toSafeNumber(payload.grace_orgs),
    suspendedOrgs: toSafeNumber(payload.suspended_orgs),
    revenueByCountry: normalizeRevenueByCountry(payload.revenue_by_country),
    churnRatePct: toSafeNumber(payload.churn_rate_pct),
    mrrGrowthMonthOverMonthPct: toNullableNumber(payload.mrr_growth_mom_pct),
    arpuCents: toNullableNumber(payload.arpu_cents),
    ltvCents: toNullableNumber(payload.ltv_cents),
    nrrPct: toNullableNumber(payload.net_revenue_retention_pct),
    arrGrowthYoYPct: toNullableNumber(payload.arr_growth_yoy_pct),
  };
}

async function fetchRevenueDashboard(): Promise<RevenueDashboardData> {
  const client = getDockerCoreFetchClient();
  const { data, error } = await client.rpc("get_enterprise_revenue_metrics", {
    p_reference_month: currentReferenceMonth(),
  });

  if (error) {
    throw new Error(
      (error as { message?: string }).message ??
        "Failed to load enterprise revenue metrics",
    );
  }

  const payload = (data ?? {}) as RevenueMetricsRpcPayload;
  return mapRpcToDashboardData(payload);
}

export function useRevenueDashboard(): UseRevenueDashboardResult {
  const [data, setData] = useState<RevenueDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRevenueDashboard();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load revenue data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
