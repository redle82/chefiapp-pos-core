/**
 * SumUp Payment Provider
 *
 * Card present + payment links for ES.
 * Minimal functional stubs — createIntent/captureIntent call SumUp API;
 * handleWebhookEvent routes to normalization.
 */

import type {
  PaymentIntent,
  PaymentIntentStatus,
  PaymentReceipt,
  PaymentError,
} from "../types";
import { normalizeProviderEvent } from "../providerRouter";

export interface SumUpProviderConfig {
  accessToken: string;
  apiBaseUrl?: string;
  webhookSecret?: string;
}

export interface CreateIntentParams {
  restaurantId: string;
  orderId?: string | null;
  amount: number; // cents
  currency: string;
  checkoutReference?: string;
  paymentType?: "card" | "pix";
  country?: string;
}

export interface CaptureIntentParams {
  intentId: string; // SumUp checkout id
}

const DEFAULT_API_BASE = "https://api.sumup.com";

/** Create a SumUp checkout (intent) */
export async function createIntent(
  config: SumUpProviderConfig,
  params: CreateIntentParams
): Promise<{ intent: PaymentIntent } | { error: PaymentError }> {
  if (!config.accessToken) {
    return {
      error: {
        code: "provider_not_configured",
        message: "SumUp access token not configured",
        retryable: false,
        provider: "sumup",
      },
    };
  }

  const base = (config.apiBaseUrl ?? DEFAULT_API_BASE).replace(/\/$/, "");
  const amount = Number((params.amount / 100).toFixed(2));

  const body = {
    checkout_reference: params.checkoutReference ?? params.orderId ?? `ord_${Date.now()}`,
    amount,
    currency: params.currency,
    payment_type: params.paymentType ?? "card",
    country: params.country ?? "ES",
  };

  try {
    const res = await fetch(`${base}/v0.1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    if (!res.ok) {
      let msg: string;
      try {
        const j = JSON.parse(text) as { message?: string; error?: string };
        msg = j.message ?? j.error ?? text;
      } catch {
        msg = text || res.statusText;
      }
      return {
        error: {
          code: "sumup_api_error",
          message: `SumUp API: ${res.status} ${msg}`,
          retryable: res.status >= 500,
          provider: "sumup",
        },
      };
    }

    const data = JSON.parse(text || "{}") as {
      id?: string;
      status?: string;
      amount?: number;
      currency?: string;
      checkout_reference?: string;
    };

    const status = mapSumUpStatus(data.status ?? "PENDING");
    return {
      intent: {
        id: data.id ?? `sumup_${Date.now()}`,
        restaurant_id: params.restaurantId,
        order_id: params.orderId ?? null,
        amount: params.amount,
        currency: params.currency as "EUR" | "BRL",
        provider: "sumup",
        method: params.paymentType === "pix" ? "pix" : "card",
        status,
        provider_ref: data.id ?? "",
        metadata: { checkout_reference: data.checkout_reference },
        created_at: new Date().toISOString(),
      },
    };
  } catch (e: unknown) {
    const err = e as Error;
    return {
      error: {
        code: "network_error",
        message: err.message ?? "SumUp request failed",
        retryable: true,
        provider: "sumup",
      },
    };
  }
}

/** Capture is implicit for SumUp (payment completes via webhook). Stub returns success if checkout exists. */
export async function captureIntent(
  config: SumUpProviderConfig,
  params: CaptureIntentParams
): Promise<{ receipt: PaymentReceipt } | { error: PaymentError }> {
  if (!config.accessToken) {
    return {
      error: {
        code: "provider_not_configured",
        message: "SumUp access token not configured",
        retryable: false,
        provider: "sumup",
      },
    };
  }

  const base = (config.apiBaseUrl ?? DEFAULT_API_BASE).replace(/\/$/, "");

  try {
    const res = await fetch(
      `${base}/v0.1/checkouts/${encodeURIComponent(params.intentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    const text = await res.text();
    const data = JSON.parse(text || "{}") as {
      id?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };

    if (!res.ok) {
      return {
        error: {
          code: "capture_failed",
          message: `SumUp checkout not found or not paid: ${params.intentId}`,
          retryable: false,
          provider: "sumup",
        },
      };
    }

    const status = (data.status ?? "").toUpperCase();
    if (status !== "PAID" && status !== "SUCCESS") {
      return {
        error: {
          code: "not_paid",
          message: `SumUp checkout status is ${status}, not PAID`,
          retryable: false,
          provider: "sumup",
        },
      };
    }

    const amountCents = Math.round((data.amount ?? 0) * 100);
    return {
      receipt: {
        id: `sumup_${data.id}_${Date.now()}`,
        intent_id: params.intentId,
        provider: "sumup",
        provider_ref: data.id ?? params.intentId,
        amount: amountCents,
        currency: (data.currency ?? "EUR").toUpperCase() as "EUR" | "BRL",
        captured_at: new Date().toISOString(),
        raw: data as unknown as Record<string, unknown>,
      },
    };
  } catch (e: unknown) {
    const err = e as Error;
    return {
      error: {
        code: "capture_failed",
        message: err.message ?? "SumUp capture request failed",
        retryable: true,
        provider: "sumup",
      },
    };
  }
}

/** Route webhook body through SumUp normalization. No signature verification here (gateway does it). */
export function handleWebhookEvent(
  body: string,
  _signature: string | undefined,
  _webhookSecret: string | undefined,
  handler: (receipt: PaymentReceipt) => void | Promise<void>,
  errorHandler?: (error: PaymentError) => void | Promise<void>
): { ok: true } | { ok: false; status: number; json: object } {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body || "{}") as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      status: 400,
      json: { error: "invalid_json", message: "Invalid JSON body" },
    };
  }

  const normalized = normalizeProviderEvent("sumup", payload);

  if ("code" in normalized) {
    void errorHandler?.(normalized);
    return { ok: true };
  }

  void handler(normalized);
  return { ok: true };
}

function mapSumUpStatus(s: string): PaymentIntentStatus {
  const u = s.toUpperCase();
  if (u === "PAID" || u === "SUCCESS") return "succeeded";
  if (u === "PENDING" || u === "CREATED") return "created";
  if (u === "FAILED" || u === "DECLINED") return "failed";
  if (u === "EXPIRED") return "expired";
  return "processing";
}
