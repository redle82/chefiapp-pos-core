/**
 * Unit tests for Payment Intents RPC handlers (via paymentsRouterHandler)
 * - create intent persists (mocked RPC)
 * - capture changes status (mocked)
 * - pix intent manual paid marks receipt (mocked)
 * - RBAC denial cases (actor missing, role insufficient)
 *
 * Uses mocked fetch to Core RPC.
 */

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  (global as any).fetch = mockFetch;
});

import {
  handleCreatePaymentIntent,
  handleCapturePaymentIntent,
  handleMarkPixPaid,
} from "../../../server/paymentsRouterHandler";

const config = {
  coreUrl: "http://localhost:3001",
  coreServiceKey: "test-key",
  stripeSecretKey: "sk_test_xxx",
  sumupAccessToken: "sumup-token",
  sumupApiBaseUrl: "https://api.sumup.com",
};

describe("paymentIntentsRpc", () => {
  describe("handleCreatePaymentIntent", () => {
    it("returns validation_error when restaurant_id or amount missing", async () => {
      const r1 = await handleCreatePaymentIntent(config, {
        restaurant_id: "",
        amount: 100,
        method: "card",
        country: "US",
      });
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.error.code).toBe("validation_error");

      const r2 = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: -1,
        method: "card",
        country: "US",
      });
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.error.code).toBe("validation_error");
    });

    it("returns provider error when Stripe is not configured", async () => {
      const emptyConfig = { ...config, stripeSecretKey: "" };
      mockFetch.mockRejectedValue(new Error("Stripe not configured"));
      const r = await handleCreatePaymentIntent(emptyConfig, {
        restaurant_id: "r1",
        order_id: null,
        amount: 1000,
        method: "card",
        country: "US",
      });
      expect(r.ok).toBe(false);
    });

    it("returns ok and data when Pix create succeeds and RPC persists", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ id: "pix_1", status: "requires_action" }) })
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            JSON.stringify({
              id: "uuid-1",
              restaurant_id: "r1",
              order_id: "o1",
              amount: 1000,
              provider: "pix",
              status: "requires_action",
            }),
        });
      const r = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        order_id: "o1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeDefined();
    });
  });

  describe("handleCapturePaymentIntent", () => {
    it("returns validation_error when intent_id missing", async () => {
      const r = await handleCapturePaymentIntent(config, { intent_id: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("validation_error");
    });

    it("returns intent_not_found when RPC raises PAYMENT_INTENT_NOT_FOUND", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => "PAYMENT_INTENT_NOT_FOUND: Intent xyz not found",
      });
      const r = await handleCapturePaymentIntent(config, { intent_id: "xyz" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("intent_not_found");
    });

    it("returns ok when RPC succeeds", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({ success: true, intent_id: "i1", receipt_id: "rec1" }),
      });
      const r = await handleCapturePaymentIntent(config, { intent_id: "i1" });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeDefined();
    });
  });

  describe("handleMarkPixPaid", () => {
    it("returns validation_error when intent_id or actor_user_id missing", async () => {
      const r1 = await handleMarkPixPaid(config, {
        intent_id: "",
        actor_user_id: "u1",
      });
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.error.code).toBe("validation_error");

      const r2 = await handleMarkPixPaid(config, {
        intent_id: "i1",
        actor_user_id: "",
      });
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.error.code).toBe("validation_error");
    });

    it("returns forbidden when RPC raises UNAUTHORIZED (RBAC denial)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => "UNAUTHORIZED: actor must have manager or owner role",
      });
      const r = await handleMarkPixPaid(config, {
        intent_id: "i1",
        actor_user_id: "u1",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("forbidden");
    });

    it("returns ok when RPC succeeds", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({ success: true, intent_id: "i1", receipt_id: "rec1" }),
      });
      const r = await handleMarkPixPaid(config, {
        intent_id: "i1",
        actor_user_id: "u1",
        proof_text: "proof",
      });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeDefined();
    });
  });
});
