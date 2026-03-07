/**
 * Integration Gateway — porta 4320
 * Ref: CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md, CHEFIAPP_API_PUBLICA_V1_SPEC.md
 *
 * - POST /internal/events — recebe eventos; entrega a Webhooks OUT (HMAC, retry, log).
 * - GET /health — health check.
 * - /api/v1/* — API pública: auth por API Key, rate limit, rotas orders/payment/whatsapp/tasks.
 *
 * Env: PORT=4320, CORE_URL=http://localhost:3001, CORE_SERVICE_KEY=<jwt>,
 *      INTERNAL_API_TOKEN=<token para POST /internal/events>.
 *
 * Nota: O webhook Stripe (billing/subscription) deve, ao processar checkout.session.completed
 * ou payment_intent.succeeded, enviar POST /internal/events com event=payment.confirmed
 * para acionar Webhooks OUT e adapters.
 */

import * as crypto from "crypto";
import * as http from "http";
import Stripe from "stripe";
import { processProductImage } from "./imageProcessor";
import { uploadProductImage } from "./minioStorage";
import { handleMobileActivationRoute } from "./mobileActivationGateway";

const PORT = parseInt(process.env.PORT || "4320", 10);
const CORE_URL = (process.env.CORE_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);
const CORE_SERVICE_KEY =
  process.env.CORE_SERVICE_KEY || process.env.CORE_ANON_KEY || "";
const INTERNAL_API_TOKEN =
  process.env.INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SUMUP_WEBHOOK_SECRET = process.env.SUMUP_WEBHOOK_SECRET || "";
const SUMUP_ACCESS_TOKEN = process.env.SUMUP_ACCESS_TOKEN || "";
const SUMUP_API_BASE_URL = (
  process.env.SUMUP_API_BASE_URL || "https://api.sumup.com"
).replace(/\/$/, "");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5175";
const DESKTOP_LAUNCH_ACK_SECRET =
  process.env.CHEFIAPP_DESKTOP_LAUNCH_ACK_SECRET?.trim() ||
  process.env.DESKTOP_LAUNCH_ACK_SECRET?.trim() ||
  "";
const INTEGRATION_RUNTIME_AUTHORITY =
  process.env.INTEGRATION_RUNTIME_AUTHORITY || "integration-gateway";
const INTEGRATION_COMPAT_DEADLINE =
  process.env.INTEGRATION_COMPAT_DEADLINE || "2026-03-14T18:00:00+01:00";
const INTEGRATION_LEGACY_COMPAT_MODE =
  process.env.INTEGRATION_LEGACY_COMPAT_MODE !== "0";
const DESKTOP_LAUNCH_ACK_MAX_SKEW_MS = 90_000;
const ACK_SIGNATURE_HEX_RE = /^[a-f0-9]{64}$/i;

/** Origens permitidas para criar sessão de checkout (venda da plataforma). Apenas chefiapp.com em produção. */
const BILLING_ALLOWED_ORIGINS: string[] = (() => {
  const raw = process.env.BILLING_ALLOWED_ORIGINS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean);
  }
  const list = ["https://www.chefiapp.com", "https://chefiapp.com"];
  if (process.env.NODE_ENV !== "production") {
    list.push(
      "http://localhost:5175",
      "http://127.0.0.1:5175",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    );
  }
  return list;
})();

function getOriginFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return null;
  }
}

function isBillingOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return BILLING_ALLOWED_ORIGINS.includes(origin.toLowerCase());
}

/**
 * Stripe Price ID mapping: plan slug → Stripe price_xxx.
 * Reads from env vars STRIPE_PRICE_<PLAN> (uppercased).
 * When the frontend sends a plan slug (e.g. "pro") instead of a real
 * Stripe price ID ("price_xxx"), this map resolves it.
 */
const STRIPE_PRICE_MAP: Record<string, string> = {};
for (const key of Object.keys(process.env)) {
  const match = key.match(/^STRIPE_PRICE_(.+)$/i);
  if (match && process.env[key]) {
    STRIPE_PRICE_MAP[match[1].toLowerCase()] = process.env[key]!;
  }
}

/** Built-in dev defaults for plan slugs (used when no STRIPE_PRICE_* env vars are set). */
const DEV_PRICE_DEFAULTS: Record<string, string> = {
  starter: "price_dev_starter",
  pro: "price_dev_pro",
  enterprise: "price_dev_enterprise",
};

const IS_BILLING_MOCK =
  !STRIPE_SECRET_KEY || Object.keys(STRIPE_PRICE_MAP).length === 0;
if (IS_BILLING_MOCK) {
  const reason = !STRIPE_SECRET_KEY
    ? "STRIPE_SECRET_KEY not set"
    : "No STRIPE_PRICE_* env vars mapped";
  console.log(
    `[integration-gateway] ⚠️  ${reason} → billing runs in MOCK mode (local dev).`,
  );
}

/** Resolve a price identifier: if it already looks like a Stripe price ID, use it as-is;
 *  otherwise look up the plan slug in STRIPE_PRICE_MAP (with dev defaults fallback).
 *  Returns null if not found. */
function resolveStripePriceId(input: string): string | null {
  if (input.startsWith("price_")) return input;
  return (
    STRIPE_PRICE_MAP[input.toLowerCase()] ||
    (IS_BILLING_MOCK ? DEV_PRICE_DEFAULTS[input.toLowerCase()] : null) ||
    null
  );
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-Internal-Token, Authorization",
  };
}

const REST = `${CORE_URL}/rest/v1`;
const RPC = `${CORE_URL}/rpc`;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 4;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

