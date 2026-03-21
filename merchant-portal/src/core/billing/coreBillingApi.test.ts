import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedConfig = vi.hoisted(() => ({
  CORE_URL: "http://localhost:3001",
  CORE_ANON_KEY: "test-anon",
  API_BASE: "",
  INTERNAL_API_TOKEN: "",
  isEdgeGateway: false,
  DEBUG_DIRECT_FLOW: false,
}));

const mockGetBackendType = vi.hoisted(() => vi.fn());
const mockGetDockerCoreFetchClient = vi.hoisted(() => vi.fn());

vi.mock("../../config", () => ({ CONFIG: mockedConfig }));
vi.mock("../infra/backendAdapter", () => ({
  BackendType: { docker: "docker", none: "none" },
  getBackendType: mockGetBackendType,
}));
vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: mockGetDockerCoreFetchClient,
}));

import {
  BILLING_STATES,
  createCheckoutSession,
  createSaasPortalSession,
  ensureStripeCustomerForRestaurant,
  getBillingConfig,
  getBillingInvoices,
  getBillingPlanPrice,
  getBillingPlans,
  getBillingStatus,
  getBillingStatusWithTrial,
  getRestaurantBillingCurrency,
  getRestaurantStatus,
  getSubscription,
  resolveStripePriceId,
  setBillingConfig,
} from "./coreBillingApi";

function mockResponse(options: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  jsonBody?: unknown;
  textBody?: string;
  contentType?: string;
}): Response {
  const {
    ok = true,
    status = 200,
    statusText = "OK",
    jsonBody,
    textBody,
    contentType = "application/json",
  } = options;
  const bodyText =
    textBody ?? (jsonBody !== undefined ? JSON.stringify(jsonBody) : "");

  return {
    ok,
    status,
    statusText,
    json: vi.fn(async () => {
      if (jsonBody !== undefined) return jsonBody;
      return bodyText ? JSON.parse(bodyText) : null;
    }),
    text: vi.fn(async () => bodyText),
    headers: {
      get: vi.fn((key: string) =>
        key.toLowerCase() === "content-type" ? contentType : null,
      ),
    } as unknown as Headers,
  } as unknown as Response;
}

