import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { assertOrgFinancialIntegrity } from "../finance/orgConsolidationEngine";
import { assertGreenReconciliationOrThrow } from "../finance/reconciliationEngine";

export interface BillingIntegrityError {
  code: string;
  message: string;
}

export interface EnsureBillingIntegrityInput {
  restaurantId: string;
  date: string | Date;
  organizationId?: string | null;
  client?: SupabaseClient;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "billingIntegrityGuard requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function toIsoDate(input: string | Date): string {
  if (typeof input === "string") return input;
  return input.toISOString().slice(0, 10);
}

function toStableError(
  error: unknown,
  fallbackCode: string,
): BillingIntegrityError {
  if (error && typeof error === "object") {
    const payload = error as Record<string, unknown>;
    return {
      code:
        typeof payload.code === "string" && payload.code.trim().length > 0
          ? payload.code
          : fallbackCode,
      message:
        typeof payload.message === "string" && payload.message.trim().length > 0
          ? payload.message
          : "Billing integrity check failed",
    };
  }

  return {
    code: fallbackCode,
    message: String(error ?? "Billing integrity check failed"),
  };
}

function throwStableError(error: unknown, fallbackCode: string): never {
  const stable = toStableError(error, fallbackCode);
  const wrapped = new Error(stable.message) as Error & BillingIntegrityError;
  wrapped.code = stable.code;
  throw wrapped;
}

export async function ensureBillingIntegrity(
  input: EnsureBillingIntegrityInput,
): Promise<void> {
  const supabase = input.client ?? getSupabaseClient();
  const isoDate = toIsoDate(input.date);

  if (input.organizationId && input.organizationId.trim().length > 0) {
    const { data: organizationData, error: organizationError } = await supabase
      .from("gm_organizations")
      .select("enterprise_status")
      .eq("id", input.organizationId)
      .maybeSingle();

    if (organizationError) {
      throwStableError(
        {
          code: "ORG_STATUS_LOOKUP_FAILED",
          message: `gm_organizations lookup failed: ${organizationError.message}`,
        },
        "ORG_STATUS_LOOKUP_FAILED",
      );
    }

    const enterpriseStatus = (
      organizationData as {
        enterprise_status?: "active" | "suspended" | "grace";
      } | null
    )?.enterprise_status;

    if (enterpriseStatus === "suspended") {
      throwStableError(
        {
          code: "ORG_SUSPENDED",
          message: "Enterprise access suspended due to unpaid invoice",
        },
        "ORG_SUSPENDED",
      );
    }

    if (enterpriseStatus === "grace") {
      console.warn(
        JSON.stringify({
          event: "org.enforcement.grace_warning",
          organizationId: input.organizationId,
        }),
      );
    }

    try {
      await assertOrgFinancialIntegrity(
        input.organizationId,
        isoDate,
        supabase,
      );
      return;
    } catch (orgError) {
      throwStableError(orgError, "ORG_RECONCILIATION_REQUIRED");
    }
  }

  const { data, error } = await supabase
    .from("gm_financial_reconciliation")
    .select("status")
    .eq("restaurant_id", input.restaurantId)
    .eq("date", isoDate)
    .maybeSingle();

  if (error) {
    throwStableError(
      {
        code: "RECONCILIATION_LOOKUP_FAILED",
        message: `gm_financial_reconciliation lookup failed: ${error.message}`,
      },
      "RECONCILIATION_LOOKUP_FAILED",
    );
  }

  const status = (data as { status?: "green" | "yellow" | "red" } | null)
    ?.status;

  try {
    assertGreenReconciliationOrThrow(status);
  } catch (restaurantError) {
    throwStableError(restaurantError, "RECONCILIATION_REQUIRED");
  }
}