const RATE_LIMIT_PER_MIN = 100;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function sha256Hex(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function coreHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${CORE_SERVICE_KEY}`,
    apikey: CORE_SERVICE_KEY,
  };
}

function apiError(
  error: string,
  message: string,
  details?: Record<string, unknown> | string,
): object {
  return { error, message, ...(details !== undefined ? { details } : {}) };
}

function integrationCompatHeaders(route: string): Record<string, string> {
  return {
    "x-chefiapp-compat-mode": INTEGRATION_LEGACY_COMPAT_MODE
      ? "legacy-server"
      : "disabled",
    "x-chefiapp-runtime-authority": INTEGRATION_RUNTIME_AUTHORITY,
    "x-chefiapp-compat-route": route,
    "x-chefiapp-compat-deadline": INTEGRATION_COMPAT_DEADLINE,
  };
}

function integrationCompatDisabledResponse(route: string): {
  status: number;
  json: object;
} {
  return {
    status: 410,
    json: apiError(
      "compatibility_disabled",
      "Legacy integration compatibility route is disabled",
      {
        route,
        runtime_authority: INTEGRATION_RUNTIME_AUTHORITY,
        compat_deadline: INTEGRATION_COMPAT_DEADLINE,
      },
    ),
  };
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function extractBase64Payload(input: string): string {
  if (input.includes(",")) {
    return input.split(",").pop() || "";
  }
  return input;
}

// ---------------------------------------------------------------------------
// Desktop launch ACK store (chefiapp:// TPV/KDS)
// ---------------------------------------------------------------------------

type DesktopLaunchAck = {
  /** Nonce gerado pelo Admin ao emitir o deep link. */
  nonce: string;
  /** Módulo operacional que pediu o launch. */
  moduleId: "tpv" | "kds";
  /** Terminal pareado no Desktop (id do gm_terminals), se disponível. */
  deviceId: string | null;
  /** Restaurante ao qual o terminal pertence, se conhecido. */
  restaurantId: string | null;
  /**
   * Flag enviada pelo Desktop indicando se o app é o binário empacotado
   * (app.isPackaged === true). Usada pelo Admin como prova "B" de instalação.
   */
  isPackaged: boolean;
  /**
   * Versão do Desktop (app.getVersion()) no momento do ACK, para debug/QA.
   */
  appVersion: string | null;
  /**
   * Timestamp ISO enviado pelo Desktop quando o ACK foi emitido
   * (lado Electron). Campo opcional; usado apenas para diagnóstico.
   */
  launchAckSentAt: string | null;
  /**
   * Timestamp ISO do último deep link recebido no Desktop, se o shell
   * tiver essa informação nos diagnostics. Campo opcional.
   */
  lastDeepLinkReceivedAt: string | null;
  /**
   * Timestamp (epoch ms) em que o gateway recebeu e registou o ACK.
   * Este campo governa o TTL no in-memory store.
   */
  receivedAt: number;
};

const DESKTOP_LAUNCH_ACK_TTL_MS = 60_000;
const desktopLaunchAckStore = new Map<string, DesktopLaunchAck>();

function setDesktopLaunchAck(entry: DesktopLaunchAck): void {
  desktopLaunchAckStore.set(entry.nonce, entry);
}

function getDesktopLaunchAck(
  nonce: string,
): { found: false } | { found: true; ack: DesktopLaunchAck } {
  const existing = desktopLaunchAckStore.get(nonce);
  if (!existing) return { found: false };
  if (Date.now() - existing.receivedAt > DESKTOP_LAUNCH_ACK_TTL_MS) {
    desktopLaunchAckStore.delete(nonce);
    return { found: false };
  }
  return { found: true, ack: existing };
}

async function handleDesktopLaunchAckPost(
  body: string,
  headers: http.IncomingHttpHeaders,
): Promise<{ status: number; json: object }> {
  let parsed: {
    nonce?: string;
    moduleId?: string;
    deviceId?: string | null;
    restaurantId?: string | null;
    isPackaged?: boolean;
    appVersion?: string | null;
    launchAckSentAt?: string | null;
    lastDeepLinkReceivedAt?: string | null;
  };
  try {
    parsed = JSON.parse(body || "{}") as typeof parsed;
  } catch {
    return {
      status: 400,
      json: apiError("invalid_json", "Invalid JSON body"),
    };
  }

  const nonce = parsed.nonce?.trim();
  const moduleId = parsed.moduleId?.trim();
  if (!nonce || (moduleId !== "tpv" && moduleId !== "kds")) {
    return {
      status: 400,
      json: apiError(
        "validation_error",
        "nonce and moduleId(tpv|kds) required",
      ),
    };
  }

  if (DESKTOP_LAUNCH_ACK_SECRET) {
    const tsHeader = headers["x-chefiapp-ack-ts"];
    const sigHeader = headers["x-chefiapp-ack-signature"];
    const tsValue = Array.isArray(tsHeader) ? tsHeader[0] : tsHeader;
    const sigValue = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

    if (!tsValue || !sigValue) {
      return {
        status: 401,
        json: apiError(
          "ack_signature_required",
          "Desktop launch ACK signature headers are required",
        ),
      };
    }

    const ackTs = Number.parseInt(String(tsValue), 10);
    if (!Number.isFinite(ackTs)) {
      return {
        status: 401,
        json: apiError("ack_signature_invalid", "Invalid ACK timestamp"),
      };
    }

    const signatureRaw = String(sigValue).trim();
    if (!ACK_SIGNATURE_HEX_RE.test(signatureRaw)) {
      return {
        status: 401,
        json: apiError("ack_signature_invalid", "Invalid ACK signature"),
      };
    }

    const ageMs = Math.abs(Date.now() - ackTs);
    if (ageMs > DESKTOP_LAUNCH_ACK_MAX_SKEW_MS) {
      return {
        status: 401,
        json: apiError("ack_signature_expired", "ACK timestamp expired"),
      };
    }

    const material = `${nonce}.${moduleId}.${ackTs}`;
    const expectedSig = crypto
      .createHmac("sha256", DESKTOP_LAUNCH_ACK_SECRET)
      .update(material, "utf8")
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSig, "hex");
    const gotBuf = Buffer.from(signatureRaw, "hex");
    if (
      expectedBuf.length !== gotBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, gotBuf)
    ) {
      return {
        status: 401,
        json: apiError("ack_signature_invalid", "Invalid ACK signature"),
      };
    }
  }

  const isPackaged =
    typeof parsed.isPackaged === "boolean" ? parsed.isPackaged : false;
  const appVersionRaw =
    typeof parsed.appVersion === "string" ? parsed.appVersion.trim() : "";
  const launchAckSentAtRaw =
    typeof parsed.launchAckSentAt === "string"
      ? parsed.launchAckSentAt.trim()
      : "";
  const lastDeepLinkReceivedAtRaw =
    typeof parsed.lastDeepLinkReceivedAt === "string"
      ? parsed.lastDeepLinkReceivedAt.trim()
      : "";

  setDesktopLaunchAck({
    nonce,
    moduleId,
    deviceId: parsed.deviceId?.trim() || null,
    restaurantId: parsed.restaurantId?.trim() || null,
    isPackaged,
    appVersion: appVersionRaw || null,
    launchAckSentAt: launchAckSentAtRaw || null,
    lastDeepLinkReceivedAt: lastDeepLinkReceivedAtRaw || null,
    receivedAt: Date.now(),
  });

  return {
    status: 202,
    json: {
      recorded: true,
      nonce,
      moduleId,
    },
  };
}

function handleDesktopLaunchAckGet(nonce: string): {
  status: number;
  json: object;
} {
  if (!nonce) {
    return {
      status: 400,
      json: apiError("validation_error", "nonce required"),
    };
  }
  const result = getDesktopLaunchAck(nonce);
  if (!result.found) {
    // 200 + found:false (not 404) — avoids red console noise from the
    // expected polling cycle. The client already checks data.found.
    return {
      status: 200,
      json: { found: false },
    };
  }

  const { ack } = result;
  return {
    status: 200,
    json: {
      found: true,
      nonce: ack.nonce,
      moduleId: ack.moduleId,
      deviceId: ack.deviceId,
      restaurantId: ack.restaurantId,
      isPackaged: ack.isPackaged,
      appVersion: ack.appVersion,
      launchAckSentAt: ack.launchAckSentAt,
      lastDeepLinkReceivedAt: ack.lastDeepLinkReceivedAt,
      receivedAt: ack.receivedAt,
    },
  };
}

// ---------------------------------------------------------------------------
// POST /internal/product-images
// ---------------------------------------------------------------------------
async function handleProductImageUpload(
  body: string,
): Promise<{ status: number; json: object }> {
  let parsed: {
    restaurant_id?: string;
    product_id?: string;
    mime?: string;
    data_base64?: string;
  };
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    return { status: 400, json: apiError("invalid_json", "Invalid JSON body") };
  }

  const restaurantId = parsed.restaurant_id;
  const productId = parsed.product_id;
  const mime = parsed.mime || "image/jpeg";
  const dataBase64 = parsed.data_base64;

  if (!restaurantId || !productId || !dataBase64) {
    return {
      status: 400,
      json: apiError(
        "bad_request",
        "restaurant_id, product_id, data_base64 required",
      ),
    };
  }

  const raw = extractBase64Payload(dataBase64);
  let inputBuffer: Buffer;
  try {
    inputBuffer = Buffer.from(raw, "base64");
  } catch {
    return {
      status: 400,
      json: apiError("bad_request", "Invalid base64 payload"),
    };
  }

  try {
    const processed = await processProductImage(inputBuffer);
    const imageUrl = await uploadProductImage({
      restaurantId,
      productId,
      body: processed,
      contentType: "image/webp",
    });

    if (CORE_SERVICE_KEY) {
      await fetch(
        `${REST}/gm_products?id=eq.${encodeURIComponent(
          productId,
        )}&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
        {
          method: "PATCH",
          headers: coreHeaders(),
          body: JSON.stringify({
            custom_image_url: imageUrl,
            updated_at: new Date().toISOString(),
          }),
        },
      );
    }

    return { status: 200, json: { image_url: imageUrl, mime: "image/webp" } };
  } catch (err) {
    return {
      status: 500,
      json: apiError("upload_failed", "Failed to process or upload image", {
        detail: err instanceof Error ? err.message : String(err),
        mime,
      }),
    };
  }
}

