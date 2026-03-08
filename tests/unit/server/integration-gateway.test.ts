/**
 * Unit tests for server/integration-gateway — risk reduction (Fase 1 Server).
 * Tests handlers and helpers without starting the HTTP server.
 * Env must be set before gateway is loaded (STRIPE_PRICE_MAP, BILLING_ALLOWED_ORIGINS).
 */
process.env.NODE_ENV = "test";
process.env.STRIPE_SECRET_KEY = "";
process.env.INTERNAL_API_TOKEN = "test-internal-token";
process.env.CORE_SERVICE_KEY = "";
process.env.SUMUP_WEBHOOK_SECRET = "";

jest.mock("../../../server/imageProcessor", () => ({
  processProductImage: jest.fn(),
}));
jest.mock("../../../server/minioStorage", () => ({
  uploadProductImage: jest.fn(),
}));

const mockCheckoutSessionsCreate = jest.fn();
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  })),
}));

import * as imageProcessor from "../../../server/imageProcessor";
import {
  apiError,
  getOriginFromUrl,
  handleInternalEvents,
  handleProductImageUpload,
  handleSumUpWebhook,
  isBillingOriginAllowed,
  resolveStripePriceId,
  server,
  verifyRestaurantOwner,
  verifySupabaseJwt,
} from "../../../server/integration-gateway";
import * as minioStorage from "../../../server/minioStorage";

const mockProcessProductImage = jest.mocked(imageProcessor.processProductImage);
const mockUploadProductImage = jest.mocked(minioStorage.uploadProductImage);

describe("integration-gateway — helpers and auth", () => {
  describe("apiError", () => {
    it("returns object with error and message", () => {
      const out = apiError("validation_error", "Invalid JSON body");
      expect(out).toEqual({
        error: "validation_error",
        message: "Invalid JSON body",
      });
    });

    it("includes details when provided (object)", () => {
      const out = apiError("rate_limit", "Too many requests", {
        retryAfter: 60,
      });
      expect(out).toEqual({
        error: "rate_limit",
        message: "Too many requests",
        details: { retryAfter: 60 },
      });
    });

    it("includes details when provided (string)", () => {
      const out = apiError("bad_request", "Missing field", "field_name");
      expect(out).toEqual({
        error: "bad_request",
        message: "Missing field",
        details: "field_name",
      });
    });
  });

  describe("getOriginFromUrl", () => {
    it("returns origin from valid URL", () => {
      expect(getOriginFromUrl("https://www.chefiapp.com/path?q=1")).toBe(
        "https://www.chefiapp.com",
      );
      expect(getOriginFromUrl("http://localhost:5175/app")).toBe(
        "http://localhost:5175",
      );
    });

    it("returns null for invalid URL", () => {
      expect(getOriginFromUrl("not-a-url")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(getOriginFromUrl("")).toBeNull();
    });
  });

  describe("isBillingOriginAllowed", () => {
    it("allows chefiapp.com and localhost in test", () => {
      expect(isBillingOriginAllowed("https://www.chefiapp.com")).toBe(true);
      expect(isBillingOriginAllowed("https://chefiapp.com")).toBe(true);
      expect(isBillingOriginAllowed("http://localhost:5175")).toBe(true);
    });

    it("rejects null or unknown origin", () => {
      expect(isBillingOriginAllowed(null)).toBe(false);
      expect(isBillingOriginAllowed("https://evil.com")).toBe(false);
    });

    it("uses BILLING_ALLOWED_ORIGINS when set at load (raw branch)", async () => {
      process.env.BILLING_ALLOWED_ORIGINS =
        "https://custom.app, https://other.app";
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      try {
        expect(gw.isBillingOriginAllowed("https://custom.app")).toBe(true);
        expect(gw.isBillingOriginAllowed("https://other.app")).toBe(true);
        expect(gw.isBillingOriginAllowed("https://unknown.com")).toBe(false);
      } finally {
        delete process.env.BILLING_ALLOWED_ORIGINS;
        jest.resetModules();
      }
    });
  });

  describe("resolveStripePriceId", () => {
    it("passes through price_xxx as-is", () => {
      expect(resolveStripePriceId("price_123")).toBe("price_123");
    });

    it("resolves dev defaults in mock mode (pro, starter, enterprise)", () => {
      expect(resolveStripePriceId("pro")).toBe("price_dev_pro");
      expect(resolveStripePriceId("starter")).toBe("price_dev_starter");
      expect(resolveStripePriceId("enterprise")).toBe("price_dev_enterprise");
    });

    it("returns null for unknown slug in mock mode", () => {
      expect(resolveStripePriceId("unknown_plan")).toBeNull();
    });
  });
});

describe("integration-gateway — POST /internal/events", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns 400 for invalid JSON body", async () => {
    const result = await handleInternalEvents("not json");
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "invalid_json",
      message: "Invalid JSON body",
    });
  });

  it("returns 400 when event or restaurant_id missing", async () => {
    const noEvent = await handleInternalEvents(
      JSON.stringify({ restaurant_id: "r1", payload: {} }),
    );
    expect(noEvent.status).toBe(400);
    expect(noEvent.json).toMatchObject({
      error: "bad_request",
      message: "event and restaurant_id required",
    });

    const noRestaurant = await handleInternalEvents(
      JSON.stringify({ event: "order.created", payload: {} }),
    );
    expect(noRestaurant.status).toBe(400);
    expect(noRestaurant.json).toMatchObject({
      error: "bad_request",
      message: "event and restaurant_id required",
    });
  });

  it("returns 202 with delivery_id when body valid and fetch returns empty configs", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await handleInternalEvents(
      JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: { orderId: "o1" },
      }),
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({
      accepted: true,
      endpoints: 0,
    });
    expect((result.json as { delivery_id?: string }).delivery_id).toMatch(
      /^wh_evt_/,
    );
  });

  it("returns 202 and calls deliverOne when fetch returns webhook configs", async () => {
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "wc1",
            url: "https://example.com/webhook",
            secret: "s1",
            events: ["order.created"],
            enabled: true,
          },
        ],
      })
      .mockResolvedValueOnce({ ok: true }); // deliverOne POST to webhook endpoint

    const result = await handleInternalEvents(
      JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: {},
      }),
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({ accepted: true, endpoints: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    process.env.CORE_SERVICE_KEY = "";
  });

  describe("when CORE_SERVICE_KEY set at load (insertDeliveryLog branch)", () => {
    let handleInternalEventsWithKey: typeof handleInternalEvents;

    beforeAll(async () => {
      process.env.CORE_SERVICE_KEY = "delivery-log-test-key";
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      handleInternalEventsWithKey = gw.handleInternalEvents;
    });

    afterAll(() => {
      process.env.CORE_SERVICE_KEY = "";
      jest.resetModules();
    });

    it("calls insertDeliveryLog and handles !res.ok (delivery log failure)", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              id: "wc1",
              url: "https://example.com/wh",
              secret: "s",
              events: ["order.created"],
              enabled: true,
            },
          ],
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "db error",
        });

      const result = await handleInternalEventsWithKey(
        JSON.stringify({
          event: "order.created",
          restaurant_id: "r1",
          payload: {},
        }),
      );
      expect(result.status).toBe(202);
      expect(result.json).toMatchObject({ accepted: true, endpoints: 1 });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("deliverOne retries on 429 and succeeds on second attempt", async () => {
      let webhookCalls = 0;
      (global.fetch as jest.Mock).mockImplementation(
        (input: RequestInfo | URL) => {
          const u = String(
            typeof input === "string" ? input : (input as Request).url,
          );
          if (u.includes("webhook_out_config")) {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: "wc1",
                  url: "https://example.com/wh",
                  secret: "s",
                  events: ["order.created"],
                  enabled: true,
                },
              ],
            });
          }
          if (u.includes("example.com/wh")) {
            webhookCalls++;
            return Promise.resolve(
              webhookCalls === 1
                ? { ok: false, status: 429, text: async () => "rate limit" }
                : { ok: true },
            );
          }
          if (u.includes("webhook_out_delivery_log"))
            return Promise.resolve({ ok: true });
          return Promise.reject(new Error("Unexpected URL"));
        },
      );

      const result = await handleInternalEventsWithKey(
        JSON.stringify({
          event: "order.created",
          restaurant_id: "r1",
          payload: {},
        }),
      );
      expect(result.status).toBe(202);
      expect(result.json).toMatchObject({ accepted: true, endpoints: 1 });
      expect(webhookCalls).toBe(2);
    });

    it("deliverOne catch (fetch throws) then retry succeeds", async () => {
      let webhookCalls = 0;
      (global.fetch as jest.Mock).mockImplementation(
        (input: RequestInfo | URL) => {
          const u = String(
            typeof input === "string" ? input : (input as Request).url,
          );
          if (u.includes("webhook_out_config")) {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: "wc1",
                  url: "https://example.com/wh",
                  secret: "s",
                  events: ["order.created"],
                  enabled: true,
                },
              ],
            });
          }
          if (u.includes("example.com/wh")) {
            webhookCalls++;
            if (webhookCalls === 1)
              return Promise.reject(new Error("Network error"));
            return Promise.resolve({ ok: true });
          }
          if (u.includes("webhook_out_delivery_log"))
            return Promise.resolve({ ok: true });
          return Promise.reject(new Error("Unexpected URL"));
        },
      );

      const result = await handleInternalEventsWithKey(
        JSON.stringify({
          event: "order.created",
          restaurant_id: "r1",
          payload: {},
        }),
      );
      expect(result.status).toBe(202);
      expect(result.json).toMatchObject({ accepted: true, endpoints: 1 });
      expect(webhookCalls).toBe(2);
    });

    it("deliverOne does not retry on 4xx (e.g. 404)", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        (input: RequestInfo | URL) => {
          const u = String(
            typeof input === "string" ? input : (input as Request).url,
          );
          if (u.includes("webhook_out_config")) {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: "wc1",
                  url: "https://example.com/wh",
                  secret: "s",
                  events: ["order.created"],
                  enabled: true,
                },
              ],
            });
          }
          if (u.includes("example.com/wh"))
            return Promise.resolve({
              ok: false,
              status: 404,
              text: async () => "Not Found",
            });
          if (u.includes("webhook_out_delivery_log"))
            return Promise.resolve({ ok: true });
          return Promise.reject(new Error("Unexpected URL"));
        },
      );

      const result = await handleInternalEventsWithKey(
        JSON.stringify({
          event: "order.created",
          restaurant_id: "r1",
          payload: {},
        }),
      );
      expect(result.status).toBe(202);
      expect(result.json).toMatchObject({ accepted: true, endpoints: 1 });
      expect(global.fetch).toHaveBeenCalledTimes(3); // config + webhook + delivery_log (no retry)
    });
  });

  it("returns 202 and delivers when config has events: [] (events.length === 0)", async () => {
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "wc1",
            url: "https://example.com/wh",
            secret: "s",
            events: [],
            enabled: true,
          },
        ],
      })
      .mockResolvedValueOnce({ ok: true });

    const result = await handleInternalEvents(
      JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: {},
      }),
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({ accepted: true, endpoints: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    process.env.CORE_SERVICE_KEY = "";
  });

  it("returns 202 with endpoints 0 when configs have events that do not include this event", async () => {
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "wc1",
          url: "https://example.com/webhook",
          secret: "s1",
          events: ["order.updated"],
          enabled: true,
        },
      ],
    });

    const result = await handleInternalEvents(
      JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: {},
      }),
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({ accepted: true, endpoints: 0 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    process.env.CORE_SERVICE_KEY = "";
  });
});

