/**
 * Stripe Payment Provider
 *
 * Cards + subscriptions for US/GB.
 * Uses Stripe SDK for createIntent, captureIntent, handleWebhookEvent.
 */

import type {
  PaymentIntent,
  PaymentIntentStatus,
  PaymentReceipt,
  PaymentError,
} from "../types";
import { normalizeProviderEvent } from "../providerRouter";

export interface StripeProviderConfig {
  secretKey: string;
  webhookSecret?: string;
}

export interface CreateIntentParams {
  restaurantId: string;
  orderId?: string | null;
  amount: number; // cents
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface CaptureIntentParams {
  intentId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stripeModule: any = null;

async function getStripe(): Promise<any> {
  if (!stripeModule) {
    const mod = await import("stripe");
    stripeModule = (mod as { default?: new (key: string) => unknown }).default ?? mod;
  }
  return stripeModule;
}

/** Create a Stripe PaymentIntent */
export async function createIntent(
  config: StripeProviderConfig,
  params: CreateIntentParams
): Promise<{ intent: PaymentIntent } | { error: PaymentError }> {
  if (!config.secretKey) {
    return {
      error: {
        code: "provider_not_configured",
        message: "Stripe secret key not configured",
        retryable: false,
        provider: "stripe",
      },
    };
  }

  try {
    const Stripe = await getStripe();
    const stripe = new Stripe(config.secretKey);

    const intent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      metadata: {
        restaurant_id: params.restaurantId,
        ...(params.orderId && { order_id: params.orderId }),
        ...params.metadata,
      },
      automatic_payment_methods: { enabled: true },
    });

    const status = mapStripeStatus(intent.status);
    return {
      intent: {
        id: intent.id,
        restaurant_id: params.restaurantId,
        order_id: params.orderId ?? null,
        amount: params.amount,
        currency: params.currency as "USD" | "GBP" | "EUR",
        provider: "stripe",
        method: "card",
        status,
        provider_ref: intent.id,
        metadata: intent.metadata as Record<string, unknown>,
        created_at: new Date().toISOString(),
      },
    };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; type?: string };
    return {
      error: {
        code: err.code ?? "stripe_error",
        message: err.message ?? "Stripe API error",
        retryable: (err.code ?? "").startsWith("rate_limit") || (err.type ?? "") === "StripeCardError",
        provider: "stripe",
        details: { code: err.code, type: err.type },
      },
    };
  }
}

/** Capture a Stripe PaymentIntent (if not auto-captured) */
export async function captureIntent(
  config: StripeProviderConfig,
  params: CaptureIntentParams
): Promise<{ receipt: PaymentReceipt } | { error: PaymentError }> {
  if (!config.secretKey) {
    return {
      error: {
        code: "provider_not_configured",
        message: "Stripe secret key not configured",
        retryable: false,
        provider: "stripe",
      },
    };
  }

  try {
    const Stripe = await getStripe();
    const stripe = new Stripe(config.secretKey);
    const pi = await stripe.paymentIntents.capture(params.intentId);

    const amount = pi.amount_received ?? pi.amount;
    const currency = (pi.currency ?? "usd").toUpperCase();

    return {
      receipt: {
        id: `stripe_${pi.id}_${Date.now()}`,
        intent_id: pi.id,
        provider: "stripe",
        provider_ref: pi.id,
        amount,
        currency: currency as "USD" | "GBP" | "EUR",
        captured_at: new Date().toISOString(),
        raw: pi as unknown as Record<string, unknown>,
      },
    };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    return {
      error: {
        code: err.code ?? "capture_failed",
        message: err.message ?? "Stripe capture failed",
        retryable: (err.code ?? "").startsWith("rate_limit"),
        provider: "stripe",
      },
    };
  }
}

/** Handle Stripe webhook event — verify, parse, normalize */
export function handleWebhookEvent(
  body: string,
  signature: string | undefined,
  webhookSecret: string,
  handler: (receipt: PaymentReceipt) => void | Promise<void>,
  errorHandler?: (error: PaymentError) => void | Promise<void>,
  StripeLib?: { webhooks: { constructEvent: (a: string, b: string, c: string) => unknown } }
): { ok: true } | { ok: false; status: number; json: object } {
  const Stripe = StripeLib ?? (require("stripe") as { default: { webhooks: { constructEvent: (a: string, b: string, c: string) => unknown } } }).default;

  if (!webhookSecret) {
    return {
      ok: false,
      status: 503,
      json: { error: "webhook_not_configured", message: "Stripe webhook secret not set" },
    };
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = Stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret) as typeof event;
  } catch (e: unknown) {
    const err = e as Error;
    return {
      ok: false,
      status: 400,
      json: { error: "invalid_signature", message: err.message ?? "Webhook signature verification failed" },
    };
  }

  const normalized = normalizeProviderEvent("stripe", {
    type: event.type,
    data: event.data,
    object: event.data?.object,
  });

  if ("code" in normalized) {
    void errorHandler?.(normalized);
    return { ok: true }; // 200 to avoid retries for known failures
  }

  void handler(normalized);
  return { ok: true };
}

function mapStripeStatus(s: string): PaymentIntentStatus {
  const map: Record<string, PaymentIntentStatus> = {
    requires_payment_method: "created",
    requires_confirmation: "created",
    requires_action: "requires_action",
    processing: "processing",
    succeeded: "succeeded",
    canceled: "canceled",
    requires_capture: "processing",
  };
  return map[s] ?? "created";
}