// ---------------------------------------------------------------------------
// Webhook OUT payload (spec §3.1)
// ---------------------------------------------------------------------------
interface WebhookOutPayload {
  id: string;
  event: string;
  restaurant_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          text?: { body?: string };
          type?: string;
          button?: { text?: string };
        }>;
      };
    }>;
  }>;
};

function buildWebhookPayload(
  deliveryId: string,
  event: string,
  restaurantId: string,
  payload: Record<string, unknown>,
): WebhookOutPayload {
  return {
    id: deliveryId,
    event,
    restaurant_id: restaurantId,
    timestamp: new Date().toISOString(),
    payload,
  };
}

function hmacSha256Hex(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------
// Core API (PostgREST)
// ---------------------------------------------------------------------------
async function fetchWebhookConfigs(restaurantId: string): Promise<
  Array<{
    id: string;
    url: string;
    secret: string;
    events: string[];
    enabled: boolean;
  }>
> {
  if (!CORE_SERVICE_KEY) return [];
  const url = `${REST}/webhook_out_config?restaurant_id=eq.${restaurantId}&enabled=eq.true&select=id,url,secret,events,enabled`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CORE_SERVICE_KEY}`,
      apikey: CORE_SERVICE_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows)
    ? rows.map(
        (r: {
          id: string;
          url: string;
          secret: string;
          events: unknown;
          enabled: boolean;
        }) => ({
          id: r.id,
          url: r.url,
          secret: r.secret,
          events: Array.isArray(r.events) ? r.events : [],
          enabled: r.enabled,
        }),
      )
    : [];
}

async function insertDeliveryLog(entry: {
  delivery_id: string;
  webhook_config_id: string;
  restaurant_id: string;
  event: string;
  url: string;
  status_code: number | null;
  attempt: number;
  attempted_at: string;
  next_retry_at: string | null;
  error_message: string | null;
}): Promise<void> {
  if (!CORE_SERVICE_KEY) return;
  const res = await fetch(`${REST}/webhook_out_delivery_log`, {
    method: "POST",
    headers: { ...coreHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    console.error(
      "[integration-gateway] Failed to insert delivery log:",
      res.status,
      await res.text(),
    );
  }
}

// ---------------------------------------------------------------------------
// API Key auth (API v1)
// ---------------------------------------------------------------------------
async function lookupApiKey(
  keyHash: string,
): Promise<{ id: string; restaurant_id: string } | null> {
  if (!CORE_SERVICE_KEY) return null;
  const res = await fetch(
    `${REST}/api_keys?key_hash=eq.${encodeURIComponent(
      keyHash,
    )}&select=id,restaurant_id`,
    { headers: coreHeaders() },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return row ? { id: row.id, restaurant_id: row.restaurant_id } : null;
}

async function updateApiKeyLastUsed(id: string): Promise<void> {
  if (!CORE_SERVICE_KEY) return;
  await fetch(`${REST}/api_keys?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: coreHeaders(),
    body: JSON.stringify({ last_used_at: new Date().toISOString() }),
  });
}

