import * as crypto from "crypto";
import type { IncomingHttpHeaders } from "http";
import {
  ActivationError,
  activateMobileRequest,
  buildActivationToken,
  buildPin,
  hashSha256,
  type ActivationRepository,
  type ActivationRequestRecord,
} from "./mobileActivationService";

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

const activationTokenCache = new Map<
  string,
  { token: string; expiresAt: string }
>();
const activationRateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

function coreHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${CORE_SERVICE_KEY}`,
    apikey: CORE_SERVICE_KEY,
  };
}

function getAdminToken(headers: IncomingHttpHeaders): string {
  const xToken = headers["x-internal-token"];
  const authHeader = headers["authorization"];
  if (typeof xToken === "string") return xToken;
  if (typeof authHeader === "string")
    return authHeader.replace(/^Bearer\s+/i, "");
  return "";
}

function requireAdminToken(headers: IncomingHttpHeaders): boolean {
  return getAdminToken(headers) === INTERNAL_API_TOKEN;
}

function sanitizeIp(rawIp: string | undefined): string {
  if (!rawIp) return "unknown";
  if (rawIp.includes(",")) return rawIp.split(",")[0].trim();
  return rawIp.trim();
}

function toIso(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  return date.toISOString();
}

function randomToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

function mapActivationRow(
  row: Record<string, unknown>,
): ActivationRequestRecord {
  return {
    id: String(row.id),
    restaurantId: String(row.restaurant_id),
    staffMemberId: String(row.staff_member_id),
    requestedRole: String(row.requested_role),
    label: row.label ? String(row.label) : null,
    tokenHash: String(row.token_hash),
    pinHash: String(row.pin_hash),
    status: String(row.status) as ActivationRequestRecord["status"],
    expiresAt: String(row.expires_at),
    attempts: Number(row.attempts ?? 0),
    createdByAdminId: row.created_by_admin_id
      ? String(row.created_by_admin_id)
      : null,
    consumedAt: row.consumed_at ? String(row.consumed_at) : null,
    consumedByInstallId: row.consumed_by_install_id
      ? String(row.consumed_by_install_id)
      : null,
    revokedReason: row.revoked_reason ? String(row.revoked_reason) : null,
  };
}

async function insertAuditLog(event: {
  eventType: string;
  action: string;
  restaurantId: string;
  actorId?: string | null;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!CORE_SERVICE_KEY) return;

  const response = await fetch(`${REST}/gm_audit_logs`, {
    method: "POST",
    headers: { ...coreHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({
      event_type: event.eventType,
      action: event.action,
      restaurant_id: event.restaurantId,
      actor_id: event.actorId ?? null,
      actor_type: event.actorId ? "user" : "system",
      resource_type: "mobile_activation_request",
      resource_id: event.resourceId ?? null,
      details: event.details ?? null,
      result: "success",
      metadata: event.metadata ?? null,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn(
      "[mobile-activation] audit insert failed",
      response.status,
      body,
    );
  }
}

function activationRateLimit(key: string): {
  ok: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const windowMs = 60_000;
  const maxAttempts = 12;

  const existing = activationRateLimitMap.get(key);
  if (!existing || now >= existing.resetAt) {
    activationRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  existing.count += 1;
  if (existing.count > maxAttempts) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  return { ok: true };
}

class PostgrestActivationRepository implements ActivationRepository {
  async findByTokenHash(
    tokenHash: string,
  ): Promise<ActivationRequestRecord | null> {
    const response = await fetch(
      `${REST}/gm_mobile_activation_requests?token_hash=eq.${encodeURIComponent(
        tokenHash,
      )}&select=*&limit=1`,
      {
        method: "GET",
        headers: coreHeaders(),
      },
    );

    if (!response.ok) return null;
    const rows = (await response.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return mapActivationRow(rows[0]);
  }

  async incrementAttempts(id: string): Promise<ActivationRequestRecord> {
    const response = await fetch(`${RPC}/mobile_register_invalid_pin_attempt`, {
      method: "POST",
      headers: coreHeaders(),
      body: JSON.stringify({
        p_request_id: id,
        p_max_attempts: 5,
        p_revoke_reason: "max_pin_attempts",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to increment attempts: ${response.status}`);
    }

    const data = (await response.json()) as
      | Record<string, unknown>[]
      | Record<string, unknown>;
    const row = Array.isArray(data) ? data[0] : data;
    return mapActivationRow(row);
  }

  async revoke(id: string, reason: string): Promise<void> {
    await fetch(
      `${REST}/gm_mobile_activation_requests?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: coreHeaders(),
        body: JSON.stringify({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_reason: reason,
        }),
      },
    );
  }

  async consume(
    id: string,
    installId: string,
    _ip: string,
    _platform: string,
  ): Promise<ActivationRequestRecord> {
    const response = await fetch(`${RPC}/mobile_consume_activation_request`, {
      method: "POST",
      headers: coreHeaders(),
      body: JSON.stringify({
        p_request_id: id,
        p_install_id: installId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to consume activation request: ${response.status}`,
      );
    }

    const data = (await response.json()) as
      | Record<string, unknown>[]
      | Record<string, unknown>;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new ActivationError(
        "TOKEN_ALREADY_USED",
        "Activation request already consumed",
      );
    }
    return mapActivationRow(row);
  }

  async logAudit(event: {
    eventType: string;
    action: string;
    restaurantId: string;
    actorId?: string | null;
    resourceId?: string | null;
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await insertAuditLog(event);
  }
}

