export type ActivationStatus = "pending" | "consumed" | "revoked";

export interface ActivationRequestRecord {
  id: string;
  restaurantId: string;
  staffMemberId: string;
  requestedRole: string;
  label: string;
  tokenHash: string;
  pinHash: string;
  status: ActivationStatus;
  expiresAt: string;
  attempts: number;
  createdByAdminId: string;
  revokedReason?: string | null;
  consumedByInstallId?: string | null;
  consumedAt?: string | null;
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
  logAudit(record: ActivationRequestRecord): Promise<void>;
}

export function hashSha256(input: string): string {
  // Para efeitos de teste, não precisamos de um hash criptográfico real,
  // apenas de uma função determinística.
  return `sha256:${input}`;
}

export function buildActivationToken(): string {
  return `atk_${Math.random().toString(36).slice(2, 10)}`;
}

interface ActivateContext {
  ip: string;
  repository: ActivationRepository;
  rateLimit: () => RateLimitResult;
  issueSession: () => Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;
  now: () => Date;
}

interface ActivateInput {
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

export async function activateMobileRequest(
  input: ActivateInput,
  ctx: ActivateContext,
) {
  const rate = ctx.rateLimit();
  if (!rate.ok) {
    throw { code: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds };
  }

  const tokenHash = hashSha256(input.activationToken);
  const record = await ctx.repository.findByTokenHash(tokenHash);
  if (!record) {
    throw { code: "TOKEN_NOT_FOUND" };
  }

  const now = ctx.now();
  if (new Date(record.expiresAt).getTime() < now.getTime()) {
    throw { code: "TOKEN_EXPIRED" };
  }

  if (record.status === "consumed") {
    throw { code: "TOKEN_ALREADY_USED" };
  }

  if (record.status === "revoked") {
    throw { code: "TOKEN_REVOKED" };
  }

  const expectedPinHash = record.pinHash;
  const providedPinHash = hashSha256(input.pin);

  if (expectedPinHash !== providedPinHash) {
    await ctx.repository.incrementAttempts(record.id);
    throw { code: "INVALID_PIN" };
  }

  const updated = await ctx.repository.consume(
    record.id,
    input.device.installId,
    ctx.ip,
    input.device.platform,
  );

  const session = await ctx.issueSession();

  await ctx.repository.logAudit(updated);

  return {
    status: "activated" as const,
    session,
  };
}