function checkRateLimit(keyId: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60_000;
  let entry = rateLimitMap.get(keyId);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitMap.set(keyId, entry);
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_PER_MIN) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Deliver one webhook (with retries)
// ---------------------------------------------------------------------------
async function deliverOne(
  config: { id: string; url: string; secret: string; events: string[] },
  restaurantId: string,
  webhookPayload: WebhookOutPayload,
): Promise<void> {
  const body = JSON.stringify(webhookPayload);
  const signature = hmacSha256Hex(config.secret, body);
  const deliveryId = webhookPayload.id;
  const event = webhookPayload.event;
  const url = config.url;

  let lastStatus: number | null = null;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptedAt = new Date().toISOString();
    let nextRetryAt: string | null = null;
    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_BACKOFF_MS[attempt - 1] ?? 2000;
      const next = new Date(Date.now() + delay);
      nextRetryAt = next.toISOString();
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ChefIApp-Signature": `sha256=${signature}`,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      lastStatus = res.status;

      await insertDeliveryLog({
        delivery_id: deliveryId,
        webhook_config_id: config.id,
        restaurant_id: restaurantId,
        event,
        url,
        status_code: res.status,
        attempt,
        attempted_at: attemptedAt,
        next_retry_at: nextRetryAt,
        error_message: res.ok ? null : (await res.text()).slice(0, 500),
      });

      if (res.ok) return;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return; // no retry
    } catch (err: unknown) {
      lastStatus = null;
      lastError = err instanceof Error ? err.message : String(err);
      await insertDeliveryLog({
        delivery_id: deliveryId,
        webhook_config_id: config.id,
        restaurant_id: restaurantId,
        event,
        url,
        status_code: null,
        attempt,
        attempted_at: attemptedAt,
        next_retry_at: nextRetryAt,
        error_message: lastError?.slice(0, 500) ?? null,
      });
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_BACKOFF_MS[attempt - 1] ?? 2000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/webhook/sumup — SumUp payment webhook (no API key)
// ---------------------------------------------------------------------------
async function handleSumUpWebhook(
  bodyStr: string,
  signature: string | undefined,
): Promise<{ status: number; json: object }> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bodyStr || "{}") as Record<string, unknown>;
  } catch {
    return {
      status: 400,
      json: { error: "invalid_json", message: "Invalid JSON body" },
    };
  }
  if (SUMUP_WEBHOOK_SECRET && signature) {
    const expected = "sha256=" + hmacSha256Hex(SUMUP_WEBHOOK_SECRET, bodyStr);
    if (signature !== expected) {
      return {
        status: 401,
        json: apiError("unauthorized", "Invalid webhook signature"),
      };
    }
  }
  const eventId =
    (payload.paymentId as string) ||
    (payload.event_id as string) ||
    (payload.id as string) ||
    `sumup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const eventType = (payload.status as string)
    ? `payment.${String(payload.status).toLowerCase()}`
    : (payload.event_type as string) || "payment.notification";
  if (!CORE_SERVICE_KEY) {
    return {
      status: 202,
      json: {
        received: true,
        message: "CORE_SERVICE_KEY not set, event logged only",
        event_id: eventId,
      },
    };
  }
  try {
    const res = await fetch(`${RPC}/process_webhook_event`, {
      method: "POST",
      headers: coreHeaders(),
      body: JSON.stringify({
        p_provider: "sumup",
        p_event_type: eventType,
        p_event_id: eventId,
        p_payload: payload,
        p_signature: signature || null,
      }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
    }[];
    const first = Array.isArray(data) ? data[0] : data;
    if (!res.ok) {
      return {
        status: res.status,
        json: apiError(
          "webhook_failed",
          first?.message || (await res.text()) || "RPC failed",
        ),
      };
    }
    return {
      status: 202,
      json: {
        received: true,
        success: first?.success ?? true,
        event_id: eventId,
        message: first?.message ?? "Webhook event recorded",
      },
    };
  } catch (e) {
    console.error("[integration-gateway] SumUp webhook", e);
    return {
      status: 500,
      json: apiError(
        "internal_error",
        "Failed to process webhook",
        e instanceof Error ? e.message : String(e),
      ),
    };
  }
}

// ---------------------------------------------------------------------------
// SumUp Checkout API (payment routes use Bearer INTERNAL_API_TOKEN)
// ---------------------------------------------------------------------------
interface SumUpCheckoutPayload {
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code?: string;
  description?: string;
  return_url?: string;
  payment_type?: string;
  country?: string;
}

interface SumUpCheckoutResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  checkout_reference?: string;
  merchant_code?: string;
  date?: string;
  [key: string]: unknown;
}

function normalizeCheckoutAmount(value: number): number {
  return Number(Number(value).toFixed(2));
}

async function createSumUpCheckoutApi(
  payload: SumUpCheckoutPayload,
): Promise<SumUpCheckoutResponse> {
  if (!SUMUP_ACCESS_TOKEN) {
    throw new Error("SUMUP_ACCESS_TOKEN is not configured");
  }
  const body = JSON.stringify({
    checkout_reference: payload.checkout_reference,
    amount: normalizeCheckoutAmount(payload.amount),
    currency: payload.currency,
    ...(payload.merchant_code && { merchant_code: payload.merchant_code }),
    ...(payload.description && { description: payload.description }),
    ...(payload.return_url && { return_url: payload.return_url }),
    ...(payload.payment_type && { payment_type: payload.payment_type }),
    ...(payload.country && { country: payload.country }),
  });
  const res = await fetch(`${SUMUP_API_BASE_URL}/v0.1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUMUP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg: string;
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      msg = j.message || j.error || text;
    } catch {
      msg = text || res.statusText;
    }
    throw new Error(`SumUp API: ${res.status} ${msg}`);
  }
  return JSON.parse(text || "{}") as SumUpCheckoutResponse;
}

