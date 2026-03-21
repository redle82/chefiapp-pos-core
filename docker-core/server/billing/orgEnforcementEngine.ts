import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export type EnterpriseStatus = "active" | "suspended" | "grace";

interface OrganizationRow {
  id: string;
  enterprise_status?: EnterpriseStatus | null;
  suspended_at?: string | null;
  grace_until?: string | null;
}

interface OrgInvoiceRow {
  payment_status?: "pending" | "paid" | "failed" | null;
  created_at?: string;
}

export interface OrgEnforcementResult {
  organizationId: string;
  previousStatus: EnterpriseStatus;
  newStatus: EnterpriseStatus;
}

export interface OrgEnforcementOptions {
  client?: SupabaseClient;
  now?: Date;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "orgEnforcementEngine requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function safeStatus(status: unknown): EnterpriseStatus {
  if (status === "active" || status === "suspended" || status === "grace") {
    return status;
  }
  return "active";
}

export async function evaluateOrgPaymentStatus(
  organizationId: string,
  options: OrgEnforcementOptions = {},
): Promise<OrgEnforcementResult> {
  const supabase = options.client ?? getSupabaseClient();
  const now = options.now ?? new Date();

  const { data: orgRow, error: orgError } = await supabase
    .from("gm_organizations")
    .select("id,enterprise_status,suspended_at,grace_until")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError) {
    throw new Error(`Failed to load organization: ${orgError.message}`);
  }

  const organization = orgRow as OrganizationRow | null;

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  const previousStatus = safeStatus(organization.enterprise_status);

  const { data: latestRows, error: invoiceError } = await supabase
    .from("gm_org_invoices")
    .select("payment_status,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (invoiceError) {
    throw new Error(
      `Failed to load latest org invoice: ${invoiceError.message}`,
    );
  }

  const latestInvoice = Array.isArray(latestRows)
    ? ((latestRows[0] ?? null) as OrgInvoiceRow | null)
    : null;

  let newStatus: EnterpriseStatus = "active";
  let suspendedAt: string | null = null;
  let graceUntil: string | null = null;

  const paymentStatus = latestInvoice?.payment_status ?? null;

  if (paymentStatus === "failed") {
    newStatus = "suspended";
    suspendedAt =
      previousStatus === "suspended" && organization.suspended_at
        ? organization.suspended_at
        : now.toISOString();
  } else if (paymentStatus === "pending") {
    const invoiceDate = latestInvoice?.created_at
      ? new Date(latestInvoice.created_at)
      : now;
    const graceDeadline = new Date(
      invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    if (now.getTime() > graceDeadline.getTime()) {
      newStatus = "suspended";
      suspendedAt =
        previousStatus === "suspended" && organization.suspended_at
          ? organization.suspended_at
          : now.toISOString();
    } else {
      newStatus = "grace";
      graceUntil = graceDeadline.toISOString();
    }
  } else {
    newStatus = "active";
  }

  const { error: updateError } = await supabase
    .from("gm_organizations")
    .update({
      enterprise_status: newStatus,
      suspended_at: suspendedAt,
      grace_until: graceUntil,
    })
    .eq("id", organizationId);

  if (updateError) {
    throw new Error(
      `Failed to update organization enforcement status: ${updateError.message}`,
    );
  }

  return {
    organizationId,
    previousStatus,
    newStatus,
  };
}
