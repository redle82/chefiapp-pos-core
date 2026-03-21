process.env.NODE_ENV = "test";
process.env.INTERNAL_API_TOKEN = "test-internal-token";

import type * as http from "http";

type GatewayModule = typeof import("../../../server/integration-gateway");

const REAL_FETCH = global.fetch;

function toUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return (input as Request).url;
}

function okJson(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

function errText(status: number, text: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ message: text }),
    text: async () => text,
  } as Response;
}

async function closeServerFully(srv: http.Server): Promise<void> {
  await new Promise<void>((resolve) => {
    srv.close(() => resolve());
    (
      srv as http.Server & { closeAllConnections?: () => void }
    ).closeAllConnections?.();
    (
      srv as http.Server & { closeIdleConnections?: () => void }
    ).closeIdleConnections?.();
  });
}

function applyEnv(overrides: Record<string, string | undefined>): () => void {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

async function importGatewayWithEnv(
  overrides: Record<string, string | undefined>,
): Promise<{ gw: GatewayModule; restoreEnv: () => void }> {
  const restoreEnv = applyEnv(overrides);
  jest.resetModules();
  const gw = await import("../../../server/integration-gateway");
  return { gw, restoreEnv };
}

async function startGatewayServer(
  gw: GatewayModule,
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  await new Promise<void>((resolve) => gw.server.listen(0, () => resolve()));
  const addr = gw.server.address();
  const port =
    typeof addr === "object" && addr !== null && "port" in addr
      ? addr.port
      : 4320;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => closeServerFully(gw.server),
  };
}

describe("integration-gateway release-readiness — lead capture helper", () => {
  let gw: GatewayModule;
  let restoreEnv: () => void;

  beforeAll(async () => {
    ({ gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "lead-capture-service-key",
      APP_URL: "https://portal.chefiapp.com/",
      INTERNAL_API_TOKEN: "test-internal-token",
    }));
  });

  afterAll(() => {
    restoreEnv();
    jest.resetModules();
    global.fetch = REAL_FETCH;
  });

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("returns 400 for invalid JSON", async () => {
    const result = await gw.handleLeadCapture("{ not-json }");
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "invalid_json",
      message: "Invalid JSON body",
    });
  });

  it("returns 400 when email is invalid", async () => {
    const result = await gw.handleLeadCapture(
      JSON.stringify({
        email: "invalid",
        country: "BR",
        source: "landing",
      }),
    );
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "validation_error",
      message: "Invalid or missing email",
    });
  });

  it("returns 400 when country is missing", async () => {
    const result = await gw.handleLeadCapture(
      JSON.stringify({
        email: "lead@example.com",
        source: "landing",
      }),
    );
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "validation_error",
      message: "Missing country",
    });
  });

  it("persists lead on core and builds signup_url", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      okJson([{ id: "lead_123" }], 201),
    );

    const result = await gw.handleLeadCapture(
      JSON.stringify({
        email: "lead@example.com",
        country: "BR",
        source: "landing",
      }),
    );

    expect(result.status).toBe(201);
    expect(result.json).toMatchObject({
      ok: true,
      lead_id: "lead_123",
      signup_url:
        "https://portal.chefiapp.com/signup?email=lead%40example.com&next=/onboarding/start",
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const payload = JSON.parse((options as RequestInit).body as string) as {
      segment?: string;
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
      session_event_count?: number | null;
    };
    expect(payload.segment).toBe("small");
    expect(payload.utm_source).toBeNull();
    expect(payload.utm_medium).toBeNull();
    expect(payload.utm_campaign).toBeNull();
    expect(payload.session_event_count).toBeNull();
  });

  it("returns 500 when core insert responds !ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ...okJson({ id: "lead_123" }, 500),
      ok: false,
    });

    const result = await gw.handleLeadCapture(
      JSON.stringify({
        email: "lead@example.com",
        country: "BR",
        source: "landing",
      }),
    );

    expect(result.status).toBe(500);
    expect(result.json).toMatchObject({
      error: "internal_error",
      message: "Failed to save lead",
    });
  });

  it("returns 500 with details when persistence throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce("db unavailable");

    const result = await gw.handleLeadCapture(
      JSON.stringify({
        email: "lead@example.com",
        country: "BR",
        source: "landing",
      }),
    );

    expect(result.status).toBe(500);
    expect(result.json).toMatchObject({
      error: "internal_error",
      message: "Failed to save lead",
      details: "db unavailable",
    });
  });
});