describe("integration-gateway — POST /api/v1/webhook/sumup", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns 400 for invalid JSON body", async () => {
    const result = await handleSumUpWebhook("not json", undefined);
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "invalid_json",
      message: "Invalid JSON body",
    });
  });

  it("returns 202 with 'event logged only' when CORE_SERVICE_KEY not set", async () => {
    const result = await handleSumUpWebhook(
      JSON.stringify({ id: "pay1", status: "PAID" }),
      undefined,
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({
      received: true,
      message: "CORE_SERVICE_KEY not set, event logged only",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid signature when SUMUP_WEBHOOK_SECRET set", async () => {
    const prev = process.env.SUMUP_WEBHOOK_SECRET;
    process.env.SUMUP_WEBHOOK_SECRET = "my-secret";
    const body = JSON.stringify({ id: "pay1" });
    const wrongSig = "sha256=wrong";
    const result = await handleSumUpWebhook(body, wrongSig);
    expect(result.status).toBe(401);
    expect(result.json).toMatchObject({
      error: "unauthorized",
      message: "Invalid webhook signature",
    });
    process.env.SUMUP_WEBHOOK_SECRET = prev ?? "";
  });

  it("with CORE_SERVICE_KEY mocked: returns 202 when RPC succeeds", async () => {
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ success: true, message: "OK" }],
    });

    const result = await handleSumUpWebhook(
      JSON.stringify({ id: "pay1", status: "PAID" }),
      undefined,
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({ received: true, event_id: "pay1" });
    process.env.CORE_SERVICE_KEY = "";
  });

  it("with CORE_SERVICE_KEY mocked: returns 500 when fetch throws", async () => {
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const result = await handleSumUpWebhook(
      JSON.stringify({ id: "pay1" }),
      undefined,
    );
    expect(result.status).toBe(500);
    expect(result.json).toMatchObject({
      error: "internal_error",
      message: "Failed to process webhook",
    });
    expect((result.json as { details?: string }).details).toBe("Network error");
    process.env.CORE_SERVICE_KEY = "";
  });

  it("generates synthetic event_id when payload has no paymentId/event_id/id", async () => {
    const result = await handleSumUpWebhook(
      JSON.stringify({ status: "PENDING" }),
      undefined,
    );
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({ received: true });
    const eventId = (result.json as { event_id?: string }).event_id;
    expect(eventId).toMatch(/^sumup_\d+_[a-z0-9]+$/);
  });

  it("returns RPC status and webhook_failed when res.ok is false", async () => {
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid payload" }),
      text: async () => "Invalid payload",
    });

    const result = await handleSumUpWebhook(
      JSON.stringify({ id: "pay1", status: "PAID" }),
      undefined,
    );
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "webhook_failed",
      message: "Invalid payload",
    });
    process.env.CORE_SERVICE_KEY = "";
  });

  it("accepts valid signature when SUMUP_WEBHOOK_SECRET is set", async () => {
    const crypto = await import("crypto");
    const secret = "webhook-secret";
    const body = JSON.stringify({ id: "pay1", status: "PAID" });
    const sigHex = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");
    const signature = `sha256=${sigHex}`;

    process.env.SUMUP_WEBHOOK_SECRET = secret;
    process.env.CORE_SERVICE_KEY = "test-core-key";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ success: true }],
    });

    const result = await handleSumUpWebhook(body, signature);
    expect(result.status).toBe(202);
    expect(result.json).toMatchObject({ received: true, event_id: "pay1" });

    process.env.SUMUP_WEBHOOK_SECRET = "";
    process.env.CORE_SERVICE_KEY = "";
  });
});

