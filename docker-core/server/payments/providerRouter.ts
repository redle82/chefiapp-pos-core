/**
 * Payment Provider Router
 *
 * Resolves provider by country, method, mode.
 * Normalizes provider events to PaymentReceipt | PaymentError.
 */

import type {
  PaymentCountry,
  PaymentCurrency,
  PaymentError,
  PaymentMethod,
  PaymentMode,
  PaymentReceipt,
  Provider,
} from "./types";

export type ResolveProviderInput = {
  country: PaymentCountry;
  method: PaymentMethod;
  mode?: PaymentMode;
};

/** Resolve provider for given country + method + mode */
export function resolveProvider(input: ResolveProviderInput): Provider {
  const { country, method } = input;
  const mode = input.mode ?? "online";

  if (method === "cash") {
    return "pix"; // Cash is manual; use pix provider for manual/assisted flows
  }

  if (method === "pix") {
    return "pix";
  }

  if (method === "card") {
    switch (country) {
      case "BR":
        // BR card: SumUp (POS) or Stripe (online) — default to stripe for online
        return mode === "pos" ? "sumup" : "stripe";
      case "US":
      case "GB":
        return "stripe";
      case "ES":
        return "sumup";
      default:
        return "stripe";
    }
  }

  return "stripe";
}

/** Resolve currency by country */
export function resolveCurrencyByCountry(country: PaymentCountry): PaymentCurrency {
  switch (country) {
    case "BR":
      return "BRL";
    case "US":
      return "USD";
    case "GB":
      return "GBP";
    case "ES":
      return "EUR";
    default:
      return "EUR";
  }
}

/** Normalize a provider webhook/event into PaymentReceipt or PaymentError */
export function normalizeProviderEvent(
  provider: Provider,
  event: Record<string, unknown>
): PaymentReceipt | PaymentError {
  switch (provider) {
    case "stripe":
      return normalizeStripeEvent(event);
    case "sumup":
      return normalizeSumUpEvent(event);
    case "pix":
      return normalizePixEvent(event);
    default:
      return {
        code: "unknown_provider",
        message: `Provider ${provider} not supported for event normalization`,
        retryable: false,
        provider,
      };
  }
}

function normalizeStripeEvent(event: Record<string, unknown>): PaymentReceipt | PaymentError {
  const type = event.type as string;
  const data = event.data as { object?: Record<string, unknown> } | undefined;
  const fallback = (event as Record<string, unknown>).object ?? event;
  const obj = (data?.object ?? fallback) as Record<string, unknown>;
  const id = (obj.id as string) || (event.id as string) || "";

  if (type === "payment_intent.succeeded") {
    const amount = (obj.amount ?? obj.amount_received ?? 0) as number;
    const currency = (obj.currency as string)?.toUpperCase() || "USD";
    return {
      id: `stripe_${id}_${Date.now()}`,
      intent_id: obj.id as string,
      provider: "stripe",
      provider_ref: id,
      amount,
      currency: currency as PaymentCurrency,
      captured_at: new Date().toISOString(),
      raw: obj as Record<string, unknown>,
    };
  }

  if (type === "payment_intent.payment_failed") {
    const lastError = obj.last_payment_error as Record<string, unknown> | undefined;
    const msg = (lastError?.message as string) || "Payment failed";
    return {
      code: "payment_failed",
      message: msg,
      retryable: true,
      provider: "stripe",
      details: lastError as Record<string, unknown>,
    };
  }

  return {
    code: "unhandled_event",
    message: `Stripe event ${type} not mapped to receipt`,
    retryable: false,
    provider: "stripe",
    details: { type, id },
  };
}

function normalizeSumUpEvent(event: Record<string, unknown>): PaymentReceipt | PaymentError {
  const status = (event.status as string)?.toLowerCase();
  const paymentId = (event.paymentId ?? event.id ?? event.checkout_id) as string;
  const amount = Number(event.amount ?? event.transaction_amount ?? 0) * 100; // SumUp uses units
  const currency = ((event.currency as string) || "EUR").toUpperCase();

  if (status === "paid" || status === "success" || status === "successful") {
    return {
      id: `sumup_${paymentId}_${Date.now()}`,
      intent_id: (event.checkout_reference ?? paymentId) as string,
      provider: "sumup",
      provider_ref: paymentId,
      amount: Math.round(amount),
      currency: currency as PaymentCurrency,
      captured_at: new Date().toISOString(),
      raw: event as Record<string, unknown>,
    };
  }

  if (status === "failed" || status === "declined") {
    return {
      code: "payment_failed",
      message: (event.message as string) || "SumUp payment failed",
      retryable: true,
      provider: "sumup",
      details: event as Record<string, unknown>,
    };
  }

  return {
    code: "unhandled_event",
    message: `SumUp event status=${status} not mapped to receipt`,
    retryable: false,
    provider: "sumup",
    details: event as Record<string, unknown>,
  };
}

function normalizePixEvent(event: Record<string, unknown>): PaymentReceipt | PaymentError {
  const status = (event.status as string)?.toLowerCase();
  const txId = (event.transaction_id ?? event.id ?? event.e2eid) as string;

  if (status === "paid" || status === "completed") {
    const amount = Number(event.amount ?? 0) * 100;
    return {
      id: `pix_${txId}_${Date.now()}`,
      intent_id: (event.intent_id ?? txId) as string,
      provider: "pix",
      provider_ref: txId,
      amount: Math.round(amount),
      currency: "BRL",
      captured_at: new Date().toISOString(),
      raw: event as Record<string, unknown>,
    };
  }

  if (status === "failed" || status === "expired") {
    return {
      code: status === "expired" ? "payment_expired" : "payment_failed",
      message: (event.message as string) || `Pix payment ${status}`,
      retryable: status !== "expired",
      provider: "pix",
      details: event as Record<string, unknown>,
    };
  }

  return {
    code: "unhandled_event",
    message: `Pix event status=${status} not mapped to receipt`,
    retryable: false,
    provider: "pix",
    details: event as Record<string, unknown>,
  };
}
