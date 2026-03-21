import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { assertOrgFinancialIntegrity } from "../finance/orgConsolidationEngine";

export type OrgInvoiceStatus = "draft" | "blocked" | "issued";

interface OrgDailyConsolidationInput {
  total_revenue_cents?: number;
  total_discrepancy_cents?: number;
  status?: "green" | "yellow" | "red";
  date?: string;
}

export interface OrgInvoiceRow {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  total_revenue_cents: number;
  discrepancy_cents: number;
  status: OrgInvoiceStatus;
  integrity_snapshot: Record<string, unknown>;
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
      "OrgInvoiceEngine requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
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

export async function generateOrgInvoice(
  orgId: string,
  periodStart: string | Date,
  periodEnd: string | Date,
  client?: SupabaseClient,
): Promise<OrgInvoiceRow> {
  const supabase = client ?? getSupabaseClient();
  const isoStart = toIsoDate(periodStart);
  const isoEnd = toIsoDate(periodEnd);

  let integrityOk = true;
  let integrityCode: string | null = null;
  let integrityReason: string | null = null;

  try {
    await assertOrgFinancialIntegrity(orgId, isoEnd, supabase);
  } catch (error) {
    integrityOk = false;
    integrityCode = "ORG_RECONCILIATION_REQUIRED";
    integrityReason = error instanceof Error ? error.message : String(error);
  }

  const { data: consolidationRows, error: consolidationError } = await supabase
    .from("gm_org_daily_consolidation")
    .select("date,total_revenue_cents,total_discrepancy_cents,status")
    .eq("organization_id", orgId)
    .gte("date", isoStart)
    .lte("date", isoEnd);

  if (consolidationError) {
    throw new Error(
      `gm_org_daily_consolidation period query failed: ${consolidationError.message}`,
    );
  }

  const rows = Array.isArray(consolidationRows)
    ? (consolidationRows as OrgDailyConsolidationInput[])
    : [];

  const totalRevenueCents = rows.reduce(
    (sum, row) => sum + toSafeNumber(row.total_revenue_cents),
    0,
  );

  const discrepancyCents = rows.reduce(
    (sum, row) => sum + toSafeNumber(row.total_discrepancy_cents),
    0,
  );

  const integritySnapshot: Record<string, unknown> = {
    integrity_ok: integrityOk,
    integrity_code: integrityCode,
    integrity_reason: integrityReason,
    checked_date: isoEnd,
    period_start: isoStart,
    period_end: isoEnd,
    consolidated_days: rows.length,
    statuses: rows.map((row) => ({
      date: row.date ?? null,
      status: row.status ?? null,
      discrepancy_amount_cents: toSafeNumber(row.total_discrepancy_cents),
    })),
    generated_at: new Date().toISOString(),
  };

  const payload = {
    organization_id: orgId,
    period_start: isoStart,
    period_end: isoEnd,
    total_revenue_cents: totalRevenueCents,
    discrepancy_cents: discrepancyCents,
    status: (integrityOk ? "issued" : "blocked") as OrgInvoiceStatus,
    integrity_snapshot: integritySnapshot,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("gm_org_invoices")
    .upsert(payload, { onConflict: "organization_id,period_start,period_end" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`gm_org_invoices upsert failed: ${error.message}`);
  }

  return data as OrgInvoiceRow;
}