describe("integration-gateway — POST /internal/product-images", () => {
  beforeEach(() => {
    mockProcessProductImage.mockReset();
    mockUploadProductImage.mockReset();
  });

  it("returns 400 for invalid JSON body", async () => {
    const result = await handleProductImageUpload("not json");
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "invalid_json",
      message: "Invalid JSON body",
    });
  });

  it("accepts data_base64 with data URL prefix (extractBase64Payload comma branch)", async () => {
    mockProcessProductImage.mockResolvedValueOnce(Buffer.from("ok"));
    mockUploadProductImage.mockResolvedValueOnce("https://storage/img.webp");
    const result = await handleProductImageUpload(
      JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64:
          "data:image/jpeg;base64," + Buffer.from("image").toString("base64"),
      }),
    );
    expect(result.status).toBe(200);
    expect(result.json).toMatchObject({
      image_url: "https://storage/img.webp",
    });
  });

  it("returns 400 when restaurant_id, product_id or data_base64 missing", async () => {
    const result = await handleProductImageUpload(
      JSON.stringify({ restaurant_id: "r1", product_id: "p1" }),
    );
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "bad_request",
      message: "restaurant_id, product_id, data_base64 required",
    });
  });

  it("returns 400 when data_base64 is empty (extractBase64Payload yields empty)", async () => {
    // Gateway uses Buffer.from(raw, "base64"); Node accepts many strings without throwing.
    // So we test missing required field instead; invalid base64 path is covered by implementation.
    const result = await handleProductImageUpload(
      JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: "",
      }),
    );
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({
      error: "bad_request",
      message: "restaurant_id, product_id, data_base64 required",
    });
  });

  it("returns 400 when Buffer.from(raw, 'base64') throws (invalid base64 payload)", async () => {
    const origFrom = Buffer.from.bind(Buffer);
    const fromSpy = jest
      .spyOn(Buffer, "from")
      .mockImplementation((arg: unknown, encodingOrOffset?: unknown) => {
        if (encodingOrOffset === "base64") throw new Error("Invalid character");
        return origFrom(arg as string, encodingOrOffset as BufferEncoding);
      });
    try {
      const result = await handleProductImageUpload(
        JSON.stringify({
          restaurant_id: "r1",
          product_id: "p1",
          data_base64: origFrom("x").toString("base64"),
        }),
      );
      expect(result.status).toBe(400);
      expect(result.json).toMatchObject({
        error: "bad_request",
        message: "Invalid base64 payload",
      });
    } finally {
      fromSpy.mockRestore();
    }
  });

  it("returns 200 with image_url when process and upload succeed", async () => {
    mockProcessProductImage.mockResolvedValueOnce(Buffer.from("processed"));
    mockUploadProductImage.mockResolvedValueOnce(
      "https://storage.example/img.webp",
    );

    const result = await handleProductImageUpload(
      JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: Buffer.from("fake-image").toString("base64"),
      }),
    );
    expect(result.status).toBe(200);
    expect(result.json).toMatchObject({
      image_url: "https://storage.example/img.webp",
      mime: "image/webp",
    });
    expect(mockProcessProductImage).toHaveBeenCalledTimes(1);
    expect(mockUploadProductImage).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when processProductImage throws", async () => {
    mockProcessProductImage.mockRejectedValueOnce(new Error("sharp failed"));
    mockUploadProductImage.mockResolvedValue("https://storage/url");

    const result = await handleProductImageUpload(
      JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: Buffer.from("fake-image-bytes").toString("base64"),
      }),
    );

    expect(result.status).toBe(500);
    expect(result.json).toMatchObject({
      error: "upload_failed",
      message: "Failed to process or upload image",
    });
    expect(mockUploadProductImage).not.toHaveBeenCalled();
  });

  it("returns 500 with detail from String(err) when processProductImage rejects with non-Error", async () => {
    mockProcessProductImage.mockRejectedValueOnce("plain string rejection");
    mockUploadProductImage.mockResolvedValue("https://storage/url");

    const result = await handleProductImageUpload(
      JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: Buffer.from("x").toString("base64"),
      }),
    );
    expect(result.status).toBe(500);
    expect(result.json).toMatchObject({
      error: "upload_failed",
      message: "Failed to process or upload image",
      details: expect.objectContaining({ detail: "plain string rejection" }),
    });
  });

  it("returns 500 when uploadProductImage throws", async () => {
    mockProcessProductImage.mockResolvedValueOnce(Buffer.from("ok"));
    mockUploadProductImage.mockRejectedValueOnce(new Error("S3 error"));

    const result = await handleProductImageUpload(
      JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: Buffer.from("x").toString("base64"),
      }),
    );
    expect(result.status).toBe(500);
    expect(result.json).toMatchObject({
      error: "upload_failed",
      message: "Failed to process or upload image",
    });
  });

  describe("when CORE_SERVICE_KEY set at load (PATCH gm_products branch)", () => {
    let handleProductImageUploadWithKey: typeof handleProductImageUpload;
    const realFetch = global.fetch;

    beforeAll(async () => {
      process.env.CORE_SERVICE_KEY = "product-patch-key";
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      handleProductImageUploadWithKey = gw.handleProductImageUpload;
    });

    afterAll(() => {
      process.env.CORE_SERVICE_KEY = "";
      jest.resetModules();
      global.fetch = realFetch;
    });

    it("PATCHes gm_products when upload succeeds", async () => {
      const minioStorageMod = await import("../../../server/minioStorage");
      (minioStorageMod.uploadProductImage as jest.Mock).mockImplementation(() =>
        Promise.resolve("https://storage/img.webp"),
      );
      (
        (await import("../../../server/imageProcessor"))
          .processProductImage as jest.Mock
      ).mockImplementation(() => Promise.resolve(Buffer.from("ok")));
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as typeof fetch;

      const result = await handleProductImageUploadWithKey(
        JSON.stringify({
          restaurant_id: "r1",
          product_id: "p1",
          data_base64: Buffer.from("image").toString("base64"),
        }),
      );
      expect(result.status).toBe(200);
      expect(result.json).toMatchObject({
        image_url: "https://storage/img.webp",
        mime: "image/webp",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("gm_products"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });
});

describe("integration-gateway — POST /internal/billing/create-checkout-session (helpers)", () => {
  it("resolveStripePriceId and origin helpers cover validation behaviour", () => {
    expect(resolveStripePriceId("unknown")).toBeNull();
    expect(getOriginFromUrl("https://chefiapp.com/checkout")).toBe(
      "https://chefiapp.com",
    );
    expect(isBillingOriginAllowed("https://chefiapp.com")).toBe(true);
    expect(isBillingOriginAllowed("https://other.com")).toBe(false);
  });
});

describe("integration-gateway — HTTP smoke (optional)", () => {
  let baseUrl: string;
  const originalFetch = global.fetch;

  beforeAll((done) => {
    server.listen(0, () => {
      const addr = server.address();
      const port =
        typeof addr === "object" && addr !== null && "port" in addr
          ? addr.port
          : 4320;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Delegate requests to our server to real fetch; mock outbound (Core, etc.) for handler tests
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;
      if (url && String(url).startsWith("http://127.0.0.1"))
        return originalFetch(input as RequestInfo, init);
      return Promise.resolve({
        ok: true,
        json: async () => [],
        status: 200,
      } as Response);
    }) as typeof fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("GET / returns 200 with service info", async () => {
    const res = await fetch(baseUrl + "/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      service: "ChefIApp-POS-CORE",
      gateway: "integration-gateway",
      health: "/health",
    });
  });

  it("GET /health returns 200 with status ok", async () => {
    const res = await fetch(baseUrl + "/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      status: "ok",
      service: "integration-gateway",
    });
  });

  it("OPTIONS returns 204", async () => {
    const res = await fetch(baseUrl + "/internal/events", {
      method: "OPTIONS",
    });
    expect(res.status).toBe(204);
  });

  it("GET /favicon.ico returns 204", async () => {
    const res = await fetch(baseUrl + "/favicon.ico");
    expect(res.status).toBe(204);
  });

  it("GET unknown path returns 404 not_found (fallback)", async () => {
    const res = await fetch(baseUrl + "/api/v2/unknown");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({ error: "not_found", message: "Not found" });
  });

  it("POST /internal/events without token returns 401", async () => {
    const res = await fetch(baseUrl + "/internal/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: {},
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("POST /internal/events with token returns 500 when fetch (Core) throws (chaos)", async () => {
    process.env.CORE_SERVICE_KEY = "test-key"; // so fetchWebhookConfigs actually calls fetch
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;
      if (url && String(url).startsWith("http://127.0.0.1"))
        return originalFetch(input as RequestInfo, init);
      return Promise.reject(new Error("Core unreachable"));
    }) as typeof fetch;
    const res = await fetch(baseUrl + "/internal/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: {},
      }),
    });
    process.env.CORE_SERVICE_KEY = "";
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "internal_error",
      message: "Internal server error",
    });
  });

  it("POST /internal/events with token returns 202 when body valid", async () => {
    // Outbound fetch (Core webhook configs) is mocked in beforeEach to return []
    const res = await fetch(baseUrl + "/internal/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({
        event: "order.created",
        restaurant_id: "r1",
        payload: {},
      }),
    });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body).toMatchObject({ accepted: true, endpoints: 0 });
  });

  it("POST /internal/product-images without token returns 401", async () => {
    const res = await fetch(baseUrl + "/internal/product-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: Buffer.from("x").toString("base64"),
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("POST /internal/product-images with token returns 200 when process and upload succeed", async () => {
    mockProcessProductImage.mockResolvedValueOnce(Buffer.from("ok"));
    mockUploadProductImage.mockResolvedValueOnce("https://storage/img.webp");
    const res = await fetch(baseUrl + "/internal/product-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({
        restaurant_id: "r1",
        product_id: "p1",
        data_base64: Buffer.from("image").toString("base64"),
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      image_url: "https://storage/img.webp",
      mime: "image/webp",
    });
  });

  it("POST /api/v1/webhook/sumup returns 202 (event logged only when no CORE_SERVICE_KEY)", async () => {
    const res = await fetch(baseUrl + "/api/v1/webhook/sumup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "pay1", status: "PAID" }),
    });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body).toMatchObject({ received: true });
  });

  const validRestaurantId = "00000000-0000-0000-0000-000000000100";

  it("POST /internal/billing/create-checkout-session without token returns 401", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: "pro",
          success_url: "https://x.com",
          cancel_url: "https://x.com",
          restaurant_id: validRestaurantId,
        }),
      },
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 400 for invalid JSON body (poison)", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: "{ not valid json }",
      },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON body",
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 400 when price_id missing", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          success_url: "https://chefiapp.com/success",
          cancel_url: "https://chefiapp.com/cancel",
          restaurant_id: validRestaurantId,
        }),
      },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "price_id, success_url and cancel_url are required",
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 400 when restaurant_id missing", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          price_id: "pro",
          success_url: "https://chefiapp.com/success",
          cancel_url: "https://chefiapp.com/cancel",
        }),
      },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: expect.stringMatching(
        /restaurant_id.*required|required.*restaurant_id/i,
      ),
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 400 when restaurant_id invalid", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          price_id: "pro",
          success_url: "https://chefiapp.com/success",
          cancel_url: "https://chefiapp.com/cancel",
          restaurant_id: "not-a-uuid",
        }),
      },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: expect.stringMatching(/restaurant_id|UUID/i),
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 403 when origin not allowed", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          price_id: "pro",
          success_url: "https://evil.com/success",
          cancel_url: "https://evil.com/cancel",
          restaurant_id: validRestaurantId,
        }),
      },
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "billing_not_allowed",
      message: expect.stringContaining("chefiapp.com"),
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 200 in mock mode", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          price_id: "pro",
          success_url: "https://chefiapp.com/success",
          cancel_url: "https://chefiapp.com/cancel",
          restaurant_id: validRestaurantId,
        }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      url: "https://chefiapp.com/success",
      session_id: expect.stringMatching(/^cs_mock_/),
      mock: true,
    });
  });

  it("POST /internal/billing/create-checkout-session with token returns 400 no_such_price for unknown plan", async () => {
    const res = await fetch(
      baseUrl + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          price_id: "nonexistent",
          success_url: "https://chefiapp.com/success",
          cancel_url: "https://chefiapp.com/cancel",
          restaurant_id: validRestaurantId,
        }),
      },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "no_such_price",
      message: expect.stringContaining("nonexistent"),
    });
  });

  describe("create-checkout-session with Stripe (non-mock mode)", () => {
    let billingServer: import("http").Server;
    let billingBaseUrl: string;
    const savedEnv: Record<string, string | undefined> = {};
    const restaurantId = "00000000-0000-0000-0000-000000000100";

    beforeAll(async () => {
      savedEnv.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
      savedEnv.STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO;
      process.env.STRIPE_SECRET_KEY = "sk_test_fake_for_branch_coverage";
      process.env.STRIPE_PRICE_PRO = "price_pro_test";
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      billingServer = gw.server;
      await new Promise<void>((done) => {
        billingServer.listen(0, () => done());
      });
      const addr = billingServer.address();
      const port =
        typeof addr === "object" && addr !== null && "port" in addr
          ? addr.port
          : 4320;
      billingBaseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll((done) => {
      if (savedEnv.STRIPE_SECRET_KEY !== undefined)
        process.env.STRIPE_SECRET_KEY = savedEnv.STRIPE_SECRET_KEY;
      else delete process.env.STRIPE_SECRET_KEY;
      if (savedEnv.STRIPE_PRICE_PRO !== undefined)
        process.env.STRIPE_PRICE_PRO = savedEnv.STRIPE_PRICE_PRO;
      else delete process.env.STRIPE_PRICE_PRO;
      jest.resetModules();
      billingServer.close(done);
    });

    it("returns 500 when Stripe checkout.sessions.create throws", async () => {
      mockCheckoutSessionsCreate.mockRejectedValueOnce(
        new Error("Stripe API error"),
      );
      const res = await fetch(
        billingBaseUrl + "/internal/billing/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            price_id: "pro",
            success_url: "https://www.chefiapp.com/success",
            cancel_url: "https://www.chefiapp.com/cancel",
            restaurant_id: restaurantId,
          }),
        },
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "stripe_error",
        message: expect.any(String),
      });
    });

    it("returns 200 with session_id when Stripe checkout.sessions.create succeeds", async () => {
      mockCheckoutSessionsCreate.mockResolvedValueOnce({
        id: "cs_real_xxx",
        url: "https://checkout.stripe.com/c/pay/cs_xxx",
      });
      const res = await fetch(
        billingBaseUrl + "/internal/billing/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            price_id: "pro",
            success_url: "https://www.chefiapp.com/success",
            cancel_url: "https://www.chefiapp.com/cancel",
            restaurant_id: restaurantId,
          }),
        },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        session_id: "cs_real_xxx",
        url: "https://checkout.stripe.com/c/pay/cs_xxx",
      });
      expect(body.mock).toBeUndefined();
    });
  });

  it("POST /api/v1/payment/pix/checkout without token returns 401", async () => {
    const res = await fetch(baseUrl + "/api/v1/payment/pix/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: "o1", amount: 10 }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("POST /api/v1/payment/pix/checkout with token returns 503 when SumUp not configured", async () => {
    const res = await fetch(baseUrl + "/api/v1/payment/pix/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({ order_id: "o1", amount: 10 }),
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "service_unavailable",
      message: expect.stringContaining("SUMUP_ACCESS_TOKEN"),
    });
  });

  it("POST /api/v1/sumup/checkout without token returns 401", async () => {
    const res = await fetch(baseUrl + "/api/v1/sumup/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "o1", restaurantId: "r1", amount: 10 }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("POST /api/v1/sumup/checkout with token returns 503 when SumUp not configured", async () => {
    const res = await fetch(baseUrl + "/api/v1/sumup/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
      body: JSON.stringify({ orderId: "o1", restaurantId: "r1", amount: 10 }),
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "service_unavailable",
      message: expect.stringContaining("SUMUP_ACCESS_TOKEN"),
    });
  });

  it("GET /api/v1/sumup/checkout/:id without token returns 401", async () => {
    const res = await fetch(baseUrl + "/api/v1/sumup/checkout/co-123", {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("GET /api/v1/sumup/checkout/:id with token returns 503 when SumUp not configured", async () => {
    const res = await fetch(baseUrl + "/api/v1/sumup/checkout/co-123", {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "service_unavailable",
      message: expect.stringContaining("SUMUP_ACCESS_TOKEN"),
    });
  });

  it("GET /api/v1/payment/sumup/checkout/:id without token returns 401", async () => {
    const res = await fetch(baseUrl + "/api/v1/payment/sumup/checkout/co-123", {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: "Invalid or missing internal token",
    });
  });

  it("GET /api/v1/payment/sumup/checkout/:id with token returns 503 when SumUp not configured", async () => {
    const res = await fetch(baseUrl + "/api/v1/payment/sumup/checkout/co-123", {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": "test-internal-token",
      },
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "service_unavailable",
      message: expect.stringContaining("SUMUP_ACCESS_TOKEN"),
    });
  });

  describe("PIX and SumUp checkout with token (mocked SumUp API)", () => {
    let sumupServer: import("http").Server;
    let sumupBaseUrl: string;
    const realFetch = global.fetch;

    beforeAll(async () => {
      process.env.SUMUP_ACCESS_TOKEN = "test-sumup-token";
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      sumupServer = gw.server;
      await new Promise<void>((resolve) =>
        sumupServer.listen(0, () => resolve()),
      );
      const addr = sumupServer.address();
      const port =
        typeof addr === "object" && addr !== null && "port" in addr
          ? addr.port
          : 4320;
      sumupBaseUrl = `http://127.0.0.1:${port}`;
      (global as any).__sumupThrowOnGetCheckout = false;
      (global as any).__sumupThrowOnPostCheckout = false;
      (global as any).__sumupReturn500ForGet = false;
      (global as any).__sumupReturn500NonJsonForGet = false;
      (global as any).__sumupReturn500EmptyBodyForGet = false;
      (global as any).__sumupReturn500NonJsonForPost = false;
      (global as any).__sumupReturn500EmptyBodyForPost = false;
      (global as any).__sumupReturn500JsonForPost = false;
      (global as any).__sumupReturn500JsonForGet = false;
      (global as any).__sumupReturnDateInCheckout = false;
      (global as any).__sumupReturnFullCheckoutForGet = false;
      (global as any).__sumupReturnNoReferenceForGet = false;
      (global as any).__sumupRejectWithNonError = false;
      (global as any).__sumupMockFetch = (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        const url = String(
          typeof input === "string"
            ? input
            : input instanceof URL
            ? input.href
            : (input as Request).url,
        );
        if (url.startsWith(sumupBaseUrl))
          return realFetch(input as RequestInfo, init);
        if (url.includes("checkouts")) {
          if (
            (global as any).__sumupThrowOnGetCheckout &&
            init?.method !== "POST"
          ) {
            return Promise.reject(new Error("SumUp API error"));
          }
          if (
            (global as any).__sumupRejectWithNonError &&
            init?.method === "POST"
          ) {
            return Promise.reject("non-Error throw");
          }
          if (
            (global as any).__sumupReturn500ForGet &&
            init?.method !== "POST"
          ) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  error: "Internal error",
                  message: "SumUp down",
                }),
                { status: 500 },
              ),
            );
          }
          if (
            (global as any).__sumupReturn500NonJsonForGet &&
            init?.method !== "POST"
          ) {
            return Promise.resolve(
              new Response("plain text error", { status: 500 }),
            );
          }
          if (
            (global as any).__sumupReturn500EmptyBodyForGet &&
            init?.method !== "POST"
          ) {
            return Promise.resolve(
              new Response("", {
                status: 500,
                statusText: "Internal Server Error",
              }),
            );
          }
          if (
            (global as any).__sumupReturn500EmptyBodyForPost &&
            init?.method === "POST"
          ) {
            return Promise.resolve(
              new Response("", {
                status: 500,
                statusText: "Internal Server Error",
              }),
            );
          }
          if (
            (global as any).__sumupReturn500JsonForPost &&
            init?.method === "POST"
          ) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  message: "SumUp API error",
                  error: "internal",
                }),
                { status: 500 },
              ),
            );
          }
          if (
            (global as any).__sumupReturn500JsonForGet &&
            init?.method !== "POST"
          ) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  message: "SumUp down",
                  error: "service_unavailable",
                }),
                { status: 500 },
              ),
            );
          }
          if (
            (global as any).__sumupThrowOnPostCheckout &&
            init?.method === "POST"
          ) {
            return Promise.reject(new Error("SumUp create checkout failed"));
          }
          if (
            (global as any).__sumupReturn500NonJsonForPost &&
            init?.method === "POST"
          ) {
            return Promise.resolve(
              new Response("SumUp API error", { status: 500 }),
            );
          }
          const basePayload = {
            id: "co-mock-1",
            status: init?.method === "POST" ? "PENDING" : "PAID",
            amount: 10.5,
            currency: "BRL",
            checkout_reference: "ord-1",
          };
          let payload: Record<string, unknown> =
            (global as any).__sumupReturnDateInCheckout &&
            init?.method === "POST"
              ? {
                  ...basePayload,
                  date: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                }
              : basePayload;
          if (
            (global as any).__sumupReturnFullCheckoutForGet &&
            init?.method !== "POST"
          ) {
            payload = {
              ...basePayload,
              transactions: [{ id: "tx1" }],
              date: new Date().toISOString(),
            };
          }
          if (
            (global as any).__sumupReturnNoReferenceForGet &&
            init?.method !== "POST"
          ) {
            const { checkout_reference: _, ...rest } = basePayload as Record<
              string,
              unknown
            > & { checkout_reference?: string };
            payload = rest;
          }
          return Promise.resolve(
            new Response(JSON.stringify(payload), {
              status: init?.method === "POST" ? 201 : 200,
            }),
          );
        }
        return realFetch(input as RequestInfo, init);
      };
      global.fetch = jest.fn((global as any).__sumupMockFetch) as typeof fetch;
    });

    beforeEach(() => {
      global.fetch = jest.fn((global as any).__sumupMockFetch) as typeof fetch;
    });

    afterAll(async () => {
      delete process.env.SUMUP_ACCESS_TOKEN;
      global.fetch = realFetch;
      await new Promise<void>((resolve) => sumupServer.close(() => resolve()));
      jest.resetModules();
    });

    it("POST /api/v1/payment/pix/checkout with Authorization Bearer token returns 201 when SumUp mocked", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-internal-token",
        },
        body: JSON.stringify({ order_id: "ord-1", amount: 10.5 }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        provider: "sumup",
        payment_method: "pix",
        checkout_id: "co-mock-1",
        status: "PENDING",
        amount: 10.5,
        currency: "BRL",
      });
    });

    it("POST /api/v1/payment/pix/checkout with token returns 201 when SumUp mocked", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({ order_id: "ord-1", amount: 10.5 }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        provider: "sumup",
        payment_method: "pix",
        checkout_id: "co-mock-1",
        status: "PENDING",
        amount: 10.5,
        currency: "BRL",
      });
    });

    it("POST /api/v1/payment/pix/checkout with invalid JSON returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: "not json",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: "Invalid JSON body",
      });
    });

    it("POST /api/v1/payment/pix/checkout with token but missing order_id returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({ amount: 10 }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: expect.stringMatching(/order_id|amount|required/i),
      });
    });

    it("POST /api/v1/payment/pix/checkout with token but invalid amount returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({ order_id: "ord-1", amount: 0 }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: expect.stringMatching(/order_id|amount|required/i),
      });
    });

    it("POST /api/v1/payment/pix/checkout returns 500 when SumUp API returns 500 with non-JSON body", async () => {
      (global as any).__sumupReturn500NonJsonForPost = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({ order_id: "ord-1", amount: 10 }),
        });
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/PIX|checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500NonJsonForPost = false;
      }
    });

    it("POST /api/v1/payment/pix/checkout with token returns 500 when SumUp API throws", async () => {
      (global as any).__sumupThrowOnPostCheckout = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({ order_id: "ord-1", amount: 10 }),
        });
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/PIX|checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupThrowOnPostCheckout = false;
      }
    });

    it("POST /api/v1/sumup/checkout with token returns 201 when SumUp mocked", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({ orderId: "o1", restaurantId: "r1", amount: 15 }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        checkout: { id: "co-mock-1", status: "PENDING", amount: 10.5 },
      });
    });

    it("POST /api/v1/sumup/checkout with return_url and currency returns 201", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          orderId: "o2",
          restaurantId: "r1",
          amount: 20,
          currency: "USD",
          returnUrl: "https://app.example.com/return",
          description: "Order o2",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        checkout: { id: "co-mock-1" },
      });
    });

    it("POST /api/v1/sumup/checkout with invalid JSON returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: "not json",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: "Invalid JSON body",
      });
    });

    it("POST /api/v1/sumup/checkout when SumUp returns date uses it for expiresAt", async () => {
      (global as any).__sumupReturnDateInCheckout = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            orderId: "o-date",
            restaurantId: "r1",
            amount: 10,
          }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body).toMatchObject({
          success: true,
          checkout: { id: "co-mock-1", expiresAt: expect.any(String) },
        });
      } finally {
        (global as any).__sumupReturnDateInCheckout = false;
      }
    });

    it("GET /api/v1/sumup/checkout/:id when SumUp returns transactions and date includes them", async () => {
      (global as any).__sumupReturnFullCheckoutForGet = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/sumup/checkout/co-full",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({
          success: true,
          checkout: {
            id: "co-mock-1",
            status: "PAID",
            transactions: [{ id: "tx1" }],
            validUntil: expect.any(String),
          },
        });
      } finally {
        (global as any).__sumupReturnFullCheckoutForGet = false;
      }
    });

    it("GET /api/v1/sumup/checkout/:id when SumUp omits checkout_reference uses checkoutId as reference", async () => {
      (global as any).__sumupReturnNoReferenceForGet = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/sumup/checkout/co-no-ref",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({
          success: true,
          checkout: {
            id: "co-mock-1",
            status: "PAID",
            reference: "co-no-ref",
          },
        });
      } finally {
        (global as any).__sumupReturnNoReferenceForGet = false;
      }
    });

    it("POST /api/v1/sumup/checkout with token but missing orderId returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({ restaurantId: "r1", amount: 15 }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: expect.stringMatching(/orderId|restaurantId|amount|required/i),
      });
    });

    it("POST /api/v1/sumup/checkout with token but amount <= 0 returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({ orderId: "o1", restaurantId: "r1", amount: 0 }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: expect.stringMatching(/orderId|restaurantId|amount|required/i),
      });
    });

    it("GET /api/v1/payment/sumup/checkout/:id with token returns 200 when SumUp mocked", async () => {
      const res = await fetch(
        sumupBaseUrl + "/api/v1/payment/sumup/checkout/co-123",
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
        },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        provider: "sumup",
        checkout_id: "co-mock-1",
        status: "PAID",
      });
    });

    it("GET /api/v1/payment/sumup/checkout/:id with token returns 500 when SumUp API throws", async () => {
      (global as any).__sumupThrowOnGetCheckout = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/payment/sumup/checkout/co-123",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupThrowOnGetCheckout = false;
      }
    });

    it("GET /api/v1/sumup/checkout/:id with token returns 500 when SumUp API throws", async () => {
      (global as any).__sumupThrowOnGetCheckout = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/sumup/checkout/co-456",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupThrowOnGetCheckout = false;
      }
    });

    it("GET /api/v1/payment/sumup/checkout/:id returns 500 when SumUp API returns non-ok", async () => {
      (global as any).__sumupReturn500ForGet = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/payment/sumup/checkout/co-123",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500ForGet = false;
      }
    });

    it("GET /api/v1/payment/sumup/checkout/:id returns 500 when SumUp API returns 500 with non-JSON body", async () => {
      (global as any).__sumupReturn500NonJsonForGet = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/payment/sumup/checkout/co-123",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500NonJsonForGet = false;
      }
    });

    it("GET /api/v1/payment/sumup/checkout/:id returns 500 when SumUp API returns 500 with empty body", async () => {
      (global as any).__sumupReturn500EmptyBodyForGet = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/payment/sumup/checkout/co-123",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500EmptyBodyForGet = false;
      }
    });

    it("POST /api/v1/sumup/checkout returns 500 when SumUp API returns 500 with empty body", async () => {
      (global as any).__sumupReturn500EmptyBodyForPost = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            orderId: "o1",
            restaurantId: "r1",
            amount: 10,
          }),
        });
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500EmptyBodyForPost = false;
      }
    });

    it("POST /api/v1/sumup/checkout returns 500 when SumUp API returns 500 with JSON body (try branch)", async () => {
      (global as any).__sumupReturn500JsonForPost = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            orderId: "o1",
            restaurantId: "r1",
            amount: 10,
          }),
        });
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.stringMatching(/SumUp|500/i),
        });
      } finally {
        (global as any).__sumupReturn500JsonForPost = false;
      }
    });

    it("GET /api/v1/payment/sumup/checkout/:id returns 500 when SumUp API returns 500 with JSON body (try branch)", async () => {
      (global as any).__sumupReturn500JsonForGet = true;
      try {
        const res = await fetch(
          sumupBaseUrl + "/api/v1/payment/sumup/checkout/co-123",
          {
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Token": "test-internal-token",
            },
          },
        );
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500JsonForGet = false;
      }
    });

    it("POST /api/v1/payment/pix/checkout with merchant_code and description returns 201", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          order_id: "ord-mc",
          amount: 25,
          merchant_code: "MERCHANT1",
          description: "Test order",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        provider: "sumup",
        checkout_id: "co-mock-1",
      });
    });

    it("POST /api/v1/payment/pix/checkout with empty optional merchant_code and description still returns 201", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/payment/pix/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          order_id: "ord-2",
          amount: 5,
          merchant_code: "   ",
          description: "",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        provider: "sumup",
        checkout_id: "co-mock-1",
      });
    });

    it("POST /api/v1/sumup/checkout with invalid JSON body returns 400", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: "not valid json",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "validation_error",
        message: expect.stringMatching(/JSON|Invalid/i),
      });
    });

    it("POST /api/v1/sumup/checkout returns 500 when createSumUpCheckoutApi throws non-Error", async () => {
      (global as any).__sumupRejectWithNonError = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            orderId: "o1",
            restaurantId: "r1",
            amount: 10,
          }),
        });
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: "Unknown error",
        });
      } finally {
        (global as any).__sumupRejectWithNonError = false;
      }
    });

    it("POST /api/v1/sumup/checkout returns 500 when SumUp API returns 500 with non-JSON body", async () => {
      (global as any).__sumupReturn500NonJsonForPost = true;
      try {
        const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Token": "test-internal-token",
          },
          body: JSON.stringify({
            orderId: "o1",
            restaurantId: "r1",
            amount: 10,
          }),
        });
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toMatchObject({
          error: expect.stringMatching(/checkout|Failed/i),
          message: expect.any(String),
        });
      } finally {
        (global as any).__sumupReturn500NonJsonForPost = false;
      }
    });

    it("POST /api/v1/sumup/checkout with returnUrl and description returns 201", async () => {
      const res = await fetch(sumupBaseUrl + "/api/v1/sumup/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: JSON.stringify({
          orderId: "o1",
          restaurantId: "r1",
          amount: 10,
          description: "Test order",
          returnUrl: "https://app.example.com/return",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        checkout: expect.any(Object),
      });
    });
  });

  describe("WhatsApp incoming with WHATSAPP_APP_SECRET (signature validation)", () => {
    let waServer: import("http").Server;
    let waBaseUrl: string;
    const realFetch = global.fetch;

    beforeAll(async () => {
      process.env.WHATSAPP_APP_SECRET = "wa-secret";
      process.env.CORE_SERVICE_KEY = "key";
      global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(
          typeof input === "string"
            ? input
            : input instanceof URL
            ? input.href
            : (input as Request).url,
        );
        if (url.includes("/rest/v1/api_keys")) {
          if (init?.method === "PATCH")
            return Promise.resolve({ ok: true } as Response);
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: "k1", restaurant_id: "r1" }],
          } as Response);
        }
        return realFetch(input as RequestInfo, init);
      }) as typeof fetch;
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      waServer = gw.server;
      await new Promise<void>((resolve) => waServer.listen(0, () => resolve()));
      const addr = waServer.address();
      const port =
        typeof addr === "object" && addr !== null && "port" in addr
          ? addr.port
          : 4320;
      waBaseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
      delete process.env.WHATSAPP_APP_SECRET;
      process.env.CORE_SERVICE_KEY = "";
      global.fetch = realFetch;
      await new Promise<void>((resolve) => waServer.close(() => resolve()));
      jest.resetModules();
    });

    it("POST /api/v1/integrations/whatsapp/incoming returns 401 when X-Hub-Signature-256 is missing", async () => {
      const body = JSON.stringify({
        entry: [{ changes: [{ value: { messages: [] } }] }],
      });
      const res = await fetch(
        waBaseUrl + "/api/v1/integrations/whatsapp/incoming",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-key",
          },
          body,
        },
      );
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toMatchObject({
        error: "unauthorized",
        message: expect.stringMatching(/X-Hub-Signature|Missing|invalid/i),
      });
    });

    it("POST /api/v1/integrations/whatsapp/incoming returns 401 when X-Hub-Signature-256 is invalid", async () => {
      const body = JSON.stringify({
        entry: [{ changes: [{ value: { messages: [] } }] }],
      });
      const res = await fetch(
        waBaseUrl + "/api/v1/integrations/whatsapp/incoming",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-key",
            "x-hub-signature-256": "sha256=invalid",
          },
          body,
        },
      );
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toMatchObject({
        error: "unauthorized",
        message: expect.stringMatching(/signature|Invalid/i),
      });
    });

    it("POST /api/v1/integrations/whatsapp/incoming returns 401 when X-Hub-Signature-256 does not start with sha256=", async () => {
      const body = JSON.stringify({
        entry: [{ changes: [{ value: { messages: [] } }] }],
      });
      const res = await fetch(
        waBaseUrl + "/api/v1/integrations/whatsapp/incoming",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-key",
            "x-hub-signature-256": "no-prefix",
          },
          body,
        },
      );
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toMatchObject({
        error: "unauthorized",
        message: expect.stringMatching(/Missing|invalid|X-Hub/i),
      });
    });

    it("handleApiV1 WhatsApp returns 401 when X-Hub-Signature-256 is array with invalid signature", async () => {
      const gw = await import("../../../server/integration-gateway");
      const bodyStr = JSON.stringify({
        entry: [{ changes: [{ value: { messages: [] } }] }],
      });
      const result = await gw.handleApiV1(
        "POST",
        "/api/v1/integrations/whatsapp/incoming",
        bodyStr,
        { keyId: "k1", restaurantId: "r1" },
        { "x-hub-signature-256": ["sha256=wrong-signature"] },
      );
      expect(result.status).toBe(401);
      expect(result.json).toMatchObject({
        error: "unauthorized",
        message: expect.stringMatching(/signature|Invalid/i),
      });
    });
  });

  describe("request handler catch (500 when updateApiKeyLastUsed throws)", () => {
    let catchServer: import("http").Server;
    let catchBaseUrl: string;
    const realFetch = global.fetch;

    beforeAll(async () => {
      process.env.CORE_SERVICE_KEY = "catch-test-key";
      jest.resetModules();
      const gw = await import("../../../server/integration-gateway");
      catchServer = gw.server;
      await new Promise<void>((resolve) =>
        catchServer.listen(0, () => resolve()),
      );
      const addr = catchServer.address();
      const port =
        typeof addr === "object" && addr !== null && "port" in addr
          ? addr.port
          : 4320;
      catchBaseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
      process.env.CORE_SERVICE_KEY = "";
      global.fetch = realFetch;
      await new Promise<void>((resolve) => catchServer.close(() => resolve()));
      jest.resetModules();
    });

    it("returns 500 when updateApiKeyLastUsed (PATCH api_keys) throws", async () => {
      global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(
          typeof input === "string" ? input : (input as Request).url,
        );
        if (url.includes("/rest/v1/api_keys")) {
          if (init?.method === "PATCH")
            return Promise.reject(new Error("Core PATCH failed"));
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: "k1", restaurant_id: "r1" }],
          } as Response);
        }
        return realFetch(input as RequestInfo, init);
      }) as typeof fetch;

      const res = await fetch(catchBaseUrl + "/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "any-key" },
        body: JSON.stringify({
          items: [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
        }),
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "internal_error",
        message: "Internal server error",
      });
    });

    it("returns 500 when updateApiKeyLastUsed rejects with non-Error (catch String(err))", async () => {
      global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(
          typeof input === "string" ? input : (input as Request).url,
        );
        if (url.includes("/rest/v1/api_keys")) {
          if (init?.method === "PATCH")
            return Promise.reject("plain string rejection");
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: "k1", restaurant_id: "r1" }],
          } as Response);
        }
        return realFetch(input as RequestInfo, init);
      }) as typeof fetch;

      const res = await fetch(catchBaseUrl + "/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "any-key" },
        body: JSON.stringify({
          items: [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
        }),
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "internal_error",
        message: "Internal server error",
      });
    });

    it("accepts API key from Authorization Bearer and returns 404 for unknown path", async () => {
      global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(
          typeof input === "string" ? input : (input as Request).url,
        );
        if (url.includes("/rest/v1/api_keys")) {
          if (init?.method === "PATCH")
            return Promise.resolve({ ok: true } as Response);
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: "k1", restaurant_id: "r1" }],
          } as Response);
        }
        return realFetch(input as RequestInfo, init);
      }) as typeof fetch;

      const res = await fetch(catchBaseUrl + "/api/v1/unknown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer any-key",
        },
        body: "{}",
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toMatchObject({ error: "not_found", message: "Not found" });
    });
  });

  it("POST /api/v1/unknown without API key returns 401 API key missing", async () => {
    const res = await fetch(baseUrl + "/api/v1/unknown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "unauthorized",
      message: expect.stringMatching(/API key|X-API-Key/i),
    });
  });

  it("POST /api/v1/unknown with API key returns 401 Invalid API key when lookup returns no key", async () => {
    process.env.CORE_SERVICE_KEY = "test-key";
    jest.resetModules();
    const gw = await import("../../../server/integration-gateway");
    const srv = gw.server;
    await new Promise<void>((resolve) => srv.listen(0, () => resolve()));
    const addr = srv.address();
    const port =
      typeof addr === "object" && addr !== null && "port" in addr
        ? addr.port
        : 4320;
    const apiBase = `http://127.0.0.1:${port}`;
    const realFetch = global.fetch;
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;
      if (url && String(url).startsWith(`http://127.0.0.1:${port}`))
        return realFetch(input as RequestInfo, init);
      if (String(url).includes("api_keys") && String(url).includes("key_hash"))
        return Promise.resolve({
          ok: true,
          json: async () => [],
          status: 200,
        } as Response);
      return realFetch(input as RequestInfo, init);
    }) as typeof fetch;
    try {
      const res = await fetch(apiBase + "/api/v1/unknown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "some-key",
        },
        body: "{}",
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toMatchObject({
        error: "unauthorized",
        message: "Invalid API key",
        details: "API key not found or revoked",
      });
    } finally {
      global.fetch = realFetch;
      await new Promise<void>((resolve) => srv.close(() => resolve()));
      process.env.CORE_SERVICE_KEY = "";
      jest.resetModules();
    }
  });
});

