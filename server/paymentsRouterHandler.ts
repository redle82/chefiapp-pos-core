/**
 * Payment Provider Router — Gateway handlers
 *
 * Handles POST /api/v1/payments/intents, capture, pix/paid.
 * Uses docker-core/server/payments providers and Core RPCs.
 */

import {
  pixCreateIntent,
  resolveCurrencyByCountry,
  resolveProvider,
  stripeCreateIntent,
  sumupCreateIntent,
} from "../docker-core/server/payments";
import type {
  PaymentCountry,
  PaymentMethod,
} from "../docker-core/server/payments/types";

export interface PaymentsGatewayConfig {
  coreUrl: string;
  coreServiceKey: string;
  stripeSecretKey: string;
  sumupAccessToken: string;
  sumupApiBaseUrl: string;
}

const CORE_RPC_TIMEOUT_MS = Number(
  process.env.PAYMENTS_RPC_TIMEOUT_MS || "10000",
);

function mapGatewayErrorCode(message: string): string {
  if (message.includes("SUBSCRIPTION_")) return "subscription_blocked";
  if (message.includes("UNAUTHORIZED") || message.includes("ACTOR_REQUIRED"))
    return "forbidden";
  if (message.includes("INVALID_TRANSITION")) return "invalid_transition";
  if (message.includes("ORDER_NOT_FOUND")) return "order_not_found";
  if (message.includes("INVALID_PLAN") || message.includes("INVALID_STATUS"))
    return "validation_error";
  if (message.includes("UPSTREAM_TIMEOUT")) return "upstream_timeout";
  if (message.includes("UPSTREAM_UNAVAILABLE")) return "upstream_unavailable";
  return "rpc_error";
}

function coreRpc(
  config: PaymentsGatewayConfig,
  rpcName: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const url = `${config.coreUrl}/rpc/${rpcName}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CORE_RPC_TIMEOUT_MS);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${config.coreServiceKey}`,
      apikey: config.coreServiceKey,
    },
    body: JSON.stringify(params),
    signal: controller.signal,
  })
    .catch((error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError"
      ) {
        throw new Error("UPSTREAM_TIMEOUT");
      }
      throw new Error(
        `UPSTREAM_UNAVAILABLE:${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    })
    .then(async (r) => {
      const text = await r.text();
      if (!r.ok) throw new Error(text || r.statusText);
      return text ? JSON.parse(text) : {};
    })
    .finally(() => {
      clearTimeout(timeout);
    });
}

function jsonResponse(
  ok: boolean,
  data?: unknown,
  error?: { code: string; message: string },
) {
  if (ok) return { ok: true as const, data };
  return {
    ok: false as const,
    error: error ?? { code: "unknown", message: "Unknown error" },
  };
}

export async function handleCreatePaymentIntent(
  config: PaymentsGatewayConfig,
  body: {
    restaurant_id: string;
    order_id?: string | null;
    idempotency_key?: string | null;
    amount: number;
    method: PaymentMethod;
    country: PaymentCountry;
    actor_user_id?: string | null;
  },
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string } }
> {
  const {
    restaurant_id,
    order_id,
    idempotency_key,
    amount,
    method,
    country,
    actor_user_id,
  } = body;
  if (
    !restaurant_id ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !method ||
    !country
  ) {
    return jsonResponse(false, undefined, {
      code: "validation_error",
      message: "restaurant_id, amount (positive), method, country required",
    });
  }

  const provider = resolveProvider({ country, method });
  const currency = resolveCurrencyByCountry(country);
  const amountCents = Math.round(amount);

  let intentResult:
    | {
        intent: {
          provider_ref?: string | null;
          status: string;
          pix_instructions?: unknown;
        };
      }
    | { error: { code: string; message: string } };

  if (provider === "stripe") {
    intentResult = await stripeCreateIntent(
      { secretKey: config.stripeSecretKey },
      {
        restaurantId: restaurant_id,
        orderId: order_id ?? null,
        amount: amountCents,
        currency,
        metadata: { order_id: order_id ?? undefined },
      },
    );
  } else if (provider === "sumup") {
    intentResult = await sumupCreateIntent(
      {
        accessToken: config.sumupAccessToken,
        apiBaseUrl: config.sumupApiBaseUrl,
      },
      {
        restaurantId: restaurant_id,
        orderId: order_id ?? null,
        amount: amountCents,
        currency,
        checkoutReference: order_id ?? undefined,
        paymentType: method === "pix" ? "pix" : "card",
        country,
      },
    );
  } else {
    intentResult = await pixCreateIntent(
      {},
      {
        restaurantId: restaurant_id,
        orderId: order_id ?? null,
        amount: amountCents,
        currency,
      },
    );
  }

  if ("error" in intentResult) {
    return jsonResponse(false, undefined, {
      code: intentResult.error.code,
      message: intentResult.error.message,
    });
  }

  const intent = intentResult.intent;
  try {
    const rpcResult = (await coreRpc(config, "create_payment_intent", {
      p_restaurant_id: restaurant_id,
      p_order_id: order_id ?? null,
      p_amount: amountCents,
      p_method: method,
      p_country: country,
      p_actor_user_id: actor_user_id ?? null,
      p_idempotency_key: idempotency_key ?? null,
      p_provider: provider,
      p_provider_ref: intent.provider_ref ?? null,
      p_status: intent.status,
      p_currency: currency,
      p_metadata: {},
      p_pix_instructions: intent.pix_instructions ?? null,
    })) as Record<string, unknown>;
    return jsonResponse(true, rpcResult);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = mapGatewayErrorCode(msg);
    return jsonResponse(false, undefined, { code, message: msg });
  }
}

export async function handleCapturePaymentIntent(
  config: PaymentsGatewayConfig,
  body: { intent_id: string; actor_user_id?: string | null },
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string } }
> {
  const { intent_id } = body;
  if (!intent_id) {
    return jsonResponse(false, undefined, {
      code: "validation_error",
      message: "intent_id required",
    });
  }

  try {
    const rpcResult = (await coreRpc(config, "capture_payment_intent", {
      p_intent_id: intent_id,
      p_actor_user_id: body.actor_user_id ?? null,
    })) as Record<string, unknown>;
    return jsonResponse(true, rpcResult);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const baseCode = mapGatewayErrorCode(msg);
    const code = msg.includes("PAYMENT_INTENT_NOT_FOUND")
      ? "intent_not_found"
      : baseCode === "rpc_error"
      ? "capture_failed"
      : baseCode;
    return jsonResponse(false, undefined, { code, message: msg });
  }
}

export async function handleMarkPixPaid(
  config: PaymentsGatewayConfig,
  body: { intent_id: string; actor_user_id: string; proof_text?: string },
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string } }
> {
  const { intent_id, actor_user_id } = body;
  if (!intent_id || !actor_user_id) {
    return jsonResponse(false, undefined, {
      code: "validation_error",
      message: "intent_id and actor_user_id required",
    });
  }

  try {
    const rpcResult = await coreRpc(config, "mark_pix_paid", {
      p_intent_id: intent_id,
      p_actor_user_id: actor_user_id,
      p_proof_text: body.proof_text ?? null,
    });
    return jsonResponse(true, rpcResult);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const baseCode = mapGatewayErrorCode(msg);
    const code = msg.includes("PAYMENT_INTENT_NOT_FOUND")
      ? "intent_not_found"
      : msg.includes("INVALID_PROVIDER")
      ? "invalid_provider"
      : baseCode === "rpc_error"
      ? "mark_paid_failed"
      : baseCode;
    return jsonResponse(false, undefined, { code, message: msg });
  }
}
