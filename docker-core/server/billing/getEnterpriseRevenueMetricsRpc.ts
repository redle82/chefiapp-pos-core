import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export interface RevenueByCountryMetric {
  country: string;
  mrr: number;
}

export interface EnterpriseRevenueMetricsPayload {
  mrr_cents: number;
  arr_cents: number;
  churn_rate_pct: number;
  active_orgs: number;
  grace_orgs: number;
  suspended_orgs: number;
  revenue_by_country: RevenueByCountryMetric[];
  mrr_growth_mom_pct: number;
  arr_growth_yoy_pct: number;
  arpu_cents: number;
  ltv_cents: number;
  net_revenue_retention_pct: number;
}

export interface StableRpcError {
  code: string;
  message: string;
  details?: unknown;
}

export type GetEnterpriseRevenueMetricsRpcResult =
  | { ok: true; data: EnterpriseRevenueMetricsPayload }
  | { ok: false; error: StableRpcError };

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "getEnterpriseRevenueMetricsRpc requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeError(
  error: unknown,
  fallbackCode = "UNEXPECTED_ERROR",
): StableRpcError {
  if (error && typeof error === "object") {
    const raw = error as Record<string, unknown>;
    const code =
      typeof raw.code === "string" && raw.code.trim().length > 0
        ? raw.code
        : fallbackCode;
    const message =
      typeof raw.message === "string" && raw.message.trim().length > 0
        ? raw.message
        : "Unexpected RPC error";

    return {
      code,
      message,
      details: raw.details ?? raw.hint ?? null,
    };
  }

  return {
    code: fallbackCode,
    message: String(error ?? "Unexpected RPC error"),
  };
}

function normalizeRevenueByCountry(value: unknown): RevenueByCountryMetric[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return { country: "unknown", mrr: 0 };
      }

      const row = item as Record<string, unknown>;
      const country =
        typeof row.country === "string" && row.country.trim().length > 0
          ? row.country
          : "unknown";

      return {
        country,
        mrr: toSafeNumber(row.mrr),
      };
    })
    .sort((a, b) => a.country.localeCompare(b.country));
}

function normalizePayload(raw: unknown): EnterpriseRevenueMetricsPayload {
  const payload =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    mrr_cents: toSafeNumber(payload.mrr_cents),
    arr_cents: toSafeNumber(payload.arr_cents),
    churn_rate_pct: toSafeNumber(payload.churn_rate_pct),
    active_orgs: toSafeNumber(payload.active_orgs),
    grace_orgs: toSafeNumber(payload.grace_orgs),
    suspended_orgs: toSafeNumber(payload.suspended_orgs),
    revenue_by_country: normalizeRevenueByCountry(payload.revenue_by_country),
    mrr_growth_mom_pct: toSafeNumber(payload.mrr_growth_mom_pct),
    arr_growth_yoy_pct: toSafeNumber(payload.arr_growth_yoy_pct),
    arpu_cents: toSafeNumber(payload.arpu_cents),
    ltv_cents: toSafeNumber(payload.ltv_cents),
    net_revenue_retention_pct: toSafeNumber(payload.net_revenue_retention_pct),
  };
}

export async function getEnterpriseRevenueMetricsRpc(
  referenceMonth: string,
  client?: SupabaseClient,
): Promise<GetEnterpriseRevenueMetricsRpcResult> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase.rpc(
      "get_enterprise_revenue_metrics",
      {
        p_reference_month: referenceMonth,
      },
    );

    if (error) {
      return {
        ok: false,
        error: normalizeError(
          {
            code: (error as { code?: string }).code,
            message: `get_enterprise_revenue_metrics failed: ${error.message}`,
            details:
              (error as { details?: string | null }).details ??
              (error as { hint?: string | null }).hint ??
              null,
          },
          "RPC_ERROR",
        ),
      };
    }

    return {
      ok: true,
      data: normalizePayload(data),
    };
  } catch (caughtError) {
    return {
      ok: false,
      error: normalizeError(caughtError, "UNEXPECTED_ERROR"),
    };
  }
}
