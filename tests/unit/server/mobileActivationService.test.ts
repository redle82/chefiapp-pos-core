import {
  activateMobileRequest,
  buildActivationToken,
  hashSha256,
  type ActivationRepository,
  type ActivationRequestRecord,
  type RateLimitResult,
} from "../../../server/mobileActivationService";

class InMemoryActivationRepo implements ActivationRepository {
  public record: ActivationRequestRecord;
  public revokedReason: string | null = null;

  constructor(record: ActivationRequestRecord) {
    this.record = { ...record };
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<ActivationRequestRecord | null> {
    if (this.record.tokenHash !== tokenHash) return null;
    return { ...this.record };
  }

  async incrementAttempts(id: string): Promise<ActivationRequestRecord> {
    if (this.record.id !== id) throw new Error("unexpected id");
    this.record.attempts += 1;
    return { ...this.record };
  }

  async revoke(id: string, reason: string): Promise<void> {
    if (this.record.id !== id) throw new Error("unexpected id");
    this.record.status = "revoked";
    this.record.revokedReason = reason;
    this.revokedReason = reason;
  }

  async consume(
    id: string,
    installId: string,
    _ip: string,
    _platform: string,
  ): Promise<ActivationRequestRecord> {
    if (this.record.id !== id) throw new Error("unexpected id");
    this.record.status = "consumed";
    this.record.consumedByInstallId = installId;
    this.record.consumedAt = new Date().toISOString();
    return { ...this.record };
  }

  async logAudit(): Promise<void> {
    return;
  }
}

function createBaseRecord(
  overrides: Partial<ActivationRequestRecord> = {},
): ActivationRequestRecord {
  return {
    id: "ar_test_1",
    restaurantId: "00000000-0000-0000-0000-000000000100",
    staffMemberId: "00000000-0000-0000-0000-000000000200",
    requestedRole: "driver",
    label: "iPhone Test",
    tokenHash: hashSha256("atk_test_123456"),
    pinHash: hashSha256("123456"),
    status: "pending",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    attempts: 0,
    createdByAdminId: "00000000-0000-0000-0000-000000000300",
    ...overrides,
  };
}

describe("mobileActivationService", () => {
  it("returns TOKEN_EXPIRED when token is expired", async () => {
    const repo = new InMemoryActivationRepo(
      createBaseRecord({
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      }),
    );

    await expect(
      activateMobileRequest(
        {
          activationToken: "atk_test_123456",
          pin: "123456",
          device: {
            platform: "ios",
            deviceName: "iPhone",
            osVersion: "17",
            appVersion: "1.0.0",
            installId: "iid-1",
            deviceFingerprint: "dfp-1",
          },
        },
        {
          ip: "127.0.0.1",
          repository: repo,
          rateLimit: () => ({ ok: true }),
          issueSession: async () => ({
            accessToken: "a",
            refreshToken: "r",
            expiresIn: 3600,
          }),
          now: () => new Date(),
        },
      ),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("returns TOKEN_ALREADY_USED when token is consumed", async () => {
    const repo = new InMemoryActivationRepo(
      createBaseRecord({ status: "consumed" }),
    );

    await expect(
      activateMobileRequest(
        {
          activationToken: "atk_test_123456",
          pin: "123456",
          device: {
            platform: "ios",
            deviceName: "iPhone",
            osVersion: "17",
            appVersion: "1.0.0",
            installId: "iid-1",
            deviceFingerprint: "dfp-1",
          },
        },
        {
          ip: "127.0.0.1",
          repository: repo,
          rateLimit: () => ({ ok: true }),
          issueSession: async () => ({
            accessToken: "a",
            refreshToken: "r",
            expiresIn: 3600,
          }),
          now: () => new Date(),
        },
      ),
    ).rejects.toMatchObject({ code: "TOKEN_ALREADY_USED" });
  });

  it("increments attempts when pin is invalid", async () => {
    const repo = new InMemoryActivationRepo(createBaseRecord({ attempts: 2 }));

    await expect(
      activateMobileRequest(
        {
          activationToken: "atk_test_123456",
          pin: "000000",
          device: {
            platform: "ios",
            deviceName: "iPhone",
            osVersion: "17",
            appVersion: "1.0.0",
            installId: "iid-1",
            deviceFingerprint: "dfp-1",
          },
        },
        {
          ip: "127.0.0.1",
          repository: repo,
          rateLimit: () => ({ ok: true }),
          issueSession: async () => ({
            accessToken: "a",
            refreshToken: "r",
            expiresIn: 3600,
          }),
          now: () => new Date(),
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_PIN" });

    expect(repo.record.attempts).toBe(3);
    expect(repo.record.status).toBe("pending");
  });

  it("consumes token and returns session on success", async () => {
    const repo = new InMemoryActivationRepo(createBaseRecord());

    const result = await activateMobileRequest(
      {
        activationToken: "atk_test_123456",
        pin: "123456",
        device: {
          platform: "ios",
          deviceName: "iPhone",
          osVersion: "17",
          appVersion: "1.0.0",
          installId: "iid-1",
          deviceFingerprint: "dfp-1",
        },
      },
      {
        ip: "127.0.0.1",
        repository: repo,
        rateLimit: (): RateLimitResult => ({ ok: true }),
        issueSession: async () => ({
          accessToken: "access-1",
          refreshToken: "refresh-1",
          expiresIn: 3600,
        }),
        now: () => new Date(),
      },
    );

    expect(result.status).toBe("activated");
    expect(result.session.accessToken).toBe("access-1");
    expect(repo.record.status).toBe("consumed");
    expect(repo.record.consumedByInstallId).toBe("iid-1");
  });

  it("returns RATE_LIMITED when rate limit blocks activation", async () => {
    const repo = new InMemoryActivationRepo(createBaseRecord());

    await expect(
      activateMobileRequest(
        {
          activationToken: "atk_test_123456",
          pin: "123456",
          device: {
            platform: "ios",
            deviceName: "iPhone",
            osVersion: "17",
            appVersion: "1.0.0",
            installId: "iid-1",
            deviceFingerprint: "dfp-1",
          },
        },
        {
          ip: "127.0.0.1",
          repository: repo,
          rateLimit: (): RateLimitResult => ({
            ok: false,
            retryAfterSeconds: 30,
          }),
          issueSession: async () => ({
            accessToken: "a",
            refreshToken: "r",
            expiresIn: 3600,
          }),
          now: () => new Date(),
        },
      ),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryAfterSeconds: 30,
    });
  });

  it("buildActivationToken keeps atk_ prefix", () => {
    expect(buildActivationToken().startsWith("atk_")).toBe(true);
  });
});
