/**
 * coreBillingApi — createSaasPortalSession, ensureStripeCustomerForRestaurant,
 * resolveStripePriceId, getSubscription.
 * Blinda zona de receita restante.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackendType } from "../infra/backendAdapter";

const configState = vi.hoisted(() => ({
  API_BASE: "",
  INTERNAL_API_TOKEN: "",
  isEdgeGateway: false,
}));
const getBackendTypeMock = vi.hoisted(() => vi.fn());
const dockerCoreClientMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../../config", () => ({
  CONFIG: {
    CORE_URL: "http://localhost:3001/rest/v1",
    CORE_ANON_KEY: "test-anon-key",
    get API_BASE() {
      return configState.API_BASE;
    },
    get INTERNAL_API_TOKEN() {
      return configState.INTERNAL_API_TOKEN;
    },
    get isEdgeGateway() {
      return configState.isEdgeGateway;
    },
  },
}));
vi.mock("../infra/backendAdapter", () => ({
  getBackendType: (...args: unknown[]) => getBackendTypeMock(...args),
  BackendType: { docker: "docker", none: "none" },
}));
vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: () => dockerCoreClientMock,
}));

const restaurantId = "00000000-0000-0000-0000-000000000001";
const returnUrl = "https://app.example.com/billing";

describe("coreBillingApi — billing hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBackendTypeMock.mockReturnValue(BackendType.docker);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── createSaasPortalSession ─────────────────────────────────────
  describe("createSaasPortalSession", () => {
    it("success → url", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ url: "https://billing.stripe.com/portal" }),
      });

      const { createSaasPortalSession } = await import("./coreBillingApi");
      const result = await createSaasPortalSession(returnUrl);

      expect(result.url).toBe("https://billing.stripe.com/portal");
      expect(result.error).toBeUndefined();
    });

    it("res.ok false → error propagado", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      const { createSaasPortalSession } = await import("./coreBillingApi");
      const result = await createSaasPortalSession(returnUrl);

      expect(result.url).toBe("");
      expect(result.error).toBe("Server error");
    });

    it("JSON inválido → Invalid JSON from Core", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "x",
      });

      const { createSaasPortalSession } = await import("./coreBillingApi");
      const result = await createSaasPortalSession(returnUrl);

      expect(result.url).toBe("");
      expect(result.error).toBe("Invalid JSON from Core");
    });

    it("data sem url → Core did not return portal URL", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      const { createSaasPortalSession } = await import("./coreBillingApi");
      const result = await createSaasPortalSession(returnUrl);

      expect(result.url).toBe("");
      expect(result.error).toBe("Core did not return portal URL");
    });
  });

  // ─── ensureStripeCustomerForRestaurant ───────────────────────────
  describe("ensureStripeCustomerForRestaurant", () => {
    it("API_BASE ausente → ok false", async () => {
      configState.API_BASE = "";
      configState.INTERNAL_API_TOKEN = "token";

      const { ensureStripeCustomerForRestaurant } = await import("./coreBillingApi");
      const result = await ensureStripeCustomerForRestaurant(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("API_BASE");
    });

    it("INTERNAL_API_TOKEN ausente → ok false", async () => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "";

      const { ensureStripeCustomerForRestaurant } = await import("./coreBillingApi");
      const result = await ensureStripeCustomerForRestaurant(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("INTERNAL_API_TOKEN");
    });

    it("success → ok true, customerId", async () => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "token";
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ customer_id: "cus_xxx" }),
      });

      const { ensureStripeCustomerForRestaurant } = await import("./coreBillingApi");
      const result = await ensureStripeCustomerForRestaurant(restaurantId);

      expect(result.ok).toBe(true);
      expect(result.customerId).toBe("cus_xxx");
    });

    it("res.ok false → ok false, error", async () => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "token";
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: "Already exists" }),
      });

      const { ensureStripeCustomerForRestaurant } = await import("./coreBillingApi");
      const result = await ensureStripeCustomerForRestaurant(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Already exists");
    });

    it("JSON inválido → Invalid JSON from customer provisioning", async () => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "token";
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "x",
      });

      const { ensureStripeCustomerForRestaurant } = await import("./coreBillingApi");
      const result = await ensureStripeCustomerForRestaurant(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Invalid JSON");
    });

    it("fetch throws → Network error", async () => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "token";
      (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      const { ensureStripeCustomerForRestaurant } = await import("./coreBillingApi");
      const result = await ensureStripeCustomerForRestaurant(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Network failure");
    });
  });

  // ─── resolveStripePriceId ────────────────────────────────────────
  describe("resolveStripePriceId", () => {
    const plan = {
      id: "plan_1",
      name: "Pro",
      tier: "pro",
      stripe_price_id: null as string | null,
      price_cents: 1999,
      currency: "EUR",
      interval: "month",
      features: [],
      max_devices: 5,
      max_integrations: 2,
      max_delivery_orders: 100,
      sort_order: 1,
      active: true,
    };

    it("planPriceRow com stripe_price_id → retorna esse", async () => {
      const { resolveStripePriceId } = await import("./coreBillingApi");
      const planPriceRow = { plan_id: "plan_1", currency: "EUR", stripe_price_id: "price_123", price_cents: 1999, interval: "month" };
      expect(resolveStripePriceId(plan, "EUR", planPriceRow)).toBe("price_123");
    });

    it("plan.stripe_price_id quando planPriceRow null → retorna plan", async () => {
      const { resolveStripePriceId } = await import("./coreBillingApi");
      const p = { ...plan, stripe_price_id: "price_plan" };
      expect(resolveStripePriceId(p, "EUR", null)).toBe("price_plan");
    });

    it("fallback plan.tier quando ambos ausentes", async () => {
      const { resolveStripePriceId } = await import("./coreBillingApi");
      const p = { ...plan, stripe_price_id: null };
      expect(resolveStripePriceId(p, "EUR", null)).toBe("pro");
    });
  });

  // ─── getSubscription ─────────────────────────────────────────────
  describe("getSubscription", () => {
    it("error presente → null", async () => {
      const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: null, error: { message: "table missing" } }) };
      dockerCoreClientMock.from.mockReturnValue(chain);

      const { getSubscription } = await import("./coreBillingApi");
      const result = await getSubscription(restaurantId);

      expect(result).toBeNull();
    });

    it("data vazio → null", async () => {
      const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
      dockerCoreClientMock.from.mockReturnValue(chain);

      const { getSubscription } = await import("./coreBillingApi");
      const result = await getSubscription(restaurantId);

      expect(result).toBeNull();
    });

    it("data com row → retorna row", async () => {
      const row = {
        id: "sub_1",
        restaurant_id: restaurantId,
        plan_id: "plan_pro",
        status: "active",
        stripe_customer_id: "cus_1",
        stripe_subscription_id: "sub_stripe",
        current_period_start: "2024-01-01",
        current_period_end: "2024-02-01",
        trial_end: null,
        cancel_at: null,
        canceled_at: null,
        addons: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [row], error: null }) };
      dockerCoreClientMock.from.mockReturnValue(chain);

      const { getSubscription } = await import("./coreBillingApi");
      const result = await getSubscription(restaurantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe("sub_1");
      expect(result!.status).toBe("active");
    });
  });
});
