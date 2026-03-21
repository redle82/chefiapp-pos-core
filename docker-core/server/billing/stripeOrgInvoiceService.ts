import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

interface OrgInvoiceRow {
  id: string;
  organization_id: string;
  total_revenue_cents: number;
  period_start: string;
  period_end: string;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: "pending" | "paid" | "failed" | null;
}

interface OrgRow {
  id: string;
  name: string;
  billing_email: string | null;
  metadata: Record<string, unknown> | null;
}

interface StripeCustomer {
  id: string;
}

interface StripeInvoice {
  id: string;
  payment_intent?: string | null;
}

interface StripeClientLike {
  customers: {
    list: (params: {
      email?: string;
      limit?: number;
    }) => Promise<{ data: StripeCustomer[] }>;
    create: (params: {
      email?: string;
      name?: string;
      metadata?: Record<string, string>;
    }) => Promise<StripeCustomer>;
  };
  invoiceItems: {
    create: (params: {
      customer: string;
      amount: number;
      currency: string;
      description: string;
      metadata?: Record<string, string>;
    }) => Promise<{ id: string }>;
  };
  invoices: {
    create: (params: {
      customer: string;
      auto_advance: boolean;
      collection_method: "charge_automatically" | "send_invoice";
      metadata?: Record<string, string>;
    }) => Promise<StripeInvoice>;
  };
}

export interface StripeOrgInvoiceResult {
  invoice_id: string;
  stripe_invoice_id: string;
  stripe_payment_intent_id: string | null;
  payment_status: "pending" | "paid" | "failed";
  idempotent: boolean;
}

export interface StripeOrgInvoiceServiceOptions {
  client?: SupabaseClient;
  stripeClient?: StripeClientLike;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "stripeOrgInvoiceService requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

async function getStripeClient(): Promise<StripeClientLike> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  }

  const stripeModule = await import("stripe");
  const StripeCtor =
    (stripeModule as { default?: new (secretKey: string) => StripeClientLike })
      .default ??
    (stripeModule as unknown as new (secretKey: string) => StripeClientLike);

  return new StripeCtor(secretKey);
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function resolveStripeCustomerId(
  stripeClient: StripeClientLike,
  org: OrgRow,
): Promise<string> {
  const metadata = (org.metadata ?? {}) as Record<string, unknown>;
  const existing =
    typeof metadata.stripe_customer_id === "string"
      ? metadata.stripe_customer_id
      : null;

  if (existing && existing.length > 0) {
    return existing;
  }

  if (org.billing_email) {
    const listed = await stripeClient.customers.list({
      email: org.billing_email,
      limit: 1,
    });

    if (Array.isArray(listed.data) && listed.data[0]?.id) {
      return listed.data[0].id;
    }
  }

  const created = await stripeClient.customers.create({
    email: org.billing_email ?? undefined,
    name: org.name,
    metadata: {
      org_id: org.id,
    },
  });

  return created.id;
}

async function persistOrgStripeCustomerId(
  supabase: SupabaseClient,
  org: OrgRow,
  customerId: string,
): Promise<void> {
  const metadata = {
    ...(org.metadata ?? {}),
    stripe_customer_id: customerId,
  };

  const { error } = await supabase
    .from("gm_organizations")
    .update({ metadata })
    .eq("id", org.id);

  if (error) {
    throw new Error(
      `Failed to persist organization stripe customer id: ${error.message}`,
    );
  }
}

export async function createStripeInvoiceForOrgInvoice(
  invoiceId: string,
  options: StripeOrgInvoiceServiceOptions = {},
): Promise<StripeOrgInvoiceResult> {
  const supabase = options.client ?? getSupabaseClient();
  const stripe = options.stripeClient ?? (await getStripeClient());

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("gm_org_invoices")
    .select(
      "id,organization_id,total_revenue_cents,period_start,period_end,stripe_invoice_id,stripe_payment_intent_id,payment_status",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) {
    throw new Error(`Failed to load org invoice: ${invoiceError.message}`);
  }

  const invoice = invoiceRow as OrgInvoiceRow | null;

  if (!invoice) {
    throw new Error(`Organization invoice not found: ${invoiceId}`);
  }

  if (invoice.stripe_invoice_id) {
    return {
      invoice_id: invoice.id,
      stripe_invoice_id: invoice.stripe_invoice_id,
      stripe_payment_intent_id: invoice.stripe_payment_intent_id ?? null,
      payment_status: invoice.payment_status ?? "pending",
      idempotent: true,
    };
  }

  const { data: orgData, error: orgError } = await supabase
    .from("gm_organizations")
    .select("id,name,billing_email,metadata")
    .eq("id", invoice.organization_id)
    .maybeSingle();

  if (orgError) {
    throw new Error(
      `Failed to load organization for org invoice: ${orgError.message}`,
    );
  }

  const org = orgData as OrgRow | null;

  if (!org) {
    throw new Error(
      `Organization not found for org invoice: ${invoice.organization_id}`,
    );
  }

  const customerId = await resolveStripeCustomerId(stripe, org);
  await persistOrgStripeCustomerId(supabase, org, customerId);

  const amountCents = Math.max(0, toSafeNumber(invoice.total_revenue_cents));

  await stripe.invoiceItems.create({
    customer: customerId,
    amount: amountCents,
    currency: "eur",
    description: `Enterprise invoice ${invoice.period_start}..${invoice.period_end}`,
    metadata: {
      org_invoice_id: invoice.id,
      organization_id: invoice.organization_id,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
    },
  });

  const stripeInvoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    collection_method: "charge_automatically",
    metadata: {
      org_invoice_id: invoice.id,
      organization_id: invoice.organization_id,
    },
  });

  const { error: updateError } = await supabase
    .from("gm_org_invoices")
    .update({
      stripe_invoice_id: stripeInvoice.id,
      stripe_payment_intent_id: stripeInvoice.payment_intent ?? null,
      payment_status: "pending",
    })
    .eq("id", invoice.id);

  if (updateError) {
    throw new Error(
      `Failed to persist stripe invoice id: ${updateError.message}`,
    );
  }

  return {
    invoice_id: invoice.id,
    stripe_invoice_id: stripeInvoice.id,
    stripe_payment_intent_id: stripeInvoice.payment_intent ?? null,
    payment_status: "pending",
    idempotent: false,
  };
}