describe("integration-gateway release-readiness — lead capture without CORE_SERVICE_KEY", () => {
  let gw: GatewayModule;
  let restoreEnv: () => void;

  beforeAll(async () => {
    ({ gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "",
      INTERNAL_API_TOKEN: "test-internal-token",
    }));
  });

  afterAll(() => {
    restoreEnv();
    jest.resetModules();
    global.fetch = REAL_FETCH;
  });

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("returns 201 mock response when persistence is disabled", async () => {
    const result = await gw.handleLeadCapture(
      JSON.stringify({
        email: "lead@example.com",
        country: "PT",
        source: "landing",
      }),
    );

    expect(result.status).toBe(201);
    expect(result.json).toMatchObject({
      ok: true,
      message: "Lead received (persistence disabled)",
    });
    expect((result.json as { lead_id?: string }).lead_id).toMatch(/^mock_/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("integration-gateway release-readiness — automation dispatch persistence paths", () => {
  const validPayload = {
    restaurant_id: "11111111-1111-4111-8111-111111111111",
    trigger: "activation_velocity_low",
    score: 18,
    classification: "Stalled",
    recommended_action: {
      title: "Nudge onboarding",
      reason: "Velocity below target",
      automation: "send_in_app_nudge",
    },
  };

  afterEach(() => {
    global.fetch = REAL_FETCH;
    jest.resetModules();
  });

  it("returns 400 on invalid JSON", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    try {
      const result = await gw.handleAutomationDispatch("{ invalid");
      expect(result.status).toBe(400);
      expect(result.json).toMatchObject({
        error: "validation_error",
        message: "Invalid JSON body",
      });
    } finally {
      restoreEnv();
    }
  });

  it("returns 400 when idempotency_key is missing", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    try {
      const result = await gw.handleAutomationDispatch(
        JSON.stringify(validPayload),
      );
      expect(result.status).toBe(400);
      expect(result.json).toMatchObject({
        error: "validation_error",
        message: expect.stringContaining("idempotency_key"),
      });
    } finally {
      restoreEnv();
    }
  });

  it("returns 400 on required-field and classification/title validation branches", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    try {
      const missingFields = await gw.handleAutomationDispatch(
        JSON.stringify({
          idempotency_key: "auto_missing_fields_001",
          restaurant_id: validPayload.restaurant_id,
        }),
      );
      expect(missingFields.status).toBe(400);

      const badClassification = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_bad_class_001",
          classification: "Unknown",
        }),
      );
      expect(badClassification.status).toBe(400);
      expect(badClassification.json).toMatchObject({
        error: "validation_error",
        message: "classification not allowed",
      });

      const titleNotString = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_title_type_001",
          recommended_action: { title: { bad: true } },
        }),
      );
      expect(titleNotString.status).toBe(400);
      expect(titleNotString.json).toMatchObject({
        error: "validation_error",
        message: "recommended_action.title must be a string",
      });

      const titleTooLong = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_title_long_001",
          recommended_action: { title: "x".repeat(141) },
        }),
      );
      expect(titleTooLong.status).toBe(400);
      expect(titleTooLong.json).toMatchObject({
        error: "validation_error",
        message: "recommended_action.title too long",
      });
    } finally {
      restoreEnv();
    }
  });

  it("uses core dedupe path when lookup returns existing id", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okJson([{ id: "auto_evt_1" }]));
    try {
      const result = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_core_dedupe_001",
        }),
      );
      expect(result.status).toBe(200);
      expect(result.json).toMatchObject({
        accepted: true,
        deduped: true,
        persisted: true,
        storage: "core",
        dispatch_id: "auto_evt_1",
      });
      expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1);
    } finally {
      restoreEnv();
    }
  });

  it("uses core insert path when lookup returns empty", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okJson([], 200))
      .mockResolvedValueOnce(okJson({}, 201)) as unknown as typeof fetch;
    try {
      const result = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_core_insert_001",
        }),
      );
      expect(result.status).toBe(202);
      expect(result.json).toMatchObject({
        accepted: true,
        deduped: false,
        persisted: true,
        storage: "core",
      });
      expect((global.fetch as jest.Mock).mock.calls).toHaveLength(2);
    } finally {
      restoreEnv();
    }
  });

  it("falls back to memory in test env when core insert fails or throws", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    try {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(okJson([], 200))
        .mockResolvedValueOnce(
          errText(500, "core fail"),
        ) as unknown as typeof fetch;

      const insertFail = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_core_insert_fail_001",
        }),
      );
      expect(insertFail.status).toBe(202);
      expect(insertFail.json).toMatchObject({
        accepted: true,
        deduped: false,
        persisted: true,
        storage: "memory",
      });
      expect((insertFail.json as { detail?: string }).detail).toContain(
        "core_insert_failed:500",
      );

      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(
          new Error("lookup network error"),
        ) as unknown as typeof fetch;

      const lookupThrow = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_core_lookup_throw_001",
        }),
      );
      expect(lookupThrow.status).toBe(202);
      expect(lookupThrow.json).toMatchObject({
        accepted: true,
        persisted: true,
        storage: "memory",
      });
      expect((lookupThrow.json as { detail?: string }).detail).toContain(
        "lookup network error",
      );
    } finally {
      restoreEnv();
    }
  });

  it("returns 503 with storage none in production when CORE_SERVICE_KEY is missing", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "production",
      CORE_SERVICE_KEY: "",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    try {
      const result = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_prod_missing_core_001",
        }),
      );
      expect(result.status).toBe(503);
      expect(result.json).toMatchObject({
        accepted: false,
        persisted: false,
        storage: "none",
      });
    } finally {
      restoreEnv();
    }
  });

  it("returns 503 with storage none in production when core insert fails", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "production",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okJson([], 200))
      .mockResolvedValueOnce(
        errText(500, "production core failure"),
      ) as unknown as typeof fetch;

    try {
      const result = await gw.handleAutomationDispatch(
        JSON.stringify({
          ...validPayload,
          idempotency_key: "auto_prod_insert_fail_001",
        }),
      );
      expect(result.status).toBe(503);
      expect(result.json).toMatchObject({
        accepted: false,
        persisted: false,
        storage: "none",
      });
      expect((result.json as { detail?: string }).detail).toContain(
        "core_insert_failed:500",
      );
    } finally {
      restoreEnv();
    }
  });
});