async function getSumUpCheckoutApi(
  checkoutId: string,
): Promise<SumUpCheckoutResponse> {
  if (!SUMUP_ACCESS_TOKEN) {
    throw new Error("SUMUP_ACCESS_TOKEN is not configured");
  }
  const res = await fetch(
    `${SUMUP_API_BASE_URL}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUMUP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    let msg: string;
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      msg = j.message || j.error || text;
    } catch {
      msg = text || res.statusText;
    }
    throw new Error(`SumUp API: ${res.status} ${msg}`);
  }
  return JSON.parse(text || "{}") as SumUpCheckoutResponse;
}

function verifyPaymentInternalToken(req: http.IncomingMessage): boolean {
  const token =
    (req.headers["x-internal-token"] as string) ||
    (req.headers["authorization"] as string)
      ?.replace(/^Bearer\s+/i, "")
      ?.trim();
  return !!token && token === INTERNAL_API_TOKEN;
}

// ---------------------------------------------------------------------------
// POST /internal/events
// ---------------------------------------------------------------------------
interface InternalEventBody {
  event: string;
  restaurant_id: string;
  payload: Record<string, unknown>;
}

async function handleInternalEvents(
  body: string,
): Promise<{ status: number; json: object }> {
  let parsed: InternalEventBody;
  try {
    parsed = JSON.parse(body) as InternalEventBody;
  } catch {
    return {
      status: 400,
      json: { error: "invalid_json", message: "Invalid JSON body" },
    };
  }
  const { event, restaurant_id, payload } = parsed;
  if (
    !event ||
    typeof event !== "string" ||
    !restaurant_id ||
    typeof restaurant_id !== "string"
  ) {
    return {
      status: 400,
      json: {
        error: "bad_request",
        message: "event and restaurant_id required",
      },
    };
  }

  const configs = await fetchWebhookConfigs(restaurant_id);
  const sendAll = configs.filter(
    (c) => c.events.length === 0 || c.events.includes(event),
  );

  const deliveryId = `wh_evt_${crypto.randomUUID()}`;
  const webhookPayload = buildWebhookPayload(
    deliveryId,
    event,
    restaurant_id,
    payload ?? {},
  );

  await Promise.all(
    sendAll.map((c) => deliverOne(c, restaurant_id, webhookPayload)),
  );

  return {
    status: 202,
    json: {
      accepted: true,
      delivery_id: deliveryId,
      endpoints: sendAll.length,
    },
  };
}

// ---------------------------------------------------------------------------
// API v1 handlers
// ---------------------------------------------------------------------------
async function emitEventInternal(
  event: string,
  restaurantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const configs = await fetchWebhookConfigs(restaurantId);
  const sendAll = configs.filter(
    (c) => c.events.length === 0 || c.events.includes(event),
  );
  const deliveryId = `wh_evt_${crypto.randomUUID()}`;
  const webhookPayload = buildWebhookPayload(
    deliveryId,
    event,
    restaurantId,
    payload,
  );
  await Promise.all(
    sendAll.map((c) => deliverOne(c, restaurantId, webhookPayload)),
  );
}

async function handleApiV1(
  method: string,
  path: string,
  bodyStr: string,
  auth: { keyId: string; restaurantId: string },
  reqHeaders?: Record<string, string | string[] | undefined>,
): Promise<{ status: number; json: object; headers?: Record<string, string> }> {
  const { restaurantId } = auth;

  // POST /api/v1/orders
  if (path === "/api/v1/orders" && method === "POST") {
    let body: {
      items?: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
      }>;
      table_id?: string;
      source?: string;
    };
    try {
      body = JSON.parse(bodyStr || "{}") as typeof body;
    } catch {
      return {
        status: 400,
        json: apiError("validation_error", "Invalid JSON", "Body must be JSON"),
      };
    }
    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return {
        status: 400,
        json: apiError(
          "validation_error",
          "items required",
          "items must be a non-empty array",
        ),
      };
    }
    const pItems = items.map(
      (it: {
        product_id?: string;
        quantity?: number;
        unit_price?: number;
      }) => ({
        product_id: it.product_id,
        quantity: it.quantity ?? 1,
        unit_price: it.unit_price ?? 0,
      }),
    );
    const syncMetadata: Record<string, unknown> = {
      origin: body?.source ?? "api",
    };
    if (body?.table_id) syncMetadata.table_id = body.table_id;
    try {
      const res = await fetch(`${RPC}/create_order_atomic`, {
        method: "POST",
        headers: coreHeaders(),
        body: JSON.stringify({
          p_restaurant_id: restaurantId,
          p_items: pItems,
          p_payment_method: "cash",
          p_sync_metadata: syncMetadata,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return {
          status: 400,
          json: apiError("validation_error", "Order creation failed", t),
        };
      }
      const data = (await res.json()) as { id?: string };
      const orderId = data?.id ?? data;
      await emitEventInternal("order.created", restaurantId, {
        orderId: String(orderId),
        source: "online",
        items: pItems.map(
          (it: {
            product_id?: string;
            quantity: number;
            unit_price: number;
          }) => ({
            id: it.product_id ?? "",
            name: "",
            quantity: it.quantity,
            priceCents: it.unit_price,
          }),
        ),
        totalCents: pItems.reduce(
          (s: number, it: { quantity: number; unit_price: number }) =>
            s + it.quantity * it.unit_price,
          0,
        ),
        createdAt: Date.now(),
      });
      return { status: 201, json: { orderId: String(orderId), status: "new" } };
    } catch (e) {
      console.error("[integration-gateway] create order", e);
      return {
        status: 500,
        json: apiError("internal_error", "Internal server error", String(e)),
      };
    }
  }

  // PATCH /api/v1/orders/:orderId
  const patchOrderMatch = path.match(/^\/api\/v1\/orders\/([^/]+)$/);
  if (patchOrderMatch && method === "PATCH") {
    const orderId = patchOrderMatch[1];
    let body: { status?: string };
    try {
      body = JSON.parse(bodyStr || "{}") as { status?: string };
    } catch {
      return {
        status: 400,
        json: apiError("validation_error", "Invalid JSON", "Body must be JSON"),
      };
    }
    const status = body?.status;
    const statusMap: Record<string, string> = {
      new: "OPEN",
      preparing: "PREPARING",
      ready: "READY",
      served: "READY",
      paid: "CLOSED",
      cancelled: "CANCELLED",
    };
    const coreStatus = status ? statusMap[status.toLowerCase()] : null;
    if (!coreStatus) {
      return {
        status: 400,
        json: apiError(
          "validation_error",
          "status required",
          "status must be one of: new, preparing, ready, served, paid, cancelled",
        ),
      };
    }
    try {
      const res = await fetch(
        `${REST}/gm_orders?id=eq.${encodeURIComponent(
          orderId,
        )}&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
        {
          method: "PATCH",
          headers: coreHeaders(),
          body: JSON.stringify({ status: coreStatus }),
        },
      );
      if (!res.ok)
        return {
          status: 404,
          json: apiError("not_found", "Order not found", { orderId }),
        };
      await emitEventInternal("order.updated", restaurantId, {
        orderId,
        status,
        updatedAt: Date.now(),
      });
      return { status: 200, json: { orderId, status } };
    } catch (e) {
      console.error("[integration-gateway] update order", e);
      return {
        status: 500,
        json: apiError("internal_error", "Internal server error", String(e)),
      };
    }
  }

  // POST /api/v1/orders/:orderId/payment
  const paymentOrderMatch = path.match(/^\/api\/v1\/orders\/([^/]+)\/payment$/);
  if (paymentOrderMatch && method === "POST") {
    const orderId = paymentOrderMatch[1];
    let body: {
      amountCents?: number;
      paymentMethod?: string;
      externalId?: string;
    };
    try {
      body = JSON.parse(bodyStr || "{}") as typeof body;
    } catch {
      return {
        status: 400,
        json: apiError("validation_error", "Invalid JSON", "Body must be JSON"),
      };
    }
    await emitEventInternal("payment.confirmed", restaurantId, {
      orderId,
      amountCents: body?.amountCents,
      confirmedAt: Date.now(),
      metadata: body?.externalId ? { externalId: body.externalId } : undefined,
    });
    return { status: 200, json: { orderId, paymentStatus: "confirmed" } };
  }

  // POST /api/v1/integrations/whatsapp/incoming (Meta webhook: valida assinatura, emite order.created)
  if (path === "/api/v1/integrations/whatsapp/incoming" && method === "POST") {
    const appSecret = process.env.WHATSAPP_APP_SECRET || "";
    let bodyObj: WhatsAppWebhookBody;
    try {
      bodyObj = JSON.parse(bodyStr || "{}") as typeof bodyObj;
    } catch {
      return {
        status: 400,
        json: apiError("validation_error", "Invalid JSON body"),
      };
    }
    if (appSecret) {
      const raw = reqHeaders?.["x-hub-signature-256"];
      const sig =
        typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
      if (!sig || !sig.startsWith("sha256=")) {
        return {
          status: 401,
          json: apiError(
            "unauthorized",
            "Missing or invalid X-Hub-Signature-256",
          ),
        };
      }
      const expected = "sha256=" + hmacSha256Hex(appSecret, bodyStr);
      if (sig !== expected) {
        return {
          status: 401,
          json: apiError("unauthorized", "Invalid webhook signature"),
        };
      }
    }
    const entry = bodyObj?.entry?.[0];
    const value = entry?.changes?.[0]?.value;
    const messages = value?.messages;
    if (messages?.length) {
      const msg = messages[0];
      const from = msg.from;
      const text = msg.text?.body ?? (msg as any).button?.text ?? "";
      const orderId = crypto.randomUUID();
      const payload = {
        orderId,
        source: "whatsapp" as const,
        items: [
          {
            id: "wa-1",
            name: text.slice(0, 200) || "Pedido WhatsApp",
            quantity: 1,
            priceCents: 0,
          },
        ],
        totalCents: 0,
        customerPhone: from,
        createdAt: Date.now(),
      };
      await emitEventInternal("order.created", restaurantId, payload);
    }
    return { status: 200, json: { received: true } };
  }

  // POST /api/v1/tasks
  if (path === "/api/v1/tasks" && method === "POST") {
    let body: {
      title?: string;
      description?: string;
      priority?: string;
      assigneeRole?: string;
    };
    try {
      body = JSON.parse(bodyStr || "{}") as typeof body;
    } catch {
      return {
        status: 400,
        json: apiError("validation_error", "Invalid JSON", "Body must be JSON"),
      };
    }
    if (!body?.title || typeof body.title !== "string") {
      return {
        status: 400,
        json: apiError(
          "validation_error",
          "title required",
          "title must be a non-empty string",
        ),
      };
    }
    const taskId = crypto.randomUUID();
    try {
      const res = await fetch(`${REST}/gm_tasks`, {
        method: "POST",
        headers: { ...coreHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          title: body.title,
          description: body.description ?? null,
          priority: body.priority ?? null,
          status: "OPEN",
        }),
      });
      if (!res.ok) {
        const tasksTableMissing = res.status === 404 || res.status === 406;
        if (tasksTableMissing) {
          await emitEventInternal("task.created", restaurantId, {
            taskId,
            title: body.title,
            description: body.description,
            priority: body.priority,
            assigneeRole: body.assigneeRole,
            createdAt: Date.now(),
          });
          return { status: 201, json: { taskId } };
        }
        return {
          status: 500,
          json: apiError(
            "internal_error",
            "Failed to create task",
            await res.text(),
          ),
        };
      }
      const created = await res.json();
      const id = (Array.isArray(created) ? created[0] : created)?.id ?? taskId;
      await emitEventInternal("task.created", restaurantId, {
        taskId: String(id),
        title: body.title,
        description: body.description,
        priority: body.priority,
        assigneeRole: body.assigneeRole,
        createdAt: Date.now(),
      });
      return { status: 201, json: { taskId: String(id) } };
    } catch (e) {
      console.error("[integration-gateway] create task", e);
      return {
        status: 500,
        json: apiError("internal_error", "Internal server error", String(e)),
      };
    }
  }

  return { status: 404, json: apiError("not_found", "Not found", path) };
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const pathRaw = req.url?.split("?")[0] ?? "/";
  const path = pathRaw.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  const ipAddress =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    req.socket.remoteAddress ||
    "unknown";

  if (method === "OPTIONS") {
    res.writeHead(204, { ...corsHeaders(), "Content-Length": "0" });
    res.end();
    return;
  }

  try {
    if ((path === "/" || path === "") && method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          service: "ChefIApp-POS-CORE",
          gateway: "integration-gateway",
          health: "/health",
        }),
      );
      return;
    }

    if (path === "/favicon.ico" && method === "GET") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (path === "/health" && method === "GET") {
      const compat = integrationCompatHeaders("/health");
      res.writeHead(200, {
        "Content-Type": "application/json",
        ...compat,
      });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "integration-gateway",
          compat_mode: INTEGRATION_LEGACY_COMPAT_MODE,
          runtime_authority: INTEGRATION_RUNTIME_AUTHORITY,
          compat_deadline: INTEGRATION_COMPAT_DEADLINE,
        }),
      );
      return;
    }

    // Desktop launch ACKs (chefiapp:// TPV/KDS)
    if (path === "/desktop/launch-acks" && method === "POST") {
      const body = await parseBody(req);
      const { status, json } = await handleDesktopLaunchAckPost(
        body,
        req.headers,
      );
      res.writeHead(status, {
        "Content-Type": "application/json",
        ...corsHeaders(),
      });
      res.end(JSON.stringify(json));
      return;
    }

    const desktopAckMatch = path.match(/^\/desktop\/launch-acks\/([^/]+)$/);
    if (desktopAckMatch && method === "GET") {
      const nonce = desktopAckMatch[1];
      const { status, json } = handleDesktopLaunchAckGet(nonce);
      res.writeHead(status, {
        "Content-Type": "application/json",
        ...corsHeaders(),
      });
      res.end(JSON.stringify(json));
      return;
    }

    if (path.startsWith("/mobile/")) {
      const body = method === "GET" ? "" : await parseBody(req);
      const pathNorm = path.replace(/\/+$/, "") || path;
      console.log(
        `[integration-gateway] /mobile/* ${method} ${pathNorm} (handling...)`,
      );
      const mobileResult = await handleMobileActivationRoute({
        method,
        path: pathNorm,
        headers: req.headers,
        body,
        ip: ipAddress,
      });

      if (mobileResult.handled) {
        console.log(`[integration-gateway] /mobile/* → ${mobileResult.status}`);
        res.writeHead(mobileResult.status, {
          "Content-Type": "application/json",
          ...corsHeaders(),
        });
        res.end(JSON.stringify(mobileResult.json));
        return;
      }
      console.log(
        `[integration-gateway] /mobile/* 404 (no handler for ${method} ${pathNorm})`,
      );
      res.writeHead(404, {
        "Content-Type": "application/json",
        ...corsHeaders(),
      });
      res.end(
        JSON.stringify({
          error: "not_found",
          message: "Mobile route not found",
          path: pathNorm,
        }),
      );
      return;
    }

    if (path === "/internal/events" && method === "POST") {
      const token =
        req.headers["x-internal-token"] ||
        req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
      if (token !== INTERNAL_API_TOKEN) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      const body = await parseBody(req);
      const { status, json } = await handleInternalEvents(body);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(json));
      return;
    }

    if (path === "/internal/product-images" && method === "POST") {
      const token =
        req.headers["x-internal-token"] ||
        req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
      if (token !== INTERNAL_API_TOKEN) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      const body = await parseBody(req);
      const { status, json } = await handleProductImageUpload(body);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(json));
      return;
    }

    if (
      path === "/internal/billing/create-checkout-session" &&
      method === "POST"
    ) {
      const cors = corsHeaders();
      const token =
        req.headers["x-internal-token"] ||
        req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
      if (token !== INTERNAL_API_TOKEN) {
        res.writeHead(401, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      // In mock mode (no STRIPE_SECRET_KEY), we skip the Stripe call and return a mock URL.
      // This allows the full billing UI flow to work locally for dev/testing.
      let body: {
        price_id?: string;
        success_url?: string;
        cancel_url?: string;
      };
      try {
        body = JSON.parse((await parseBody(req)) || "{}") as typeof body;
      } catch {
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "validation_error",
            message: "Invalid JSON body",
          }),
        );
        return;
      }
      const rawPriceId = body?.price_id?.trim();
      const successUrl = body?.success_url?.trim();
      const cancelUrl = body?.cancel_url?.trim();
      if (!rawPriceId || !successUrl || !cancelUrl) {
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "validation_error",
            message: "price_id, success_url and cancel_url are required",
          }),
        );
        return;
      }
      const successOrigin = getOriginFromUrl(successUrl);
      const cancelOrigin = getOriginFromUrl(cancelUrl);
      if (
        !isBillingOriginAllowed(successOrigin) ||
        !isBillingOriginAllowed(cancelOrigin)
      ) {
        res.writeHead(403, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "billing_not_allowed",
            message:
              "A venda da plataforma (checkout) só está disponível em chefiapp.com. Acesso a partir desta origem não permitido.",
          }),
        );
        return;
      }
      // Resolve plan slug → Stripe price ID
      const priceId = resolveStripePriceId(rawPriceId);
      if (!priceId) {
        console.error(
          `[integration-gateway] No such price: '${rawPriceId}'.`,
          `Set STRIPE_PRICE_${rawPriceId.toUpperCase()} env var or pass a Stripe price_xxx ID.`,
          `Available mappings: ${JSON.stringify(STRIPE_PRICE_MAP)}`,
        );
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "no_such_price",
            message: `No such price: '${rawPriceId}'. Set STRIPE_PRICE_${rawPriceId.toUpperCase()} env var or use the billing_plans.stripe_price_id from the DB.`,
          }),
        );
        return;
      }
      if (IS_BILLING_MOCK) {
        // MOCK MODE: return a fake checkout URL that redirects to success page
        const mockSessionId = `cs_mock_${Date.now()}_${rawPriceId}`;
        console.log(
          `[integration-gateway] MOCK checkout session: ${mockSessionId} (plan: ${rawPriceId}, price: ${priceId})`,
        );
        res.writeHead(200, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            url: successUrl,
            session_id: mockSessionId,
            mock: true,
          }),
        );
      } else {
        try {
          const stripe = new Stripe(STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
          });
          res.writeHead(200, { ...cors, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              url: session.url || "",
              session_id: session.id,
            }),
          );
        } catch (e) {
          console.error(
            "[integration-gateway] create-checkout-session",
            safeErrorMessage(e),
          );
          res.writeHead(500, { ...cors, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "stripe_error",
              message: safeErrorMessage(e) || "Stripe checkout failed",
            }),
          );
        }
      }
      return;
    }

    if (path === "/api/v1/webhook/sumup" && method === "POST") {
      if (!INTEGRATION_LEGACY_COMPAT_MODE) {
        const compat = integrationCompatHeaders("/api/v1/webhook/sumup");
        const { status, json } = integrationCompatDisabledResponse(
          "/api/v1/webhook/sumup",
        );
        res.writeHead(status, {
          "Content-Type": "application/json",
          ...corsHeaders(),
          ...compat,
        });
        res.end(JSON.stringify(json));
        return;
      }
      const bodyStr = await parseBody(req);
      const signature =
        (req.headers["x-sumup-signature"] as string) || undefined;
      const { status, json } = await handleSumUpWebhook(bodyStr, signature);
      res.writeHead(status, {
        "Content-Type": "application/json",
        ...corsHeaders(),
        ...integrationCompatHeaders("/api/v1/webhook/sumup"),
      });
      res.end(JSON.stringify(json));
      return;
    }

    // Payment routes: Bearer INTERNAL_API_TOKEN (before API key /api/v1/*)
    // Contract compatibility during MRP-001: accept both canonical and legacy PIX paths.
    if (
      (path === "/api/v1/payment/pix/checkout" ||
        path === "/api/v1/payment/pix/br/checkout") &&
      method === "POST"
    ) {
      if (!INTEGRATION_LEGACY_COMPAT_MODE) {
        const compat = integrationCompatHeaders(path);
        const { status, json } = integrationCompatDisabledResponse(path);
        res.writeHead(status, {
          "Content-Type": "application/json",
          ...corsHeaders(),
          ...compat,
        });
        res.end(JSON.stringify(json));
        return;
      }
      const cors = corsHeaders();
      if (!verifyPaymentInternalToken(req)) {
        res.writeHead(401, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      if (!SUMUP_ACCESS_TOKEN) {
        res.writeHead(503, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "service_unavailable",
            message: "PIX/SumUp not configured (SUMUP_ACCESS_TOKEN)",
          }),
        );
        return;
      }
      let body: {
        order_id?: string;
        amount?: number;
        merchant_code?: string;
        description?: string;
      };
      try {
        body = JSON.parse((await parseBody(req)) || "{}") as typeof body;
      } catch {
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "validation_error",
            message: "Invalid JSON body",
          }),
        );
        return;
      }
      const orderId = body?.order_id?.trim();
      const amount = typeof body?.amount === "number" ? body.amount : NaN;
      if (!orderId || !Number.isFinite(amount) || amount <= 0) {
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "validation_error",
            message:
              "order_id (string) and amount (positive number) are required",
          }),
        );
        return;
      }
      try {
        const checkout = await createSumUpCheckoutApi({
          checkout_reference: orderId,
          amount,
          currency: "BRL",
          payment_type: "pix",
          country: "BR",
          merchant_code: body.merchant_code?.trim() || undefined,
          description: body.description?.trim() || undefined,
        });
        res.writeHead(201, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            provider: "sumup",
            payment_method: "pix",
            country: "BR",
            checkout_id: checkout.id,
            checkout_reference: checkout.checkout_reference || orderId,
            status: checkout.status,
            amount: checkout.amount,
            currency: checkout.currency,
            raw: checkout,
          }),
        );
      } catch (e) {
        console.error(
          "[integration-gateway] PIX checkout error:",
          safeErrorMessage(e),
        );
        res.writeHead(500, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Failed to create PIX checkout",
            message: safeErrorMessage(e),
          }),
        );
      }
      return;
    }

    const paymentSumupCheckoutIdMatch = path.match(
      /^\/api\/v1\/payment\/sumup\/checkout\/([^/]+)$/,
    );
    if (paymentSumupCheckoutIdMatch && method === "GET") {
      const cors = corsHeaders();
      if (!verifyPaymentInternalToken(req)) {
        res.writeHead(401, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      if (!SUMUP_ACCESS_TOKEN) {
        res.writeHead(503, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "service_unavailable",
            message: "SumUp not configured (SUMUP_ACCESS_TOKEN)",
          }),
        );
        return;
      }
      const checkoutId = paymentSumupCheckoutIdMatch[1];
      try {
        const checkout = await getSumUpCheckoutApi(checkoutId);
        res.writeHead(200, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            provider: "sumup",
            checkout_id: checkout.id,
            status: checkout.status,
            amount: checkout.amount,
            currency: checkout.currency,
            raw: checkout,
          }),
        );
      } catch (e) {
        console.error(
          "[integration-gateway] SumUp checkout status error:",
          safeErrorMessage(e),
        );
        res.writeHead(500, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Failed to fetch checkout status",
            message: safeErrorMessage(e),
          }),
        );
      }
      return;
    }

    if (path === "/api/v1/sumup/checkout" && method === "POST") {
      const cors = corsHeaders();
      if (!verifyPaymentInternalToken(req)) {
        res.writeHead(401, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      if (!SUMUP_ACCESS_TOKEN) {
        res.writeHead(503, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "service_unavailable",
            message: "SumUp not configured (SUMUP_ACCESS_TOKEN)",
          }),
        );
        return;
      }
      let body: {
        orderId?: string;
        restaurantId?: string;
        amount?: number;
        currency?: string;
        description?: string;
        returnUrl?: string;
      };
      try {
        body = JSON.parse((await parseBody(req)) || "{}") as typeof body;
      } catch {
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "validation_error",
            message: "Invalid JSON body",
          }),
        );
        return;
      }
      const orderId = body?.orderId?.trim();
      const restaurantId = body?.restaurantId?.trim();
      const amount = typeof body?.amount === "number" ? body.amount : NaN;
      if (
        !orderId ||
        !restaurantId ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        res.writeHead(400, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "validation_error",
            message:
              "orderId, restaurantId and amount (positive number) are required",
          }),
        );
        return;
      }
      try {
        const checkout = await createSumUpCheckoutApi({
          checkout_reference: orderId,
          amount,
          currency: (body.currency?.trim() || "EUR").toUpperCase(),
          description: body.description?.trim() || undefined,
          return_url: body.returnUrl?.trim() || undefined,
        });
        const expiresAt = checkout.date
          ? new Date(checkout.date).getTime() + 15 * 60 * 1000
          : Date.now() + 15 * 60 * 1000;
        res.writeHead(201, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            checkout: {
              id: checkout.id,
              url: `https://pay.sumup.com/checkout/${checkout.id}`,
              status: checkout.status,
              amount: checkout.amount,
              currency: checkout.currency,
              expiresAt: new Date(expiresAt).toISOString(),
              reference: checkout.checkout_reference || orderId,
            },
            paymentId: undefined,
          }),
        );
      } catch (e) {
        console.error(
          "[integration-gateway] SumUp checkout error:",
          safeErrorMessage(e),
        );
        res.writeHead(500, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Failed to create SumUp checkout",
            message: safeErrorMessage(e),
          }),
        );
      }
      return;
    }

    const sumupCheckoutIdMatch = path.match(
      /^\/api\/v1\/sumup\/checkout\/([^/]+)$/,
    );
    if (sumupCheckoutIdMatch && method === "GET") {
      const cors = corsHeaders();
      if (!verifyPaymentInternalToken(req)) {
        res.writeHead(401, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "unauthorized",
            message: "Invalid or missing internal token",
          }),
        );
        return;
      }
      if (!SUMUP_ACCESS_TOKEN) {
        res.writeHead(503, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "service_unavailable",
            message: "SumUp not configured (SUMUP_ACCESS_TOKEN)",
          }),
        );
        return;
      }
      const checkoutId = sumupCheckoutIdMatch[1];
      try {
        const checkout = await getSumUpCheckoutApi(checkoutId);
        res.writeHead(200, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            checkout: {
              id: checkout.id,
              status: checkout.status,
              amount: checkout.amount,
              currency: checkout.currency,
              reference: checkout.checkout_reference || checkoutId,
              transactions: (
                checkout as SumUpCheckoutResponse & { transactions?: unknown[] }
              ).transactions,
              validUntil: checkout.date,
            },
          }),
        );
      } catch (e) {
        console.error(
          "[integration-gateway] SumUp checkout status error:",
          safeErrorMessage(e),
        );
        res.writeHead(500, { ...cors, "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Failed to fetch SumUp checkout status",
            message: safeErrorMessage(e),
          }),
        );
      }
      return;
    }

    if (path.startsWith("/api/v1/")) {
      const apiKey =
        (req.headers["x-api-key"] as string) ||
        (req.headers["authorization"] as string)
          ?.replace(/^Bearer\s+/i, "")
          ?.trim();
      if (!apiKey) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            apiError(
              "unauthorized",
              "API key missing",
              "Use X-API-Key or Authorization: Bearer <key>",
            ),
          ),
        );
        return;
      }
      const keyHash = sha256Hex(apiKey);
      const keyRow = await lookupApiKey(keyHash);
      if (!keyRow) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            apiError(
              "unauthorized",
              "Invalid API key",
              "API key not found or revoked",
            ),
          ),
        );
        return;
      }
      await updateApiKeyLastUsed(keyRow.id);
      const rate = checkRateLimit(keyRow.id);
      if (!rate.ok) {
        res.writeHead(429, {
          "Content-Type": "application/json",
          "Retry-After": String(rate.retryAfter ?? 60),
        });
        res.end(
          JSON.stringify(
            apiError("rate_limit_exceeded", "Too many requests", {
              detail: "Limit 100/min",
              retryAfter: rate.retryAfter,
            }),
          ),
        );
        return;
      }
      const bodyStr = await parseBody(req);
      const headers: Record<string, string | string[] | undefined> = {};
      if (req.headers) {
        for (const [k, v] of Object.entries(req.headers))
          headers[k.toLowerCase()] = v as string | string[];
      }
      const {
        status: apiStatus,
        json: apiJson,
        headers: apiHeaders,
      } = await handleApiV1(
        method,
        path,
        bodyStr,
        {
          keyId: keyRow.id,
          restaurantId: keyRow.restaurant_id,
        },
        headers,
      );
      const h: Record<string, string> = {
        "Content-Type": "application/json",
        ...apiHeaders,
      };
      res.writeHead(apiStatus, h);
      res.end(JSON.stringify(apiJson));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found", message: "Not found" }));
  } catch (err) {
    console.error("[integration-gateway]", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "internal_error",
        message: "Internal server error",
      }),
    );
  }
});

server.listen(PORT, () => {
  console.log(
    `[integration-gateway] Listening on http://localhost:${PORT} (health=/health, events=POST /internal/events)`,
  );
});
