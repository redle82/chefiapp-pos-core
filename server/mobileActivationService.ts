import * as crypto from "crypto";

export type ActivationStatus = "pending" | "consumed" | "revoked" | "expired";

export interface ActivationRequestRecord {
  id: string;
  restaurantId: string;
  staffMemberId: string;
  requestedRole: string;
  label: string | null;
  tokenHash: string;
  pinHash: string;
  status: ActivationStatus;
  expiresAt: string;
  attempts: number;
  createdByAdminId: string | null;
  consumedAt?: string | null;
  consumedByInstallId?: string | null;
  revokedReason?: string | null;
}

export interface ActivateMobileRequestInput {
  activationToken: string;
  pin: string;
  device: {
    platform: string;
    deviceName: string;
    osVersion: string;
    appVersion: string;
    installId: string;
    deviceFingerprint: string;
  };
}

export interface ActivateMobileResponse {
  status: "activated";
  restaurantId: string;
  staffMemberId: string;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  principal: {
    roles: string[];
    modulesEnabled: string[];
    permissions: string[];
  };
  bootstrap: {
    featureFlags: {
      deliveryModule: boolean;
      offlineOutbox: boolean;
    };
  };
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

export interface ActivationRepository {
  findByTokenHash(tokenHash: string): Promise<ActivationRequestRecord | null>;
  incrementAttempts(id: string): Promise<ActivationRequestRecord>;
  revoke(id: string, reason: string): Promise<void>;
  consume(
    id: string,
    installId: string,
    ip: string,
    platform: string,
  ): Promise<ActivationRequestRecord>;
  logAudit(event: {
    eventType: string;
    action: string;
    restaurantId: string;
    actorId?: string | null;
    resourceId?: string | null;
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export class ActivationError extends Error {
  code:
    | "INVALID_PIN"
    | "TOKEN_EXPIRED"
    | "TOKEN_ALREADY_USED"
    | "TOKEN_REVOKED"
    | "RATE_LIMITED";
  retryAfterSeconds?: number;

  constructor(
    code:
      | "INVALID_PIN"
      | "TOKEN_EXPIRED"
      | "TOKEN_ALREADY_USED"
      | "TOKEN_REVOKED"
      | "RATE_LIMITED",
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomBase62(length: number): string {
  const bytes = crypto.randomBytes(length);
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += BASE62[bytes[index] % BASE62.length];
  }
  return output;
}

export function buildActivationToken(length = 20): string {
  return `atk_${randomBase62(Math.max(16, length))}`;
}

export function buildPin(length = 6): string {
  const safeLength = Math.max(4, length);
  let value = "";
  for (let index = 0; index < safeLength; index += 1) {
    value += crypto.randomInt(0, 10).toString();
  }
  return value;
}

function resolvePrincipal(role: string): {
  roles: string[];
  modulesEnabled: string[];
  permissions: string[];
} {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "driver") {
    return {
      roles: ["driver"],
      modulesEnabled: ["delivery", "tasks"],
      permissions: [
        "delivery:read",
        "delivery:update",
        "tasks:read",
        "tasks:update",
      ],
    };
  }

  if (normalizedRole === "manager") {
    return {
      roles: ["manager"],
      modulesEnabled: ["delivery", "tasks", "drivers", "reviews"],
      permissions: [
        "delivery:read",
        "delivery:update",
        "tasks:read",
        "tasks:update",
        "drivers:read",
        "reviews:read",
      ],
    };
  }

  if (normalizedRole === "owner") {
    return {
      roles: ["owner"],
      modulesEnabled: ["delivery", "tasks", "drivers", "reviews", "reports"],
      permissions: [
        "delivery:read",
        "delivery:update",
        "tasks:read",
        "tasks:update",
        "drivers:read",
        "drivers:update",
        "reviews:read",
        "reports:read",
      ],
    };
  }

  return {
    roles: [normalizedRole],
    modulesEnabled: ["tasks"],
    permissions: ["tasks:read", "tasks:update"],
  };
}

export async function activateMobileRequest(
  input: ActivateMobileRequestInput,
  dependencies: {
    ip: string;
    repository: ActivationRepository;
    rateLimit: (key: string) => RateLimitResult;
    issueSession: (context: {
      restaurantId: string;
      staffMemberId: string;
      requestedRole: string;
      installId: string;
    }) => Promise<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>;
    now?: () => Date;
  },
): Promise<ActivateMobileResponse> {
  const currentTime = dependencies.now ? dependencies.now() : new Date();
  const tokenHash = hashSha256(input.activationToken);
  const rateLimit = dependencies.rateLimit(`${dependencies.ip}:${tokenHash}`);

  if (!rateLimit.ok) {
    throw new ActivationError(
      "RATE_LIMITED",
      "Activation rate limit exceeded",
      rateLimit.retryAfterSeconds ?? 30,
    );
  }

  const request = await dependencies.repository.findByTokenHash(tokenHash);

  if (!request || request.status === "revoked") {
    throw new ActivationError("TOKEN_REVOKED", "Activation token revoked");
  }

  if (request.status === "consumed") {
    throw new ActivationError(
      "TOKEN_ALREADY_USED",
      "Activation token already used",
    );
  }

  const expiresAt = new Date(request.expiresAt);
  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() <= currentTime.getTime()
  ) {
    throw new ActivationError("TOKEN_EXPIRED", "Activation token expired");
  }

  const pinHash = hashSha256(input.pin);
  if (pinHash !== request.pinHash) {
    const updatedRequest = await dependencies.repository.incrementAttempts(
      request.id,
    );
    if (updatedRequest.attempts >= 5) {
      await dependencies.repository.revoke(request.id, "max_pin_attempts");
      await dependencies.repository.logAudit({
        eventType: "activation_request.revoked",
        action: "mobile_activation_revoked",
        restaurantId: request.restaurantId,
        actorId: request.createdByAdminId,
        resourceId: request.id,
        details: {
          reason: "max_pin_attempts",
          attempts: updatedRequest.attempts,
        },
        metadata: {
          ip: dependencies.ip,
          platform: input.device.platform,
          installId: input.device.installId,
        },
      });
    }

    throw new ActivationError("INVALID_PIN", "Invalid activation PIN");
  }

  const consumed = await dependencies.repository.consume(
    request.id,
    input.device.installId,
    dependencies.ip,
    input.device.platform,
  );

  const session = await dependencies.issueSession({
    restaurantId: consumed.restaurantId,
    staffMemberId: consumed.staffMemberId,
    requestedRole: consumed.requestedRole,
    installId: input.device.installId,
  });

  await dependencies.repository.logAudit({
    eventType: "activation_request.consumed",
    action: "mobile_activation_consumed",
    restaurantId: consumed.restaurantId,
    actorId: consumed.staffMemberId,
    resourceId: consumed.id,
    details: {
      staffMemberId: consumed.staffMemberId,
      installId: input.device.installId,
      requestedRole: consumed.requestedRole,
    },
    metadata: {
      ip: dependencies.ip,
      platform: input.device.platform,
      deviceName: input.device.deviceName,
    },
  });

  const principal = resolvePrincipal(consumed.requestedRole);

  return {
    status: "activated",
    restaurantId: consumed.restaurantId,
    staffMemberId: consumed.staffMemberId,
    session,
    principal,
    bootstrap: {
      featureFlags: {
        deliveryModule: principal.modulesEnabled.includes("delivery"),
        offlineOutbox: true,
      },
    },
  };
}