describe("integration-gateway release-readiness — IP rate limiter helpers", () => {
  let gw: GatewayModule;
  let restoreEnv: () => void;

  beforeAll(async () => {
    ({ gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      INTERNAL_API_TOKEN: "test-internal-token",
    }));
  });

  afterAll(() => {
    restoreEnv();
    jest.resetModules();
  });

  it("extracts client IP from x-forwarded-for", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as http.IncomingMessage;

    expect(gw.getClientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to socket remoteAddress and unknown", () => {
    const reqWithSocket = {
      headers: {},
      socket: { remoteAddress: "198.51.100.9" },
    } as unknown as http.IncomingMessage;

    const reqUnknown = {
      headers: {},
      socket: {},
    } as unknown as http.IncomingMessage;

    expect(gw.getClientIp(reqWithSocket)).toBe("198.51.100.9");
    expect(gw.getClientIp(reqUnknown)).toBe("unknown");
  });

  it("does not apply limiter for non-protected paths", async () => {
    const check = jest.fn().mockResolvedValue({ ok: true });
    gw.setIpRateLimiterForTest({ check } as unknown as Parameters<
      typeof gw.setIpRateLimiterForTest
    >[0]);

    const req = {
      headers: { "x-forwarded-for": "203.0.113.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as http.IncomingMessage;

    const out = await gw.checkIpRateLimit(req, "/health");
    expect(out).toEqual({ blocked: false });
    expect(check).not.toHaveBeenCalled();
  });

  it("returns blocked with retryAfter when limiter rejects", async () => {
    const check = jest
      .fn()
      .mockResolvedValue({ ok: false, retryAfter: 17 } as const);
    gw.setIpRateLimiterForTest({ check } as unknown as Parameters<
      typeof gw.setIpRateLimiterForTest
    >[0]);

    const req = {
      headers: { "x-forwarded-for": "203.0.113.2" },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as http.IncomingMessage;

    const out = await gw.checkIpRateLimit(req, "/api/v1/webhook/sumup");
    expect(out).toEqual({ blocked: true, retryAfter: 17 });
    expect(check).toHaveBeenCalledWith("203.0.113.2");
  });

  it("returns allowed for protected path when limiter accepts", async () => {
    const check = jest.fn().mockResolvedValue({ ok: true } as const);
    gw.setIpRateLimiterForTest({ check } as unknown as Parameters<
      typeof gw.setIpRateLimiterForTest
    >[0]);

    const req = {
      headers: { "x-forwarded-for": "203.0.113.3" },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as http.IncomingMessage;

    const out = await gw.checkIpRateLimit(req, "/api/v1/payment/pix/checkout");
    expect(out).toEqual({ blocked: false });
  });
});

describe("integration-gateway release-readiness — internal activation/commercial and lead routes", () => {
  let gw: GatewayModule;
  let restoreEnv: () => void;
  let baseUrl: string;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "",
      INTERNAL_API_TOKEN: "test-internal-token",
    }));
    ({ baseUrl, close } = await startGatewayServer(gw));
  });

  afterAll(async () => {
    await close();
    restoreEnv();
    jest.resetModules();
    global.fetch = REAL_FETCH;
  });

  beforeEach(() => {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = toUrl(input);
      if (url.startsWith(baseUrl))
        return REAL_FETCH(input as RequestInfo, init);
      return Promise.resolve(okJson([], 200));
    }) as typeof fetch;
  });

  it("/internal/activation/metrics returns 401 without token", async () => {
    const res = await fetch(baseUrl + "/internal/activation/metrics");
    expect(res.status).toBe(401);
  });

  it("/internal/activation/metrics GET returns endpoint description with token", async () => {
    const res = await fetch(baseUrl + "/internal/activation/metrics", {
      headers: { "X-Internal-Token": "test-internal-token" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      endpoint: "POST /internal/activation/metrics",
    });
  });

  it("/internal/activation/metrics POST returns 400 for invalid JSON", async () => {
    const res = await fetch(baseUrl + "/internal/activation/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: "not-json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON body. Expected { events: [...] }",
    });
  });

  it("/internal/activation/metrics POST returns computed metrics", async () => {
    const res = await fetch(baseUrl + "/internal/activation/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({
        events: [
          {
            event: "trial_start",
            restaurant_id: "r1",
            timestamp: "2026-01-01T10:00:00Z",
          },
          {
            event: "first_order_created",
            restaurant_id: "r1",
            timestamp: "2026-01-01T12:00:00Z",
          },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      trialStarts: 1,
      firstOrders: 1,
      activationRate: 1,
    });
  });

  it("/internal/commercial/event returns 401 without token", async () => {
    const res = await fetch(baseUrl + "/internal/commercial/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("/internal/commercial/event returns 400 for invalid JSON", async () => {
    const res = await fetch(baseUrl + "/internal/commercial/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: "{ bad-json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON body",
    });
  });

  it("/internal/commercial/event validates restaurant_id and event_type", async () => {
    const invalidRestaurant = await fetch(
      baseUrl + "/internal/commercial/event",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          restaurant_id: "not-a-uuid",
          event_type: "trial_start",
        }),
      },
    );
    expect(invalidRestaurant.status).toBe(400);

    const invalidEventType = await fetch(
      baseUrl + "/internal/commercial/event",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          restaurant_id: "11111111-1111-4111-8111-111111111111",
          event_type: "invalid_event",
        }),
      },
    );
    expect(invalidEventType.status).toBe(400);
    const body = await invalidEventType.json();
    expect(body).toMatchObject({ error: "validation_error" });
  });

  it("/internal/commercial/event rejects payload_json larger than 10kb", async () => {
    const res = await fetch(baseUrl + "/internal/commercial/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({
        restaurant_id: "11111111-1111-4111-8111-111111111111",
        event_type: "trial_started",
        payload_json: { blob: "x".repeat(10_100) },
      }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "validation_error",
      message: "payload_json must be < 10kb",
    });
  });

  it("/internal/commercial/event returns persisted:false when CORE_SERVICE_KEY is missing", async () => {
    const res = await fetch(baseUrl + "/internal/commercial/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({
        restaurant_id: "11111111-1111-4111-8111-111111111111",
        event_type: "first_login",
      }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, persisted: false });
  });

  it("/api/public/lead-capture proxies to lead handler", async () => {
    const res = await fetch(baseUrl + "/api/public/lead-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "route.lead@example.com",
        country: "ES",
        source: "landing",
      }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      ok: true,
      message: "Lead received (persistence disabled)",
    });
  });
});

