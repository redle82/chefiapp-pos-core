import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

type EnterpriseStatus = "active" | "grace" | "suspended";
type PaymentStatus = "pending" | "paid" | "failed";

type OrganizationRow = {
  id: string;
  country: string | null;
  enterprise_status?: EnterpriseStatus | null;
  metadata?: Record<string, unknown> | null;
};

type InvoiceRow = {
  organization_id: string;
  total_revenue_cents: number;
  payment_status?: PaymentStatus | null;
  created_at: string;
};

export interface RevenueByCountry {
  country: string;
  mrr: number;
}

export interface EnterpriseRevenueBreakdown {
  totalMRR: number;
  totalARR: number;
  activeOrgs: number;
  graceOrgs: number;
  suspendedOrgs: number;
  revenueByCountry: RevenueByCountry[];
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "orgRevenueAnalyticsEngine requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeStatus(value: unknown): EnterpriseStatus {
  if (value === "active" || value === "grace" || value === "suspended") {
    return value;
  }
  return "active";
}

function isAnnualPlan(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!metadata || typeof metadata !== "object") return false;

  const candidates = [
    metadata.billing_cycle,
    metadata.billing_interval,
    metadata.plan_interval,
    metadata.interval,
  ];

  return candidates.some((value) =>
    typeof value === "string"
      ? value.toLowerCase() === "annual" || value.toLowerCase() === "yearly"
      : false,
  );
}

function toMonthBounds(referenceDate: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() + 1,
      1,
    ),
  );
  end.setUTCDate(end.getUTCDate() - 1);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

function parseReferenceMonth(referenceMonth: string): Date {
  const [yearStr, monthStr] = referenceMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(`Invalid referenceMonth format: ${referenceMonth}`);
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

async function loadOrganizations(
  client: SupabaseClient,
): Promise<OrganizationRow[]> {
  const { data, error } = await client
    .from("gm_organizations")
    .select("id,country,enterprise_status,metadata")
    .eq("enterprise_status", "active");

  if (error) {
    throw new Error(`Failed to load organizations: ${error.message}`);
  }

  const activeRows = Array.isArray(data) ? (data as OrganizationRow[]) : [];

  const { data: graceData, error: graceError } = await client
    .from("gm_organizations")
    .select("id,country,enterprise_status,metadata")
    .eq("enterprise_status", "grace");

  if (graceError) {
    throw new Error(`Failed to load organizations: ${graceError.message}`);
  }

  const graceRows = Array.isArray(graceData)
    ? (graceData as OrganizationRow[])
    : [];

  const { data: suspendedData, error: suspendedError } = await client
    .from("gm_organizations")
    .select("id,country,enterprise_status,metadata")
    .eq("enterprise_status", "suspended");

  if (suspendedError) {
    throw new Error(`Failed to load organizations: ${suspendedError.message}`);
  }

  const suspendedRows = Array.isArray(suspendedData)
    ? (suspendedData as OrganizationRow[])
    : [];

  return [...activeRows, ...graceRows, ...suspendedRows];
}

async function loadInvoicesInMonth(
  client: SupabaseClient,
  startIso: string,
  endIso: string,
): Promise<InvoiceRow[]> {
  const { data, error } = await client
    .from("gm_org_invoices")
    .select("organization_id,total_revenue_cents,payment_status,created_at")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(`Failed to load organization invoices: ${error.message}`);
  }

  return Array.isArray(data) ? (data as InvoiceRow[]) : [];
}

function pickLatestInvoiceByOrg(
  invoices: InvoiceRow[],
): Map<string, InvoiceRow> {
  const map = new Map<string, InvoiceRow>();

  for (const invoice of invoices) {
    if (!invoice.organization_id) continue;
    if (!map.has(invoice.organization_id)) {
      map.set(invoice.organization_id, invoice);
      continue;
    }

    const existing = map.get(invoice.organization_id);
    if (!existing) {
      map.set(invoice.organization_id, invoice);
      continue;
    }

    if (
      new Date(invoice.created_at).getTime() >
      new Date(existing.created_at).getTime()
    ) {
      map.set(invoice.organization_id, invoice);
    }
  }

  return map;
}

function monthlyEquivalent(invoice: InvoiceRow, org: OrganizationRow): number {
  const amount = safeNumber(invoice.total_revenue_cents);
  if (amount <= 0) return 0;
  return isAnnualPlan(org.metadata) ? Math.round(amount / 12) : amount;
}

