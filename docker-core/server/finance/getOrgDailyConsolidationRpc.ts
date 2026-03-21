import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export interface OrgSummaryPayload {
  organization_id: string;
  date: string;
  status: "green" | "yellow" | "red";
  total_orders: number;
  total_receipts: number;
  total_revenue_cents: number;
  total_discrepancy_cents: number;
}

export interface OrgRestaurantPayload {
  restaurant_id: string;
  restaurant_name: string | null;
  status: "green" | "yellow" | "red" | null;
  orders_total_cents: number;
  receipts_total_cents: number;
  z_report_total_cents: number;
  discrepancy_amount_cents: number;
  discrepancy_ratio: number;
}

export interface OrgHeatmapDayPayload {
  date: string;
  status: "green" | "yellow" | "red" | null;
  discrepancy_amount_cents: number;
}

export interface OrgHeatmapPayload {
  restaurant_id: string;
  days: OrgHeatmapDayPayload[];
}

export interface OrgDailyConsolidationRpcPayload {
  org: OrgSummaryPayload | null;
  restaurants: OrgRestaurantPayload[];
  heatmap: OrgHeatmapPayload[];
  integrity_ok: boolean | null;
  integrity_code: string | null;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "getOrgDailyConsolidationRpc requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function toIsoDate(input: string | Date): string {
  if (typeof input === "string") return input;
  return input.toISOString().slice(0, 10);
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function emptyPayload(): OrgDailyConsolidationRpcPayload {
  return {
    org: null,
    restaurants: [],
    heatmap: [],
    integrity_ok: null,
    integrity_code: null,
  };
}

export function normalizeOrgDailyConsolidationPayload(
  raw: unknown,
): OrgDailyConsolidationRpcPayload {
  if (!raw || typeof raw !== "object") {
    return emptyPayload();
  }

  const payload = raw as Record<string, unknown>;
  const orgRaw =
    payload.org && typeof payload.org === "object"
      ? (payload.org as Record<string, unknown>)
      : null;

  const restaurantsRaw = Array.isArray(payload.restaurants)
    ? payload.restaurants
    : [];

  const heatmapRaw = Array.isArray(payload.heatmap) ? payload.heatmap : [];

  return {
    org: orgRaw
      ? {
          organization_id: String(orgRaw.organization_id ?? ""),
          date: String(orgRaw.date ?? ""),
          status:
            orgRaw.status === "green" ||
            orgRaw.status === "yellow" ||
            orgRaw.status === "red"
              ? orgRaw.status
              : "yellow",
          total_orders: toSafeNumber(orgRaw.total_orders),
          total_receipts: toSafeNumber(orgRaw.total_receipts),
          total_revenue_cents: toSafeNumber(orgRaw.total_revenue_cents),
          total_discrepancy_cents: toSafeNumber(orgRaw.total_discrepancy_cents),
        }
      : null,
    restaurants: restaurantsRaw
      .filter(
        (row): row is Record<string, unknown> =>
          !!row && typeof row === "object",
      )
      .map((row) => ({
        restaurant_id: String(row.restaurant_id ?? ""),
        restaurant_name:
          typeof row.restaurant_name === "string" ? row.restaurant_name : null,
        status:
          row.status === "green" ||
          row.status === "yellow" ||
          row.status === "red"
            ? row.status
            : null,
        orders_total_cents: toSafeNumber(row.orders_total_cents),
        receipts_total_cents: toSafeNumber(row.receipts_total_cents),
        z_report_total_cents: toSafeNumber(row.z_report_total_cents),
        discrepancy_amount_cents: toSafeNumber(row.discrepancy_amount_cents),
        discrepancy_ratio: toSafeNumber(row.discrepancy_ratio),
      })),
    heatmap: heatmapRaw
      .filter(
        (row): row is Record<string, unknown> =>
          !!row && typeof row === "object",
      )
      .map((row) => {
        const daysRaw = Array.isArray(row.days) ? row.days : [];
        return {
          restaurant_id: String(row.restaurant_id ?? ""),
          days: daysRaw
            .filter(
              (day): day is Record<string, unknown> =>
                !!day && typeof day === "object",
            )
            .map((day) => ({
              date: String(day.date ?? ""),
              status:
                day.status === "green" ||
                day.status === "yellow" ||
                day.status === "red"
                  ? day.status
                  : null,
              discrepancy_amount_cents: toSafeNumber(
                day.discrepancy_amount_cents,
              ),
            })),
        };
      }),
    integrity_ok:
      typeof payload.integrity_ok === "boolean" ? payload.integrity_ok : null,
    integrity_code:
      typeof payload.integrity_code === "string"
        ? payload.integrity_code
        : null,
  };
}

export async function getOrgDailyConsolidation(
  orgId: string,
  date: string | Date,
  client?: SupabaseClient,
): Promise<OrgDailyConsolidationRpcPayload> {
  const supabase = client ?? getSupabaseClient();
  const isoDate = toIsoDate(date);

  const { data, error } = await supabase.rpc("get_org_daily_consolidation", {
    p_org_id: orgId,
    p_date: isoDate,
  });

  if (error) {
    throw new Error(`get_org_daily_consolidation failed: ${error.message}`);
  }

  return normalizeOrgDailyConsolidationPayload(data);
}