describe("integration-gateway release-readiness — commercial event persistence with Core", () => {
  let gw: GatewayModule;
  let restoreEnv: () => void;
  let baseUrl: string;
  let close: () => Promise<void>;

  let persistMode: "ok" | "core5xx" | "core4xx" | "throw" = "ok";

  beforeAll(async () => {
    ({ gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    }));
    ({ baseUrl, close } = await startGatewayServer(gw));
  });

  afterAll(async () => {
    await close();
    restoreEnv();
    jest.resetModules();
    global.fetch = REAL_FETCH;
  });

  beforeEach(() => {
    persistMode = "ok";
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = toUrl(input);
      if (url.startsWith(baseUrl))
        return REAL_FETCH(input as RequestInfo, init);
      if (url.includes("/rest/v1/gm_commercial_events")) {
        if (persistMode === "ok") return Promise.resolve(okJson({}, 201));
        if (persistMode === "core5xx")
          return Promise.resolve(errText(500, "core unavailable"));
        if (persistMode === "core4xx")
          return Promise.resolve(errText(409, "duplicate event"));
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve(okJson([], 200));
    }) as typeof fetch;
  });

  async function postCommercialEvent(body: object): Promise<Response> {
    return fetch(baseUrl + "/internal/commercial/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify(body),
    });
  }

  it("returns persisted:true when core insert succeeds", async () => {
    const res = await postCommercialEvent({
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      event_type: "first_payment_received",
      country: "BR",
      segment: "small",
      device: "mobile",
      utm_source: "google",
      utm_campaign: "spring",
      payload_json: { source: "campaign" },
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, persisted: true });
  });

  it("returns persisted:false when core responds 5xx", async () => {
    persistMode = "core5xx";
    const res = await postCommercialEvent({
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      event_type: "billing_started",
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, persisted: false });
  });

  it("returns persisted:false when core responds 4xx", async () => {
    persistMode = "core4xx";
    const res = await postCommercialEvent({
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      event_type: "billing_converted",
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, persisted: false });
  });

  it("returns persisted:false when persistence throws", async () => {
    persistMode = "throw";
    const res = await postCommercialEvent({
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      event_type: "onboarding_completed",
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, persisted: false });
  });
});