describe("integration-gateway — handleApiV1 contract", () => {
  let srv: import("http").Server;
  let apiBase: string;
  let createOrderMockRes: () => Promise<Response>;
  let patchOrderMockRes: () => Promise<Response>;
  let createTaskMockRes: () => Promise<Response>;
  let realFetch: typeof global.fetch;
  const savedEnv = process.env.CORE_SERVICE_KEY;

  beforeAll(async () => {
    realFetch = global.fetch;
    process.env.CORE_SERVICE_KEY = "test-key";
    jest.resetModules();
    const gw = await import("../../../server/integration-gateway");
    srv = gw.server;
    await new Promise<void>((resolve) => srv.listen(0, () => resolve()));
    const addr = srv.address();
    const port =
      typeof addr === "object" && addr !== null && "port" in addr
        ? addr.port
        : 4320;
    apiBase = `http://127.0.0.1:${port}`;
    createOrderMockRes = () =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: "ord_1" }),
        status: 200,
      } as Response);
    patchOrderMockRes = () =>
      Promise.resolve({ ok: true, status: 200 } as Response);
    createTaskMockRes = () =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ id: "task_1" }),
      } as Response);
    (global as any).__webhookConfigForOrderCreated = false;
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url,
      );
      if (url.startsWith(apiBase)) return realFetch(input as RequestInfo, init);
      if (url.includes("api_keys") && url.includes("key_hash"))
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "k1", restaurant_id: "r1" }],
          status: 200,
        } as Response);
      if (
        url.includes("api_keys") &&
        url.includes("id=eq") &&
        init?.method === "PATCH"
      )
        return Promise.resolve({ ok: true, status: 200 } as Response);
      if (url.includes("webhook_out_config"))
        return Promise.resolve({
          ok: true,
          json: async () =>
            (global as any).__webhookConfigForOrderCreated
              ? [
                  {
                    id: "w1",
                    url: "https://wh-o.example/order",
                    secret: "s",
                    events: ["order.created"],
                    enabled: true,
                  },
                ]
              : [],
          status: 200,
        } as Response);
      if (url.includes("wh-o.example"))
        return Promise.resolve({ ok: true, status: 200 } as Response);
      if (url.includes("webhook_out_delivery_log"))
        return Promise.resolve({ ok: true, status: 201 } as Response);
      if (url.includes("create_order_atomic")) return createOrderMockRes();
      if (url.includes("gm_orders") && init?.method === "PATCH")
        return patchOrderMockRes();
      if (url.includes("gm_tasks") && init?.method === "POST")
        return createTaskMockRes();
      return realFetch(input as RequestInfo, init);
    }) as typeof fetch;
  });

  afterAll(async () => {
    global.fetch = realFetch;
    await new Promise<void>((resolve) => srv.close(() => resolve()));
    process.env.CORE_SERVICE_KEY = savedEnv ?? "";
    jest.resetModules();
  });

  it("POST /api/v1/unknown with valid API key returns 404 Not found", async () => {
    const res = await fetch(apiBase + "/api/v1/unknown", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: "{}",
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({ error: "not_found", message: "Not found" });
  });

  it("POST /api/v1/orders with valid body returns 201 and orderId", async () => {
    createOrderMockRes = () =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: "ord_1" }),
        status: 200,
      } as Response);
    const res = await fetch(apiBase + "/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({
        items: [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ orderId: expect.any(String), status: "new" });
  });

  it("POST /api/v1/orders with valid body triggers emitEventInternal with webhook config (events.includes)", async () => {
    (global as any).__webhookConfigForOrderCreated = true;
    createOrderMockRes = () =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: "ord_2" }),
        status: 200,
      } as Response);
    try {
      const res = await fetch(apiBase + "/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "key" },
        body: JSON.stringify({
          items: [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        orderId: expect.any(String),
        status: "new",
      });
    } finally {
      (global as any).__webhookConfigForOrderCreated = false;
    }
  });

  it("POST /api/v1/orders with invalid JSON returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: "not json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON",
    });
  });

  it("POST /api/v1/orders with missing items returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "items required",
    });
  });

  it("POST /api/v1/orders when RPC returns !ok returns 400", async () => {
    createOrderMockRes = () =>
      Promise.resolve({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      } as Response);
    const res = await fetch(apiBase + "/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({
        items: [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Order creation failed",
    });
  });

  it("POST /api/v1/orders when fetch throws returns 500", async () => {
    createOrderMockRes = () => Promise.reject(new Error("Core unreachable"));
    const res = await fetch(apiBase + "/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({
        items: [{ product_id: "p1", quantity: 1, unit_price: 1000 }],
      }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "internal_error",
      message: "Internal server error",
    });
  });

  it("PATCH /api/v1/orders/:id with valid status returns 200", async () => {
    patchOrderMockRes = () =>
      Promise.resolve({ ok: true, status: 200 } as Response);
    const res = await fetch(apiBase + "/api/v1/orders/ord_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ status: "paid" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ orderId: "ord_1", status: "paid" });
  });

  it("PATCH /api/v1/orders/:id when Core returns !ok returns 404", async () => {
    patchOrderMockRes = () =>
      Promise.resolve({ ok: false, status: 404 } as Response);
    const res = await fetch(apiBase + "/api/v1/orders/ord_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ status: "ready" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "not_found",
      message: "Order not found",
    });
  });

  it("PATCH /api/v1/orders/:id when fetch throws returns 500", async () => {
    patchOrderMockRes = () => Promise.reject(new Error("Core unreachable"));
    const res = await fetch(apiBase + "/api/v1/orders/ord_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ status: "paid" }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "internal_error",
      message: "Internal server error",
    });
  });

  it("PATCH /api/v1/orders/:id with invalid JSON returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/orders/ord_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: "not json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON",
    });
  });

  it("PATCH /api/v1/orders/:id with invalid status returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/orders/ord_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ status: "invalid" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "status required",
    });
  });

  it("POST /api/v1/orders/:id/payment returns 200 and paymentStatus confirmed", async () => {
    const res = await fetch(apiBase + "/api/v1/orders/ord_1/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ amountCents: 1000, paymentMethod: "card" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      orderId: "ord_1",
      paymentStatus: "confirmed",
    });
  });

  it("POST /api/v1/orders/:id/payment with invalid JSON returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/orders/ord_1/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: "not json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON",
    });
  });

  it("POST /api/v1/tasks with valid body returns 201 and taskId", async () => {
    createTaskMockRes = () =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ id: "task_1" }),
      } as Response);
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ title: "Clean table", description: "Section A" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ taskId: expect.any(String) });
  });

  it("POST /api/v1/tasks when Core returns array (Prefer representation) uses first id", async () => {
    createTaskMockRes = () =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: async () => [{ id: "task_from_array" }],
      } as Response);
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ title: "Task" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.taskId).toBe("task_from_array");
  });

  it("POST /api/v1/tasks with missing title returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ description: "No title" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "title required",
    });
  });

  it("POST /api/v1/tasks with invalid JSON returns 400", async () => {
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: "not json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON",
    });
  });

  it("POST /api/v1/tasks when Core returns 404 (table missing) returns 201 with taskId", async () => {
    createTaskMockRes = () =>
      Promise.resolve({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      } as Response);
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ title: "Task" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ taskId: expect.any(String) });
  });

  it("POST /api/v1/tasks when Core returns !ok and not 404/406 returns 500", async () => {
    createTaskMockRes = () =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: async () => "Server error",
      } as Response);
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ title: "Task" }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "internal_error",
      message: "Failed to create task",
    });
  });

  it("POST /api/v1/tasks when fetch throws returns 500", async () => {
    createTaskMockRes = () => Promise.reject(new Error("Core unreachable"));
    const res = await fetch(apiBase + "/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "key" },
      body: JSON.stringify({ title: "Task" }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "internal_error",
      message: "Internal server error",
    });
  });

  it("POST /api/v1/integrations/whatsapp/incoming with valid body returns 200 received", async () => {
    const res = await fetch(
      apiBase + "/api/v1/integrations/whatsapp/incoming",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "key" },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: "5511999999999",
                        text: { body: "Quero 2 cafés" },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ received: true });
  });

  it("POST /api/v1/integrations/whatsapp/incoming with invalid JSON returns 400", async () => {
    const res = await fetch(
      apiBase + "/api/v1/integrations/whatsapp/incoming",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "key" },
        body: "not json",
      },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "validation_error",
      message: "Invalid JSON body",
    });
  });

  it("POST /api/v1/integrations/whatsapp/incoming with empty entry returns 200", async () => {
    const res = await fetch(
      apiBase + "/api/v1/integrations/whatsapp/incoming",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "key" },
        body: JSON.stringify({ entry: [] }),
      },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ received: true });
  });

  it("POST /api/v1/* returns 429 when rate limit exceeded (101 requests same key)", async () => {
    const requests = Array.from({ length: 101 }, () =>
      fetch(apiBase + "/api/v1/unknown", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "key" },
        body: "{}",
      }),
    );
    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status);
    const rateLimited = statuses.filter((s) => s === 429);
    expect(rateLimited.length).toBeGreaterThanOrEqual(1);
    const last = results[100];
    expect(last.status).toBe(429);
    const body = await last.json();
    expect(body).toMatchObject({
      error: "rate_limit_exceeded",
      message: "Too many requests",
    });
    expect(body.details).toBeDefined();
    expect(typeof (body.details?.retryAfter ?? body.retryAfter)).toBe("number");
    expect(last.headers.get("Retry-After")).toBeDefined();
  });
});
// ---------------------------------------------------------------------------
// verifySupabaseJwt — pure function unit tests
// ---------------------------------------------------------------------------

