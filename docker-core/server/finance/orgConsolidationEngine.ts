import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export type OrgConsolidationStatus = "green" | "yellow" | "red";

interface OrgRestaurantRow {
  restaurant_id?: string;
}

interface FinancialReconciliationInput {
  restaurant_id?: string;
  orders_total_cents?: number;
  receipts_total_cents?: number;
  discrepancy_amount_cents?: number;
  status?: OrgConsolidationStatus;
  details?: {
    total_orders?: number;
    total_receipts?: number;
    [key: string]: unknown;
  };
}

export interface OrgDailyConsolidationRow {
  id: string;
  organization_id: string;
  date: string;
  total_orders: number;
  total_receipts: number;
  total_revenue_cents: number;
  total_discrepancy_cents: number;
  status: OrgConsolidationStatus;
  created_at: string;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "OrgConsolidationEngine requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
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

function classifyOrgStatus(
  statuses: OrgConsolidationStatus[],
): OrgConsolidationStatus {
  if (statuses.every((status) => status === "green")) {
    return "green";
  }

  if (statuses.some((status) => status === "red")) {
    return "red";
  }

  return "yellow";
}

export async function generateOrgDailyConsolidation(
  orgId: string,
  date: string | Date,
  client?: SupabaseClient,
): Promise<OrgDailyConsolidationRow> {
  const supabase = client ?? getSupabaseClient();
  const isoDate = toIsoDate(date);

  const { data: orgRestaurants, error: orgRestaurantsError } = await supabase
    .from("gm_organization_restaurants")
    .select("restaurant_id")
    .eq("organization_id", orgId);

  if (orgRestaurantsError) {
    throw new Error(
      `gm_organization_restaurants query failed: ${orgRestaurantsError.message}`,
    );
  }

  const restaurantIds = (
    Array.isArray(orgRestaurants) ? (orgRestaurants as OrgRestaurantRow[]) : []
  )
    .map((row) => row.restaurant_id)
    .filter((value): value is string => typeof value === "string");

  let totalOrders = 0;
  let totalReceipts = 0;
  let totalRevenueCents = 0;
  let totalDiscrepancyCents = 0;
  let status: OrgConsolidationStatus = "green";

  if (restaurantIds.length > 0) {
    const { data: reconciliations, error: reconciliationsError } =
      await supabase
        .from("gm_financial_reconciliation")
        .select(
          "restaurant_id,orders_total_cents,receipts_total_cents,discrepancy_amount_cents,status,details",
        )
        .in("restaurant_id", restaurantIds)
        .eq("date", isoDate);

    if (reconciliationsError) {
      throw new Error(
        `gm_financial_reconciliation query failed: ${reconciliationsError.message}`,
      );
    }

    const rows = Array.isArray(reconciliations)
      ? (reconciliations as FinancialReconciliationInput[])
      : [];

    for (const row of rows) {
      const details = row.details ?? {};
      totalOrders += toSafeNumber(details.total_orders);
      totalReceipts += toSafeNumber(details.total_receipts);
      totalRevenueCents += toSafeNumber(row.orders_total_cents);
      totalDiscrepancyCents += toSafeNumber(row.discrepancy_amount_cents);
    }

    const statuses = rows
      .map((row) => row.status)
      .filter(
        (value): value is OrgConsolidationStatus =>
          value === "green" || value === "yellow" || value === "red",
      );

    status = statuses.length > 0 ? classifyOrgStatus(statuses) : "yellow";
  }

  const payload = {
    organization_id: orgId,
    date: isoDate,
    total_orders: totalOrders,
    total_receipts: totalReceipts,
    total_revenue_cents: totalRevenueCents,
    total_discrepancy_cents: totalDiscrepancyCents,
    status,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("gm_org_daily_consolidation")
    .upsert(payload, { onConflict: "organization_id,date" })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `gm_org_daily_consolidation upsert failed: ${error.message}`,
    );
  }

  return data as OrgDailyConsolidationRow;
}

export async function assertOrgFinancialIntegrity(
  orgId: string,
  date: string | Date,
  client?: SupabaseClient,
): Promise<void> {
  const supabase = client ?? getSupabaseClient();
  const isoDate = toIsoDate(date);

  const { data, error } = await supabase
    .from("gm_org_daily_consolidation")
    .select("status")
    .eq("organization_id", orgId)
    .eq("date", isoDate)
    .maybeSingle();

  if (error) {
    throw new Error(
      `gm_org_daily_consolidation lookup failed: ${error.message}`,
    );
  }

  const status = (data as { status?: OrgConsolidationStatus } | null)?.status;

  if (status === "green") {
    return;
  }

  const lockError = new Error(
    "Organization reconciliation must be green before enterprise financial operations",
  ) as Error & {
    code?: string;
    organizationId?: string;
    date?: string;
    status?: string;
  };

  lockError.code = "ORG_RECONCILIATION_REQUIRED";
  lockError.organizationId = orgId;
  lockError.date = isoDate;
  lockError.status = status ?? "missing";

  throw lockError;
}