describe("integration-gateway release-readiness — /api/v1/payments route mapping", () => {
  let gw: GatewayModule;
  let restoreEnv: () => void;
  let baseUrl: string;
  let close: () => Promise<void>;

  let createIntentRpc: () => Promise<Response>;
  let captureRpc: () => Promise<Response>;
  let markPixPaidRpc: () => Promise<Response>;
  let lastCreateIntentRpcBody: Record<string, unknown> | null;

  beforeAll(async () => {
    ({ gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "test",
      CORE_SERVICE_KEY: "core-service-key",
      INTERNAL_API_TOKEN: "test-internal-token",
    }));
    ({ baseUrl, close } = await startGatewayServer(gw));
  });

  afterAll(async () => {
    await close();
    restoreEnv();
    jest.resetModules();
    global.fetch = REAL_FETCH;
  });

  beforeEach(() => {
    createIntentRpc = async () => okJson({ id: "pi_1" }, 200);
    captureRpc = async () => okJson({ id: "pi_1", status: "captured" }, 200);
    markPixPaidRpc = async () => okJson({ id: "pi_1", status: "paid" }, 200);
    lastCreateIntentRpcBody = null;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = toUrl(input);
      if (url.startsWith(baseUrl))
        return REAL_FETCH(input as RequestInfo, init);
      if (url.includes("/rpc/create_payment_intent")) {
        try {
          lastCreateIntentRpcBody = JSON.parse(
            String(init?.body ?? "{}"),
          ) as Record<string, unknown>;
        } catch {
          lastCreateIntentRpcBody = null;
        }
        return createIntentRpc();
      }
      if (url.includes("/rpc/capture_payment_intent")) return captureRpc();
      if (url.includes("/rpc/mark_pix_paid")) return markPixPaidRpc();
      return Promise.resolve(okJson([], 200));
    }) as typeof fetch;
  });

  async function post(
    path: string,
    body: unknown,
    token = true,
  ): Promise<Response> {
    return fetch(baseUrl + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Internal-Token": "test-internal-token" } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("/api/v1/payments/intents maps unauthorized, invalid JSON and validation_error", async () => {
    const unauthorized = await post("/api/v1/payments/intents", {}, false);
    expect(unauthorized.status).toBe(401);

    const invalidJson = await post("/api/v1/payments/intents", "{ not-json }");
    expect(invalidJson.status).toBe(400);

    const validation = await post("/api/v1/payments/intents", {
      restaurant_id: "",
      amount: 0,
      method: "pix",
      country: "BR",
    });
    expect(validation.status).toBe(400);
    expect(await validation.json()).toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });
  });

  it("/api/v1/payments/intents maps success, subscription_blocked and fallback 500", async () => {
    const success = await post("/api/v1/payments/intents", {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      order_id: "ord_1",
      idempotency_key: "checkout:ord_1:retry_1",
      amount: 1000,
      method: "pix",
      country: "BR",
      actor_user_id: "user_1",
    });
    expect(success.status).toBe(201);
    expect(lastCreateIntentRpcBody).toMatchObject({
      p_idempotency_key: "checkout:ord_1:retry_1",
    });

    createIntentRpc = async () => errText(403, "SUBSCRIPTION_BLOCKED");
    const blocked = await post("/api/v1/payments/intents", {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      order_id: "ord_1",
      amount: 1000,
      method: "pix",
      country: "BR",
    });
    expect(blocked.status).toBe(403);
    expect(await blocked.json()).toMatchObject({
      ok: false,
      error: { code: "subscription_blocked" },
    });

    createIntentRpc = async () => errText(500, "unexpected rpc failure");
    const fallback = await post("/api/v1/payments/intents", {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      order_id: "ord_1",
      amount: 1000,
      method: "pix",
      country: "BR",
    });
    expect(fallback.status).toBe(500);

    createIntentRpc = async () => errText(404, "ORDER_NOT_FOUND");
    const notFound = await post("/api/v1/payments/intents", {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      order_id: "ord_1",
      amount: 1000,
      method: "pix",
      country: "BR",
    });
    expect(notFound.status).toBe(404);

    createIntentRpc = async () => errText(409, "INVALID_TRANSITION");
    const invalidTransition = await post("/api/v1/payments/intents", {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      order_id: "ord_1",
      amount: 1000,
      method: "pix",
      country: "BR",
    });
    expect(invalidTransition.status).toBe(409);

    createIntentRpc = async () => errText(504, "UPSTREAM_TIMEOUT");
    const upstreamTimeout = await post("/api/v1/payments/intents", {
      restaurant_id: "11111111-1111-4111-8111-111111111111",
      order_id: "ord_1",
      amount: 1000,
      method: "pix",
      country: "BR",
    });
    expect(upstreamTimeout.status).toBe(502);
  });

  it("/api/v1/payments/capture maps unauthorized, invalid JSON, validation and success", async () => {
    const unauthorized = await post("/api/v1/payments/capture", {}, false);
    expect(unauthorized.status).toBe(401);

    const invalidJson = await post("/api/v1/payments/capture", "{ not-json }");
    expect(invalidJson.status).toBe(400);

    const validation = await post("/api/v1/payments/capture", {
      intent_id: "",
    });
    expect(validation.status).toBe(400);
    expect(await validation.json()).toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });

    const success = await post("/api/v1/payments/capture", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(success.status).toBe(200);
  });

  it("/api/v1/payments/capture maps intent_not_found, subscription_blocked and fallback 500", async () => {
    captureRpc = async () => errText(404, "PAYMENT_INTENT_NOT_FOUND");
    const notFound = await post("/api/v1/payments/capture", {
      intent_id: "missing",
      actor_user_id: "user_1",
    });
    expect(notFound.status).toBe(400);

    captureRpc = async () => errText(403, "SUBSCRIPTION_BLOCKED");
    const blocked = await post("/api/v1/payments/capture", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(blocked.status).toBe(403);

    captureRpc = async () => errText(500, "capture failed");
    const fallback = await post("/api/v1/payments/capture", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(fallback.status).toBe(500);

    captureRpc = async () => errText(403, "ACTOR_REQUIRED");
    const forbidden = await post("/api/v1/payments/capture", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(forbidden.status).toBe(403);

    captureRpc = async () => errText(504, "UPSTREAM_UNAVAILABLE");
    const upstreamUnavailable = await post("/api/v1/payments/capture", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(upstreamUnavailable.status).toBe(502);
  });

  it("/api/v1/payments/pix/paid maps unauthorized, invalid JSON, validation and success", async () => {
    const unauthorized = await post("/api/v1/payments/pix/paid", {}, false);
    expect(unauthorized.status).toBe(401);

    const invalidJson = await post("/api/v1/payments/pix/paid", "{ not-json }");
    expect(invalidJson.status).toBe(400);

    const validation = await post("/api/v1/payments/pix/paid", {
      intent_id: "pi_1",
      actor_user_id: "",
    });
    expect(validation.status).toBe(400);

    const success = await post("/api/v1/payments/pix/paid", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
      proof_text: "paid via pix",
    });
    expect(success.status).toBe(200);
  });

  it("/api/v1/payments/pix/paid maps intent_not_found, invalid_provider, forbidden and fallback 500", async () => {
    markPixPaidRpc = async () => errText(404, "PAYMENT_INTENT_NOT_FOUND");
    const notFound = await post("/api/v1/payments/pix/paid", {
      intent_id: "missing",
      actor_user_id: "user_1",
    });
    expect(notFound.status).toBe(400);

    markPixPaidRpc = async () => errText(400, "INVALID_PROVIDER");
    const invalidProvider = await post("/api/v1/payments/pix/paid", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(invalidProvider.status).toBe(400);

    markPixPaidRpc = async () => errText(403, "UNAUTHORIZED");
    const forbidden = await post("/api/v1/payments/pix/paid", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(forbidden.status).toBe(403);

    markPixPaidRpc = async () => errText(500, "mark paid failed");
    const fallback = await post("/api/v1/payments/pix/paid", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(fallback.status).toBe(500);

    markPixPaidRpc = async () => errText(504, "UPSTREAM_TIMEOUT");
    const upstreamTimeout = await post("/api/v1/payments/pix/paid", {
      intent_id: "pi_1",
      actor_user_id: "user_1",
    });
    expect(upstreamTimeout.status).toBe(502);
  });
});

describe("integration-gateway release-readiness — validateRequiredEnv in production", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("calls process.exit when required env vars are missing", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "production",
      INTERNAL_API_TOKEN: "",
      CORE_SERVICE_KEY: "",
      CORS_ORIGIN: "",
      SUPABASE_JWT_SECRET: "",
      STRIPE_SECRET_KEY: "",
      SENTRY_DSN: "",
    });
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    try {
      gw.validateRequiredEnv();
      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      exitSpy.mockRestore();
      restoreEnv();
    }
  });

  it("does not exit when required env vars are present", async () => {
    const { gw, restoreEnv } = await importGatewayWithEnv({
      NODE_ENV: "production",
      INTERNAL_API_TOKEN: "internal-token",
      CORE_SERVICE_KEY: "service-key",
      CORS_ORIGIN: "https://www.chefiapp.com",
      SUPABASE_JWT_SECRET: "",
      STRIPE_SECRET_KEY: "",
      SENTRY_DSN: "",
    });
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    try {
      gw.validateRequiredEnv();
      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
      restoreEnv();
    }
  });
});