export async function handleMobileActivationRoute(params: {
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  body: string;
  ip: string;
}): Promise<
  | { handled: false }
  | {
      handled: true;
      status: number;
      json: Record<string, unknown>;
    }
> {
  const { method, path, body, headers, ip } = params;
  const pathNorm = (path || "/").replace(/\/+/g, "/").replace(/\/+$/, "") || "/";

  if (method === "POST" && pathNorm === "/mobile/activation-requests") {
    if (!requireAdminToken(headers)) {
      return {
        handled: true,
        status: 401,
        json: { error: "unauthorized", message: "Invalid admin token" },
      };
    }

    let payload: {
      restaurantId?: string;
      requestedRole?: string;
      staffMemberId?: string;
      label?: string;
      pinPolicy?: { mode?: string; length?: number };
      ttlSeconds?: number;
    };

    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return {
        handled: true,
        status: 400,
        json: { error: "invalid_json", message: "Invalid JSON body" },
      };
    }

    const restaurantId = payload.restaurantId?.trim();
    const requestedRole = payload.requestedRole?.trim() || "driver";
    const staffMemberId = payload.staffMemberId?.trim();
    const label = payload.label?.trim() || null;
    const ttlSeconds = Math.min(900, Math.max(300, payload.ttlSeconds ?? 600));

    if (!restaurantId || !staffMemberId) {
      return {
        handled: true,
        status: 400,
        json: {
          error: "validation_error",
          message: "restaurantId and staffMemberId are required",
        },
      };
    }

    const pinLength = payload.pinPolicy?.length ?? 6;
    const pin = buildPin(pinLength);
    const activationToken = buildActivationToken();
    const tokenHash = hashSha256(activationToken);
    const pinHash = hashSha256(pin);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const createResponse = await fetch(
      `${REST}/gm_mobile_activation_requests`,
      {
        method: "POST",
        headers: { ...coreHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          staff_member_id: staffMemberId,
          requested_role: requestedRole,
          label,
          token_hash: tokenHash,
          pin_hash: pinHash,
          status: "pending",
          expires_at: toIso(expiresAt),
          attempts: 0,
          created_by_admin_id: headers["x-admin-id"] ?? null,
          pin_shown_at: new Date().toISOString(),
        }),
      },
    );

    if (!createResponse.ok) {
      return {
        handled: true,
        status: createResponse.status,
        json: {
          error: "create_failed",
          message: await createResponse.text(),
        },
      };
    }

    const createdRows = (await createResponse.json()) as Array<{ id: string }>;
    const created = createdRows[0];
    activationTokenCache.set(created.id, {
      token: activationToken,
      expiresAt: expiresAt.toISOString(),
    });

    await insertAuditLog({
      eventType: "activation_request.created",
      action: "mobile_activation_request_created",
      restaurantId,
      actorId:
        typeof headers["x-admin-id"] === "string"
          ? headers["x-admin-id"]
          : null,
      resourceId: created.id,
      details: { requestedRole, ttlSeconds, staffMemberId, label },
      metadata: { ip: sanitizeIp(ip) },
    });

    await insertAuditLog({
      eventType: "activation_request.pin_shown",
      action: "mobile_activation_pin_shown",
      restaurantId,
      actorId:
        typeof headers["x-admin-id"] === "string"
          ? headers["x-admin-id"]
          : null,
      resourceId: created.id,
      metadata: { ip: sanitizeIp(ip) },
    });

    return {
      handled: true,
      status: 201,
      json: {
        activationRequestId: created.id,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
        pinDelivery: {
          mode: "show_once_in_admin",
          pin,
        },
        qr: {
          format: "url",
          value: `chefiapp://activate?token=${activationToken}`,
        },
      },
    };
  }

  const qrMatch = pathNorm.match(/^\/mobile\/activation-requests\/([^/]+)\/qr$/);
  if (method === "GET" && qrMatch) {
    if (!requireAdminToken(headers)) {
      return {
        handled: true,
        status: 401,
        json: { error: "unauthorized", message: "Invalid admin token" },
      };
    }

    const requestId = qrMatch[1];
    const response = await fetch(
      `${REST}/gm_mobile_activation_requests?id=eq.${encodeURIComponent(
        requestId,
      )}&select=id,status,expires_at&limit=1`,
      {
        method: "GET",
        headers: coreHeaders(),
      },
    );

    if (!response.ok) {
      return {
        handled: true,
        status: 404,
        json: { error: "not_found" },
      };
    }

    const rows = (await response.json()) as Array<{
      id: string;
      status: string;
      expires_at: string;
    }>;
    const row = rows[0];
    if (!row) {
      return { handled: true, status: 404, json: { error: "not_found" } };
    }

    if (
      row.status !== "pending" ||
      new Date(row.expires_at).getTime() <= Date.now()
    ) {
      return {
        handled: true,
        status: 410,
        json: { error: "TOKEN_EXPIRED" },
      };
    }

    const tokenInfo = activationTokenCache.get(requestId);
    if (!tokenInfo) {
      return {
        handled: true,
        status: 410,
        json: { error: "TOKEN_EXPIRED" },
      };
    }

    return {
      handled: true,
      status: 200,
      json: {
        activationRequestId: row.id,
        expiresAt: row.expires_at,
        qr: {
          format: "url",
          value: `chefiapp://activate?token=${tokenInfo.token}`,
        },
      },
    };
  }

  const statusMatch = pathNorm.match(/^\/mobile\/activation-requests\/([^/]+)$/);
  if (method === "GET" && statusMatch) {
    if (!requireAdminToken(headers)) {
      return {
        handled: true,
        status: 401,
        json: { error: "unauthorized", message: "Invalid admin token" },
      };
    }

    const requestId = statusMatch[1];
    const response = await fetch(
      `${REST}/gm_mobile_activation_requests?id=eq.${encodeURIComponent(
        requestId,
      )}&select=id,status,expires_at,consumed_at,revoked_at,revoked_reason,staff_member_id,restaurant_id&limit=1`,
      {
        method: "GET",
        headers: coreHeaders(),
      },
    );

    if (!response.ok) {
      return { handled: true, status: 404, json: { error: "not_found" } };
    }

    const rows = (await response.json()) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) {
      return { handled: true, status: 404, json: { error: "not_found" } };
    }

    return {
      handled: true,
      status: 200,
      json: {
        activationRequestId: row.id,
        status: row.status,
        expiresAt: row.expires_at,
        consumedAt: row.consumed_at,
        revokedAt: row.revoked_at,
        revokedReason: row.revoked_reason,
        staffMemberId: row.staff_member_id,
        restaurantId: row.restaurant_id,
      },
    };
  }

  const revokeMatch = pathNorm.match(
    /^\/mobile\/activation-requests\/([^/]+)\/revoke$/,
  );
  if (method === "POST" && revokeMatch) {
    if (!requireAdminToken(headers)) {
      return {
        handled: true,
        status: 401,
        json: { error: "unauthorized", message: "Invalid admin token" },
      };
    }

    const requestId = revokeMatch[1];
    let payload: { reason?: string };
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      payload = {};
    }

    const updateResponse = await fetch(
      `${REST}/gm_mobile_activation_requests?id=eq.${encodeURIComponent(
        requestId,
      )}`,
      {
        method: "PATCH",
        headers: coreHeaders(),
        body: JSON.stringify({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_reason: payload.reason || "manual_revoke",
        }),
      },
    );

    if (!updateResponse.ok) {
      return {
        handled: true,
        status: updateResponse.status,
        json: { error: "revoke_failed", message: await updateResponse.text() },
      };
    }

    activationTokenCache.delete(requestId);

    return {
      handled: true,
      status: 200,
      json: { status: "revoked" },
    };
  }

  if (method === "POST" && pathNorm === "/mobile/activate") {
    let payload: {
      activationToken?: string;
      pin?: string;
      device?: {
        platform?: string;
        deviceName?: string;
        osVersion?: string;
        appVersion?: string;
        installId?: string;
        deviceFingerprint?: string;
      };
    };

    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return {
        handled: true,
        status: 400,
        json: { error: "invalid_json", message: "Invalid JSON body" },
      };
    }

    if (
      !payload.activationToken ||
      !payload.pin ||
      !payload.device?.platform ||
      !payload.device?.installId
    ) {
      return {
        handled: true,
        status: 400,
        json: {
          error: "validation_error",
          message: "activationToken, pin and device fields are required",
        },
      };
    }

    const repository = new PostgrestActivationRepository();

    try {
      const activated = await activateMobileRequest(
        {
          activationToken: payload.activationToken,
          pin: payload.pin,
          device: {
            platform: payload.device.platform,
            deviceName: payload.device.deviceName ?? "Unknown",
            osVersion: payload.device.osVersion ?? "unknown",
            appVersion: payload.device.appVersion ?? "unknown",
            installId: payload.device.installId,
            deviceFingerprint: payload.device.deviceFingerprint ?? "unknown",
          },
        },
        {
          ip: sanitizeIp(ip),
          repository,
          rateLimit: activationRateLimit,
          issueSession: async ({ restaurantId, staffMemberId }) => ({
            accessToken: randomToken("jwt_access"),
            refreshToken: randomToken("jwt_refresh"),
            expiresIn: 3600,
          }),
          now: () => new Date(),
        },
      );

      return {
        handled: true,
        status: 200,
        json: activated as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof ActivationError) {
        const status = error.code === "RATE_LIMITED" ? 429 : 400;
        const bodyOut: Record<string, unknown> = { error: error.code };
        if (error.code === "RATE_LIMITED" && error.retryAfterSeconds) {
          bodyOut.retryAfterSeconds = error.retryAfterSeconds;
        }

        return {
          handled: true,
          status,
          json: bodyOut,
        };
      }

      return {
        handled: true,
        status: 500,
        json: {
          error: "internal_error",
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  return { handled: false };
}
