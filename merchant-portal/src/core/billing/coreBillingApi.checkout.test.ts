/**
 * createCheckoutSession — Blocos Gateway e Core.
 * Isolado em ficheiro separado para evitar fragilizar api.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackendType } from "../infra/backendAdapter";

const configState = vi.hoisted(() => ({
  API_BASE: "",
  INTERNAL_API_TOKEN: "",
  isEdgeGateway: false,
}));
const getBackendTypeMock = vi.hoisted(() => vi.fn());

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

const priceId = "price_xxx";
const successUrl = "https://app.example.com/success";
const cancelUrl = "https://app.example.com/cancel";
const restaurantId = "00000000-0000-0000-0000-000000000001";

describe("createCheckoutSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Gateway path", () => {
    beforeEach(() => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "token";
      configState.isEdgeGateway = false;
    });

    it("A1: usa URL relativa quando isLocalGateway (localhost:4320)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ url: "https://checkout.stripe.com/sess", session_id: "cs_1" }),
      });
      (globalThis as any).fetch = fetchMock;

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.error).toBeUndefined();
      expect(result.url).toBe("https://checkout.stripe.com/sess");
      expect(fetchMock).toHaveBeenCalledWith(
        "/internal/billing/create-checkout-session",
        expect.any(Object),
      );
    });

    it("A1: usa URL absoluta quando apiBase não é localhost", async () => {
      configState.API_BASE = "https://api.example.com";
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ url: "https://checkout.stripe.com/sess", session_id: "cs_1" }),
      });
      (globalThis as any).fetch = fetchMock;

      const { createCheckoutSession } = await import("./coreBillingApi");
      await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/internal/billing/create-checkout-session",
        expect.any(Object),
      );
    });

    it("A2: usa path Edge quando isEdgeGateway", async () => {
      configState.isEdgeGateway = true;
      configState.API_BASE = "https://xxx.supabase.co/functions/v1";
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ url: "https://checkout.stripe.com/sess" }),
      });
      (globalThis as any).fetch = fetchMock;

      const { createCheckoutSession } = await import("./coreBillingApi");
      await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://xxx.supabase.co/functions/v1/billing-create-checkout-session",
        expect.any(Object),
      );
    });

    it("A3a: fetch throws TypeError Failed to fetch → mensagem dev:gateway", async () => {
      (globalThis as any).fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toContain("dev:gateway");
      expect(result.error).toContain("4320");
    });

    it("A3b: fetch throws Error custom → e.message", async () => {
      (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error("Custom error"));

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toBe("Custom error");
    });

    it("A3c: fetch throws non-Error → Erro de ligação", async () => {
      (globalThis as any).fetch = vi.fn().mockRejectedValue("raw string");

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toContain("Erro de ligação ao servidor de checkout");
    });

    it("A4a: res.ok false com JSON message → errorMessage = j.message", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: "Stripe error: invalid price" }),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toContain("Stripe error");
    });

    it("A4b: res.ok false com JSON inválido → mantém text", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "not valid json",
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toBeTruthy();
    });

    it("A5: res.ok true mas JSON inválido → Resposta inválida do gateway", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "{",
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toBe("Resposta inválida do gateway.");
    });

    it("A6: JSON válido sem url → O gateway não devolveu o URL", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toBe("O gateway não devolveu o URL de checkout.");
    });

    it("A7: success → url e sessionId", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({ url: "https://checkout.stripe.com/sess", session_id: "cs_123" }),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("https://checkout.stripe.com/sess");
      expect(result.sessionId).toBe("cs_123");
      expect(result.error).toBeUndefined();
    });
  });

  describe("Core path", () => {
    beforeEach(() => {
      configState.API_BASE = "";
      configState.INTERNAL_API_TOKEN = "";
      getBackendTypeMock.mockReturnValue(BackendType.docker);
    });

    it("B1: requireCore falha quando backend !== docker", async () => {
      getBackendTypeMock.mockReturnValue(BackendType.none);

      const { createCheckoutSession } = await import("./coreBillingApi");

      await expect(
        createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId),
      ).rejects.toThrow("Billing requires Core");
    });

    it("B2: 404 com PGRST202 → mensagem de migração", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ code: "PGRST202", message: "relation does not exist" }),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toContain("migração");
      expect(result.error).toContain("MIGRATIONS");
    });

    it("B3: 404 sem PGRST202 → erro normal", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: "Not found" }),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).not.toContain("migração");
    });

    it("B4: res.ok true mas JSON inválido → Invalid JSON from Core", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "invalid",
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toBe("Invalid JSON from Core");
    });

    it("B5: JSON válido sem url → Core did not return checkout URL", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({}),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("");
      expect(result.error).toBe("Core did not return checkout URL");
    });

    it("B6: success Core → url e sessionId", async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({ url: "https://checkout.stripe.com/core", session_id: "cs_core" }),
      });

      const { createCheckoutSession } = await import("./coreBillingApi");
      const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

      expect(result.url).toBe("https://checkout.stripe.com/core");
      expect(result.sessionId).toBe("cs_core");
      expect(result.error).toBeUndefined();
    });
  });

  // ─── Hardening: timeout, idempotency, error mapping, contract shape ─────
  describe("hardening", () => {
    describe("Gateway path", () => {
      beforeEach(() => {
        configState.API_BASE = "http://localhost:4320";
        configState.INTERNAL_API_TOKEN = "token";
      });

      it("timeout simulado: fetch rejects com abort-like error → propaga mensagem", async () => {
        (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error("The operation was aborted"));

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(result.url).toBe("");
        expect(result.error).toBe("The operation was aborted");
      });

      it("idempotência: duas chamadas consecutivas retornam resultado consistente", async () => {
        const body = { url: "https://checkout.stripe.com/sess", session_id: "cs_same" };
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify(body),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const r1 = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);
        const r2 = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(r1.url).toBe(r2.url);
        expect(r1.sessionId).toBe(r2.sessionId);
        expect(r1.error).toBeUndefined();
        expect(r2.error).toBeUndefined();
      });

      it.each([
        [401, "Unauthorized"],
        [409, "Subscription already active"],
        [422, "Invalid price_id format"],
        [500, "Internal Server Error"],
      ] as const)(
        "error mapping %i → mensagem propagada",
        async (status, message) => {
          (globalThis as any).fetch = vi.fn().mockResolvedValue({
            ok: false,
            status,
            text: async () => JSON.stringify({ message }),
          });

          const { createCheckoutSession } = await import("./coreBillingApi");
          const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

          expect(result.url).toBe("");
          expect(result.error).toBe(message);
        },
      );

      it("401 sem message: usa text como fallback quando JSON inválido", async () => {
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(result.url).toBe("");
        expect(result.error).toBe("Unauthorized");
      });

      it("contract shape: resposta sem session_id → url presente, sessionId undefined", async () => {
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () => JSON.stringify({ url: "https://checkout.stripe.com/sess" }),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(result.url).toBe("https://checkout.stripe.com/sess");
        expect(result.sessionId).toBeUndefined();
      });

      it("contract shape: resposta com campos extra → ignora, retorna url e sessionId", async () => {
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: true,
          text: async () =>
            JSON.stringify({
              url: "https://checkout.stripe.com/sess",
              session_id: "cs_1",
              extra_field: "ignored",
            }),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(result.url).toBe("https://checkout.stripe.com/sess");
        expect(result.sessionId).toBe("cs_1");
      });

      it("priceId inválido: backend 400 → erro propagado", async () => {
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: async () => JSON.stringify({ message: "Invalid price_id" }),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession("invalid", successUrl, cancelUrl, restaurantId);

        expect(result.error).toBe("Invalid price_id");
      });

      it("restaurantId inválido: backend 422 → erro propagado", async () => {
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 422,
          text: async () => JSON.stringify({ message: "Invalid restaurant_id" }),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession(priceId, successUrl, cancelUrl, "bad-id");

        expect(result.error).toBe("Invalid restaurant_id");
      });
    });

    describe("Core path", () => {
      beforeEach(() => {
        configState.API_BASE = "";
        configState.INTERNAL_API_TOKEN = "";
        getBackendTypeMock.mockReturnValue(BackendType.docker);
      });

      it("observabilidade: erro crítico tem mensagem consistente", async () => {
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ message: "Server error" }),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        const result = await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(result.error).toBeTruthy();
        expect(typeof result.error).toBe("string");
        expect(result.error!.length).toBeGreaterThan(0);
      });

      it("observabilidade: sem console.error em erro propagado", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        (globalThis as any).fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ message: "Unauthorized" }),
        });

        const { createCheckoutSession } = await import("./coreBillingApi");
        await createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId);

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      });
    });
  });
});
