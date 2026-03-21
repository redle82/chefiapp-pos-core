import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export interface GenerateOrgInvoicePayload {
  invoice_id: string | null;
  status: "draft" | "blocked" | "issued";
  total_revenue_cents: number;
  integrity_ok: boolean;
}

export interface StableRpcError {
  code: string;
  message: string;
  details?: unknown;
}

export type GenerateOrgInvoiceRpcResult =
  | { ok: true; data: GenerateOrgInvoicePayload }
  | { ok: false; error: StableRpcError };

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "generateOrgInvoiceRpc requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
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

function normalizeStatus(value: unknown): "draft" | "blocked" | "issued" {
  return value === "draft" || value === "blocked" || value === "issued"
    ? value
    : "blocked";
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

function normalizePayload(raw: unknown): GenerateOrgInvoicePayload {
  const payload =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    invoice_id:
      typeof payload.invoice_id === "string" && payload.invoice_id.length > 0
        ? payload.invoice_id
        : null,
    status: normalizeStatus(payload.status),
    total_revenue_cents: toSafeNumber(payload.total_revenue_cents),
    integrity_ok: payload.integrity_ok === true,
  };
}

export async function generateOrgInvoiceRpc(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  client?: SupabaseClient,
): Promise<GenerateOrgInvoiceRpcResult> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase.rpc("generate_org_invoice", {
      p_org_id: orgId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) {
      return {
        ok: false,
        error: normalizeError(
          {
            code: (error as { code?: string }).code,
            message: `generate_org_invoice failed: ${error.message}`,
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