import * as crypto from "crypto";

function makeTestJwt(
  payload: Record<string, unknown>,
  secret: string,
  overrideExp?: number,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iat: now,
    exp: overrideExp ?? now + 3600,
    ...payload,
  };
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString(
    "base64url",
  );
  const data = `${header}.${payloadB64}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

describe("verifySupabaseJwt", () => {
  const SECRET = "test-jwt-secret-32bytes-xyzxyz";
  const userId = "usr-00000000-0000-0000-0000-000000000001";

  it("returns payload for a valid token", () => {
    const token = makeTestJwt({ sub: userId, role: "authenticated" }, SECRET);
    const result = verifySupabaseJwt(token, SECRET);
    expect(result).not.toBeNull();
    expect(result?.sub).toBe(userId);
    expect(result?.role).toBe("authenticated");
  });

  it("returns null for an invalid signature", () => {
    const token = makeTestJwt({ sub: userId }, SECRET);
    const parts = token.split(".");
    // Corrupt the signature
    const badToken = `${parts[0]}.${parts[1]}.invalidsignatureXXXXXXXXXXXXXXXX`;
    expect(verifySupabaseJwt(badToken, SECRET)).toBeNull();
  });

  it("returns null for a token signed with a different secret", () => {
    const token = makeTestJwt({ sub: userId }, "other-secret-completely-wrong");
    expect(verifySupabaseJwt(token, SECRET)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const expired = makeTestJwt(
      { sub: userId },
      SECRET,
      Math.floor(Date.now() / 1000) - 10,
    );
    expect(verifySupabaseJwt(expired, SECRET)).toBeNull();
  });

  it("returns null when secret is empty string", () => {
    const token = makeTestJwt({ sub: userId }, SECRET);
    expect(verifySupabaseJwt(token, "")).toBeNull();
  });

  it("returns null for malformed token (not 3 parts)", () => {
    expect(verifySupabaseJwt("not.a.valid.jwt.here", SECRET)).toBeNull();
    expect(verifySupabaseJwt("only-two.parts", SECRET)).toBeNull();
  });

  it("returns null for a token with malformed JSON payload", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString(
      "base64url",
    );
    const badPayload = Buffer.from("{not-json").toString("base64url");
    const data = `${header}.${badPayload}`;
    const sig = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("base64url");
    expect(verifySupabaseJwt(`${data}.${sig}`, SECRET)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// verifyRestaurantOwner — mocked fetch
// ---------------------------------------------------------------------------

describe("verifyRestaurantOwner", () => {
  const savedFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = savedFetch;
  });

  const UID = "00000000-0000-0000-0000-000000000001";
  const RID = "00000000-0000-0000-0000-000000000002";

  it("returns true when membership row exists", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "m1" }],
    });
    expect(await verifyRestaurantOwner(UID, RID)).toBe(true);
  });

  it("returns false when membership row not found", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    expect(await verifyRestaurantOwner(UID, RID)).toBe(false);
  });

  it("returns false when Core returns !ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    expect(await verifyRestaurantOwner(UID, RID)).toBe(false);
  });

  it("returns false when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network"));
    expect(await verifyRestaurantOwner(UID, RID)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Billing RBAC — SUPABASE_JWT_SECRET enforcement
// ---------------------------------------------------------------------------

describe("billing RBAC — SUPABASE_JWT_SECRET enforcement", () => {
  let rbacServer: import("http").Server;
  let rbacBase: string;
  const JWT_SECRET = "rbac-test-secret-32bytes-abc123";
  const RESTAURANT_ID = "00000000-0000-0000-0000-000000000099";
  const USER_ID = "00000000-0000-0000-0000-000000000001";
  const savedEnv: Record<string, string | undefined> = {};
  // Save real fetch once at describe level (before any mock)
  const realFetch = global.fetch;

  beforeAll(async () => {
    savedEnv.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
    jest.resetModules();
    const gw = await import("../../../server/integration-gateway");
    rbacServer = gw.server;
    await new Promise<void>((done) => rbacServer.listen(0, () => done()));
    const addr = rbacServer.address();
    const port =
      typeof addr === "object" && addr !== null && "port" in addr
        ? addr.port
        : 4320;
    rbacBase = `http://127.0.0.1:${port}`;
  });

  afterAll((done) => {
    global.fetch = realFetch;
    if (savedEnv.SUPABASE_JWT_SECRET !== undefined)
      process.env.SUPABASE_JWT_SECRET = savedEnv.SUPABASE_JWT_SECRET;
    else delete process.env.SUPABASE_JWT_SECRET;
    jest.resetModules();
    rbacServer.close(done);
  });

  beforeEach(() => {
    // Smart mock: route Core API calls to mock responses, test-server calls to real fetch.
    // The gateway server uses global.fetch for gm_restaurant_members queries.
    global.fetch = jest
      .fn()
      .mockImplementation((url: unknown, ...args: unknown[]) => {
        const urlStr = String(url ?? "");
        // Pass through HTTP calls to our test server
        if (rbacBase && urlStr.startsWith(rbacBase)) {
          return realFetch(urlStr, args[0] as RequestInit | undefined);
        }
        // Default: membership not found (empty → 403)
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  function validJwt(): string {
    return makeTestJwt({ sub: USER_ID, role: "authenticated" }, JWT_SECRET);
  }

  const CHECKOUT_BODY = JSON.stringify({
    price_id: "price_dev_pro",
    success_url: "https://www.chefiapp.com/success",
    cancel_url: "https://www.chefiapp.com/cancel",
    restaurant_id: RESTAURANT_ID,
  });

  it("returns 401 when no Authorization token provided", async () => {
    const res = await realFetch(
      rbacBase + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
        },
        body: CHECKOUT_BODY,
      },
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("unauthorized");
  });

  it("returns 401 when JWT signature is invalid", async () => {
    const res = await realFetch(
      rbacBase + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
          "X-Supabase-Access-Token": "bad.token.here",
        },
        body: CHECKOUT_BODY,
      },
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not owner of restaurant", async () => {
    // Default mock returns [] (membership not found)
    const res = await realFetch(
      rbacBase + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
          "X-Supabase-Access-Token": validJwt(),
        },
        body: CHECKOUT_BODY,
      },
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("forbidden");
  });

  it("returns non-40x when user is verified owner (past RBAC gate)", async () => {
    // Override: membership found → owner confirmed
    (global.fetch as jest.Mock).mockImplementation(
      (url: unknown, ...args: unknown[]) => {
        const urlStr = String(url ?? "");
        if (rbacBase && urlStr.startsWith(rbacBase)) {
          return realFetch(urlStr, args[0] as RequestInit | undefined);
        }
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "mem-1" }],
        } as Response);
      },
    );
    const res = await realFetch(
      rbacBase + "/internal/billing/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": "test-internal-token",
          "X-Supabase-Access-Token": validJwt(),
        },
        body: CHECKOUT_BODY,
      },
    );
    // Passed the RBAC check — should not be 401/403
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