function activeAtMonthEnd(
  invoice: InvoiceRow | undefined,
  monthEnd: Date,
): boolean {
  if (!invoice) return false;
  const status = invoice.payment_status;
  if (status === "paid") return true;
  if (status === "failed") return false;
  if (status !== "pending") return false;

  const createdAt = new Date(invoice.created_at);
  const ageMs = monthEnd.getTime() - createdAt.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return ageMs <= sevenDaysMs;
}

export async function calculateMRR(
  referenceDate = new Date(),
  client?: SupabaseClient,
): Promise<number> {
  const breakdown = await calculateEnterpriseRevenueBreakdown(
    referenceDate,
    client,
  );
  return breakdown.totalMRR;
}

export async function calculateARR(
  referenceDate = new Date(),
  client?: SupabaseClient,
): Promise<number> {
  const mrr = await calculateMRR(referenceDate, client);
  return mrr * 12;
}

export async function calculateEnterpriseRevenueBreakdown(
  referenceDate = new Date(),
  client?: SupabaseClient,
): Promise<EnterpriseRevenueBreakdown> {
  const supabase = client ?? getSupabaseClient();
  const organizations = await loadOrganizations(supabase);

  const { start, end } = toMonthBounds(referenceDate);
  const invoices = await loadInvoicesInMonth(
    supabase,
    start.toISOString(),
    end.toISOString(),
  );

  const latestByOrg = pickLatestInvoiceByOrg(invoices);

  let totalMRR = 0;
  let activeOrgs = 0;
  let graceOrgs = 0;
  let suspendedOrgs = 0;
  const revenueByCountryMap = new Map<string, number>();

  for (const org of organizations) {
    const status = safeStatus(org.enterprise_status);

    if (status === "active") activeOrgs += 1;
    else if (status === "grace") graceOrgs += 1;
    else suspendedOrgs += 1;

    if (status === "suspended") {
      continue;
    }

    const invoice = latestByOrg.get(org.id);
    if (!invoice) continue;

    const orgMrr = monthlyEquivalent(invoice, org);
    totalMRR += orgMrr;

    const country =
      org.country && org.country.trim().length > 0 ? org.country : "unknown";
    revenueByCountryMap.set(
      country,
      (revenueByCountryMap.get(country) ?? 0) + orgMrr,
    );
  }

  const revenueByCountry: RevenueByCountry[] = [
    ...revenueByCountryMap.entries(),
  ]
    .map(([country, mrr]) => ({ country, mrr }))
    .sort((a, b) => a.country.localeCompare(b.country));

  return {
    totalMRR,
    totalARR: totalMRR * 12,
    activeOrgs,
    graceOrgs,
    suspendedOrgs,
    revenueByCountry,
  };
}

export async function calculateChurnRate(
  referenceMonth: string,
  client?: SupabaseClient,
): Promise<number> {
  const supabase = client ?? getSupabaseClient();

  const currentMonthStart = parseReferenceMonth(referenceMonth);
  const previousMonthStart = new Date(
    Date.UTC(
      currentMonthStart.getUTCFullYear(),
      currentMonthStart.getUTCMonth() - 1,
      1,
    ),
  );

  const { end: currentMonthEnd } = toMonthBounds(currentMonthStart);
  const { end: previousMonthEnd } = toMonthBounds(previousMonthStart);

  const { data: allInvoices, error } = await supabase
    .from("gm_org_invoices")
    .select("organization_id,total_revenue_cents,payment_status,created_at")
    .gte("created_at", previousMonthStart.toISOString())
    .lte("created_at", currentMonthEnd.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(
      `Failed to load organization invoices for churn: ${error.message}`,
    );
  }

  const invoices = Array.isArray(allInvoices)
    ? (allInvoices as InvoiceRow[])
    : [];

  const previousMonthInvoices = invoices.filter(
    (invoice) =>
      new Date(invoice.created_at).getTime() <= previousMonthEnd.getTime(),
  );
  const currentMonthInvoices = invoices;

  const previousLatest = pickLatestInvoiceByOrg(previousMonthInvoices);
  const currentLatest = pickLatestInvoiceByOrg(currentMonthInvoices);

  const previouslyActive = new Set<string>();
  for (const [organizationId, invoice] of previousLatest.entries()) {
    if (activeAtMonthEnd(invoice, previousMonthEnd)) {
      previouslyActive.add(organizationId);
    }
  }

  if (previouslyActive.size === 0) {
    return 0;
  }

  let churned = 0;
  for (const organizationId of previouslyActive.values()) {
    const invoice = currentLatest.get(organizationId);
    if (!activeAtMonthEnd(invoice, currentMonthEnd)) {
      churned += 1;
    }
  }

  const rawRate = (churned / previouslyActive.size) * 100;
  return Number(rawRate.toFixed(2));
}
