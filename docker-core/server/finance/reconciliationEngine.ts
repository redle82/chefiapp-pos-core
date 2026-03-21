import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export type ReconciliationStatus = "green" | "yellow" | "red";

export interface ReconciliationDiscrepancy {
  restaurantId: string;
  date: string;
  ordersTotalCents: number;
  receiptsTotalCents: number;
  zReportTotalCents: number;
  discrepancyOrdersVsReceiptsCents: number;
  discrepancyOrdersVsZReportCents: number;
  discrepancyAmountCents: number;
  discrepancyRatio: number;
  status: ReconciliationStatus;
  details: Record<string, unknown>;
}

export interface FinancialReconciliationRow {
  id: string;
  restaurant_id: string;
  date: string;
  orders_total_cents: number;
  receipts_total_cents: number;
  z_report_total_cents: number;
  discrepancy_amount_cents: number;
  discrepancy_ratio: number;
  status: ReconciliationStatus;
  details: Record<string, unknown>;
  generated_at: string;
}

interface ReconciliationReportPayload {
  total_orders?: number;
  total_order_amount?: number;
  total_receipts?: number;
  total_receipt_amount?: number;
  missing_receipts?: number;
  orphan_receipts?: number;
  mismatched_orders?: number;
  discrepancies?: unknown[];
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "ReconciliationEngine requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
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

function extractZReportTotal(
  rows: Array<{ z_report?: Record<string, unknown> }>,
): number {
  return rows.reduce((sum, row) => {
    const zReport = row.z_report ?? {};
    const gross = toSafeNumber(zReport.total_gross_cents);
    return sum + gross;
  }, 0);
}

export function classifyStatus(
  discrepancyAmountCents: number,
  referenceRevenueCents = 0,
): ReconciliationStatus {
  const absDiscrepancy = Math.abs(discrepancyAmountCents);
  if (absDiscrepancy === 0) return "green";

  if (
    referenceRevenueCents > 0 &&
    absDiscrepancy < referenceRevenueCents * 0.01
  ) {
    return "yellow";
  }

  return "red";
}

export function assertGreenReconciliationOrThrow(
  status: ReconciliationStatus | null | undefined,
): void {
  if (status === "green") return;

  const error = new Error(
    "Daily reconciliation must be green before close_cash_register_atomic",
  );
  (error as Error & { code?: string }).code = "RECONCILIATION_REQUIRED";
  throw error;
}

export async function calculateDiscrepancies(
  restaurantId: string,
  date: string | Date,
  client?: SupabaseClient,
): Promise<ReconciliationDiscrepancy> {
  const supabase = client ?? getSupabaseClient();
  const isoDate = toIsoDate(date);

  const { data: reportData, error: reportError } = await supabase.rpc(
    "get_reconciliation_report",
    {
      p_restaurant_id: restaurantId,
      p_date: isoDate,
    },
  );

  if (reportError) {
    throw new Error(`get_reconciliation_report failed: ${reportError.message}`);
  }

  const report = (reportData ?? {}) as ReconciliationReportPayload;

  const { data: zReports, error: zReportsError } = await supabase
    .from("gm_z_reports")
    .select("z_report")
    .eq("restaurant_id", restaurantId)
    .eq("report_date", isoDate);

  if (zReportsError) {
    throw new Error(`gm_z_reports query failed: ${zReportsError.message}`);
  }

  const ordersTotalCents = toSafeNumber(report.total_order_amount);
  const receiptsTotalCents = toSafeNumber(report.total_receipt_amount);
  const zReportTotalCents = extractZReportTotal(
    Array.isArray(zReports)
      ? (zReports as Array<{ z_report?: Record<string, unknown> }>)
      : [],
  );

  const discrepancyOrdersVsReceiptsCents = Math.abs(
    ordersTotalCents - receiptsTotalCents,
  );
  const discrepancyOrdersVsZReportCents = Math.abs(
    ordersTotalCents - zReportTotalCents,
  );
  const discrepancyAmountCents = Math.max(
    discrepancyOrdersVsReceiptsCents,
    discrepancyOrdersVsZReportCents,
  );

  const discrepancyRatio =
    ordersTotalCents > 0
      ? discrepancyAmountCents / ordersTotalCents
      : discrepancyAmountCents === 0
      ? 0
      : 1;

  const status = classifyStatus(discrepancyAmountCents, ordersTotalCents);

  return {
    restaurantId,
    date: isoDate,
    ordersTotalCents,
    receiptsTotalCents,
    zReportTotalCents,
    discrepancyOrdersVsReceiptsCents,
    discrepancyOrdersVsZReportCents,
    discrepancyAmountCents,
    discrepancyRatio,
    status,
    details: {
      total_orders: toSafeNumber(report.total_orders),
      total_receipts: toSafeNumber(report.total_receipts),
      missing_receipts: toSafeNumber(report.missing_receipts),
      orphan_receipts: toSafeNumber(report.orphan_receipts),
      mismatched_orders: toSafeNumber(report.mismatched_orders),
      discrepancies: Array.isArray(report.discrepancies)
        ? report.discrepancies
        : [],
    },
  };
}

export async function generateDailyReconciliation(
  restaurantId: string,
  date: string | Date,
  client?: SupabaseClient,
): Promise<FinancialReconciliationRow> {
  const supabase = client ?? getSupabaseClient();
  const discrepancy = await calculateDiscrepancies(
    restaurantId,
    date,
    supabase,
  );

  const payload = {
    restaurant_id: discrepancy.restaurantId,
    date: discrepancy.date,
    orders_total_cents: discrepancy.ordersTotalCents,
    receipts_total_cents: discrepancy.receiptsTotalCents,
    z_report_total_cents: discrepancy.zReportTotalCents,
    discrepancy_amount_cents: discrepancy.discrepancyAmountCents,
    discrepancy_ratio: discrepancy.discrepancyRatio,
    status: discrepancy.status,
    details: discrepancy.details,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("gm_financial_reconciliation")
    .upsert(payload, { onConflict: "restaurant_id,date" })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `gm_financial_reconciliation upsert failed: ${error.message}`,
    );
  }

  return data as FinancialReconciliationRow;
}
