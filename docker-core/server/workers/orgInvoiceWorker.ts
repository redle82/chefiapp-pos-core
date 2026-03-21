import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  generateOrgInvoiceRpc,
  type GenerateOrgInvoicePayload,
} from "../billing/generateOrgInvoiceRpc";
import {
  evaluateOrgPaymentStatus,
  type OrgEnforcementResult,
} from "../billing/orgEnforcementEngine";
import {
  createStripeInvoiceForOrgInvoice,
  type StripeOrgInvoiceResult,
} from "../billing/stripeOrgInvoiceService";

export interface OrgInvoiceWorkerInput {
  periodStart: string;
  periodEnd: string;
}

export interface OrgInvoiceWorkerFailure {
  organizationId: string;
  code: string;
  message: string;
  details?: unknown;
}

export interface OrgInvoiceWorkerResult {
  period_start: string;
  period_end: string;
  scanned: number;
  processed: number;
  issued: number;
  blocked: number;
  failed: number;
  invoices: GenerateOrgInvoicePayload[];
  failures: OrgInvoiceWorkerFailure[];
}

export interface OrgInvoiceWorkerDependencies {
  createStripeInvoiceForOrgInvoice?: (
    invoiceId: string,
  ) => Promise<StripeOrgInvoiceResult>;
  evaluateOrgPaymentStatus?: (
    organizationId: string,
  ) => Promise<OrgEnforcementResult>;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "OrgInvoiceWorker requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

export async function scanOrgsAndGenerateInvoices(
  periodStart: string,
  periodEnd: string,
  client?: SupabaseClient,
  dependencies?: OrgInvoiceWorkerDependencies,
): Promise<OrgInvoiceWorkerResult> {
  const supabase = client ?? getSupabaseClient();

  const { data: organizations, error } = await supabase
    .from("gm_organizations")
    .select("id");

  if (error) {
    throw new Error(`Failed to load organizations: ${error.message}`);
  }

  const rows = Array.isArray(organizations) ? organizations : [];

  const result: OrgInvoiceWorkerResult = {
    period_start: periodStart,
    period_end: periodEnd,
    scanned: rows.length,
    processed: 0,
    issued: 0,
    blocked: 0,
    failed: 0,
    invoices: [],
    failures: [],
  };

  const createStripeInvoice =
    dependencies?.createStripeInvoiceForOrgInvoice ??
    createStripeInvoiceForOrgInvoice;
  const evaluateOrgStatus =
    dependencies?.evaluateOrgPaymentStatus ?? evaluateOrgPaymentStatus;

  for (const row of rows) {
    const organizationId = (row as { id?: string }).id;
    if (!organizationId) continue;

    const invoiceResult = await generateOrgInvoiceRpc(
      organizationId,
      periodStart,
      periodEnd,
      supabase,
    );

    if (invoiceResult.ok) {
      result.processed += 1;
      result.invoices.push(invoiceResult.data);

      if (invoiceResult.data.status === "issued") {
        result.issued += 1;
      } else if (invoiceResult.data.status === "blocked") {
        result.blocked += 1;
      }

      console.log(
        JSON.stringify({
          event: "org.invoice.generated",
          organizationId,
          period_start: periodStart,
          period_end: periodEnd,
          invoice: invoiceResult.data,
        }),
      );

      if (
        invoiceResult.data.status === "issued" &&
        typeof invoiceResult.data.invoice_id === "string" &&
        invoiceResult.data.invoice_id.length > 0
      ) {
        try {
          const stripeInvoice = await createStripeInvoice(
            invoiceResult.data.invoice_id,
          );

          console.log(
            JSON.stringify({
              event: "org.invoice.stripe.created",
              invoice_id: invoiceResult.data.invoice_id,
              stripe_invoice_id: stripeInvoice.stripe_invoice_id,
            }),
          );
        } catch (stripeError) {
          console.error(
            JSON.stringify({
              event: "org.invoice.stripe.failed",
              invoice_id: invoiceResult.data.invoice_id,
              message:
                stripeError instanceof Error
                  ? stripeError.message
                  : String(stripeError),
            }),
          );
        }
      }

      try {
        const enforcement = await evaluateOrgStatus(organizationId);
        console.log(
          JSON.stringify({
            event: "org.enforcement.updated",
            organizationId,
            newStatus: enforcement.newStatus,
          }),
        );
      } catch (enforcementError) {
        console.error(
          JSON.stringify({
            event: "org.enforcement.failed",
            organizationId,
            message:
              enforcementError instanceof Error
                ? enforcementError.message
                : String(enforcementError),
          }),
        );
      }

      continue;
    }

    result.failed += 1;
    result.failures.push({
      organizationId,
      code: invoiceResult.error.code,
      message: invoiceResult.error.message,
      details: invoiceResult.error.details,
    });

    console.error(
      JSON.stringify({
        event: "org.invoice.failed",
        organizationId,
        period_start: periodStart,
        period_end: periodEnd,
        error: invoiceResult.error,
      }),
    );
  }

  return result;
}

export async function runOrgInvoiceWorker(
  input: OrgInvoiceWorkerInput,
  client?: SupabaseClient,
  dependencies?: OrgInvoiceWorkerDependencies,
): Promise<OrgInvoiceWorkerResult> {
  const result = await scanOrgsAndGenerateInvoices(
    input.periodStart,
    input.periodEnd,
    client,
    dependencies,
  );

  console.log(
    JSON.stringify({
      event: "org.invoice.summary",
      ...result,
      timestamp: new Date().toISOString(),
    }),
  );

  return result;
}

async function main(): Promise<void> {
  const periodStart = process.env.PERIOD_START;
  const periodEnd = process.env.PERIOD_END;

  if (!periodStart || !periodEnd) {
    throw new Error(
      "ORG invoice worker requires PERIOD_START and PERIOD_END environment variables (YYYY-MM-DD)",
    );
  }

  const result = await runOrgInvoiceWorker({ periodStart, periodEnd });

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: "org.invoice.worker.crash",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  });
}