describe("coreBillingApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBackendType.mockReturnValue("docker");
    mockedConfig.API_BASE = "";
    mockedConfig.INTERNAL_API_TOKEN = "";
    mockedConfig.isEdgeGateway = false;
    globalThis.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires docker backend", async () => {
    mockGetBackendType.mockReturnValue("none");
    await expect(getBillingPlans()).rejects.toThrow("Billing requires Core");
  });

  it("covers currency resolution paths", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 500 }))
      .mockResolvedValueOnce(
        mockResponse({ jsonBody: [{ currency: "usd", country: "PT" }] }),
      )
      .mockResolvedValueOnce(
        mockResponse({ jsonBody: [{ currency: "zzz", country: "BR" }] }),
      );

    await expect(getRestaurantBillingCurrency("r1")).resolves.toBe("EUR");
    await expect(getRestaurantBillingCurrency("r1")).resolves.toBe("USD");
    await expect(getRestaurantBillingCurrency("r1")).resolves.toBe("BRL");
  });

  it("covers billing status paths", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        mockResponse({ jsonBody: [{ billing_status: "invalid" }] }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          jsonBody: [
            { billing_status: "trial", trial_ends_at: "2020-01-01T00:00:00Z" },
          ],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          jsonBody: [
            { billing_status: "active", trial_ends_at: "2030-01-01T00:00:00Z" },
          ],
        }),
      );

    await expect(getBillingStatusWithTrial("r1")).resolves.toBeNull();
    await expect(getBillingStatus("r1")).resolves.toBe(BILLING_STATES.PAST_DUE);
    await expect(getBillingStatus("r1")).resolves.toBe(BILLING_STATES.ACTIVE);
  });

  it("covers getRestaurantStatus paths", async () => {
    localStorage.setItem(
      "chefiapp_pilot_mock_restaurant",
      JSON.stringify({
        id: "r-local",
        onboarding_completed_at: null,
        billing_status: "unknown_state",
        trial_ends_at: "2030-01-01T00:00:00Z",
      }),
    );

    await expect(getRestaurantStatus("r-local")).resolves.toMatchObject({
      id: "r-local",
      billing_status: "trial",
    });

    localStorage.removeItem("chefiapp_pilot_mock_restaurant");
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        mockResponse({ contentType: "text/html", textBody: "<html></html>" }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          contentType: "application/json",
          textBody: "{not-json}",
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          contentType: "application/json",
          textBody: JSON.stringify([
            {
              id: "r1",
              status: "active",
              onboarding_completed_at: "2026-01-01T00:00:00.000Z",
              billing_status: "active",
              trial_ends_at: null,
            },
          ]),
        }),
      );

    await expect(getRestaurantStatus("r1")).resolves.toBeNull();
    await expect(getRestaurantStatus("r1")).resolves.toBeNull();
    await expect(getRestaurantStatus("r1")).resolves.toMatchObject({
      id: "r1",
      billing_status: "active",
    });
  });

  it("covers billing config paths", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 404 }))
      .mockResolvedValueOnce(
        mockResponse({ ok: false, status: 500, statusText: "Boom" }),
      )
      .mockResolvedValueOnce(
        mockResponse({ ok: false, status: 400, textBody: "bad request" }),
      )
      .mockResolvedValueOnce(
        mockResponse({ ok: false, status: 409, textBody: "conflict" }),
      );

    await expect(getBillingConfig("r1")).resolves.toBeNull();
    await expect(getBillingConfig("r1")).rejects.toThrow("Core billing config");

    await expect(
      setBillingConfig("r1", {
        provider: "stripe",
        currency: "EUR",
        enabled: true,
      }),
    ).resolves.toEqual({ error: "400 bad request" });

    await expect(
      setBillingConfig("r1", {
        provider: "stripe",
        currency: "EUR",
        enabled: true,
      }),
    ).resolves.toEqual({ error: null });
  });

  it("covers subscription and plan/invoice paths", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { message: "x" } })
        .mockResolvedValueOnce({
          data: [
            {
              id: "sub-1",
              restaurant_id: "r1",
              plan_id: "pro",
              status: "active",
            },
          ],
          error: null,
        }),
    };
    mockGetDockerCoreFetchClient.mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    await expect(getSubscription("r1")).resolves.toBeNull();
    await expect(getSubscription("r1")).resolves.toMatchObject({ id: "sub-1" });

    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        mockResponse({
          jsonBody: [
            {
              plan_id: "pro",
              currency: "EUR",
              stripe_price_id: "price_123",
              price_cents: 9900,
              interval: "month",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: [{ id: "plan-1" }] }),
      )
      .mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: [{ id: "invoice-1" }] }),
      );

    await expect(getBillingPlanPrice("pro", "EUR")).resolves.toMatchObject({
      stripe_price_id: "price_123",
    });
    await expect(getBillingPlans()).resolves.toEqual([{ id: "plan-1" }]);
    await expect(getBillingInvoices("r1")).resolves.toEqual([
      { id: "invoice-1" },
    ]);

    expect(
      resolveStripePriceId(
        { tier: "pro", stripe_price_id: "price-plan" } as any,
        "EUR",
        { stripe_price_id: "price-currency" } as any,
      ),
    ).toBe("price-currency");
    expect(
      resolveStripePriceId(
        { tier: "pro", stripe_price_id: "price-plan" } as any,
        "EUR",
        null,
      ),
    ).toBe("price-plan");
    expect(
      resolveStripePriceId(
        { tier: "starter", stripe_price_id: null } as any,
        "EUR",
        null,
      ),
    ).toBe("starter");
  });

  it("covers portal and checkout gateway/core paths", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        mockResponse({ ok: false, status: 500, textBody: "rpc failed" }),
      )
      .mockResolvedValueOnce(mockResponse({ ok: true, textBody: "not-json" }))
      .mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: { ok: true } }),
      );

    await expect(createSaasPortalSession("https://return")).resolves.toEqual({
      url: "",
      error: "rpc failed",
    });
    await expect(createSaasPortalSession("https://return")).resolves.toEqual({
      url: "",
      error: "Invalid JSON from Core",
    });
    await expect(createSaasPortalSession("https://return")).resolves.toEqual({
      url: "",
      error: "Core did not return portal URL",
    });

    mockedConfig.API_BASE = "http://localhost:4320";
    mockedConfig.INTERNAL_API_TOKEN = "token";
    vi.mocked(globalThis.fetch)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(mockResponse({ ok: true, textBody: "not-json" }))
      .mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 400,
          textBody: JSON.stringify({ message: "gateway says no" }),
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          ok: true,
          jsonBody: { url: "https://checkout", session_id: "sess_1" },
        }),
      );

    const network = await createCheckoutSession("price", "s", "c", "r1");
    expect(network.error).toContain("não está em execução");
    await expect(
      createCheckoutSession("price", "s", "c", "r1"),
    ).resolves.toEqual({
      url: "",
      error: "Resposta inválida do gateway.",
    });
    await expect(
      createCheckoutSession("price", "s", "c", "r1"),
    ).resolves.toEqual({
      url: "",
      error: "gateway says no",
    });
    await expect(
      createCheckoutSession("price", "s", "c", "r1"),
    ).resolves.toEqual({
      url: "https://checkout",
      sessionId: "sess_1",
    });

    mockedConfig.API_BASE = "";
    mockedConfig.INTERNAL_API_TOKEN = "";
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 404,
          textBody: JSON.stringify({ code: "PGRST202", message: "missing" }),
        }),
      )
      .mockResolvedValueOnce(mockResponse({ ok: true, textBody: "not-json" }))
      .mockResolvedValueOnce(
        mockResponse({
          ok: true,
          jsonBody: { url: "https://core-checkout", session_id: "sess_core" },
        }),
      );

    const migration = await createCheckoutSession("price", "s", "c", "r1");
    expect(migration.error).toContain("Checkout em breve");
    await expect(
      createCheckoutSession("price", "s", "c", "r1"),
    ).resolves.toEqual({
      url: "",
      error: "Invalid JSON from Core",
    });
    await expect(
      createCheckoutSession("price", "s", "c", "r1"),
    ).resolves.toEqual({
      url: "https://core-checkout",
      sessionId: "sess_core",
    });
  });

  it("covers ensureStripeCustomerForRestaurant paths", async () => {
    mockedConfig.API_BASE = "";
    mockedConfig.INTERNAL_API_TOKEN = "";
    const missingCfg = await ensureStripeCustomerForRestaurant("r1");
    expect(missingCfg.ok).toBe(false);

    mockedConfig.API_BASE = "http://localhost:4320";
    mockedConfig.INTERNAL_API_TOKEN = "token";
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 400,
          textBody: JSON.stringify({ message: "bad" }),
        }),
      )
      .mockResolvedValueOnce(mockResponse({ ok: true, textBody: "not-json" }))
      .mockRejectedValueOnce(new Error("net down"))
      .mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: { customer_id: "cus_123" } }),
      );

    await expect(ensureStripeCustomerForRestaurant("r1")).resolves.toEqual({
      ok: false,
      error: "bad",
    });
    await expect(
      ensureStripeCustomerForRestaurant("r1"),
    ).resolves.toMatchObject({
      ok: false,
    });
    await expect(ensureStripeCustomerForRestaurant("r1")).resolves.toEqual({
      ok: false,
      error: "net down",
    });
    await expect(ensureStripeCustomerForRestaurant("r1")).resolves.toEqual({
      ok: true,
      customerId: "cus_123",
    });
  });
});
