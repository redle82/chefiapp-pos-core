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
import { processProductImage } from "./imageProcessor";
import { uploadProductImage } from "./minioStorage";

const PORT = parseInt(process.env.PORT || "4320", 10);
const CORE_URL = (process.env.CORE_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);
const CORE_SERVICE_KEY =
  process.env.CORE_SERVICE_KEY || process.env.CORE_ANON_KEY || "";
const INTERNAL_API_TOKEN =
  process.env.INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";

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

function extractBase64Payload(input: string): string {
  if (input.includes(",")) {
    return input.split(",").pop() || "";
  }
  return input;
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
            product_id: string;
            quantity: number;
            unit_price: number;
          }) => ({
            id: it.product_id,
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
  const path = req.url?.split("?")[0] ?? "/";

  try {
    if (path === "/health" && method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "integration-gateway" }));
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
