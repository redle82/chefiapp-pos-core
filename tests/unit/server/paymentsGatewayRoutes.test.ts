/**
 * Unit tests for Payment Gateway route handlers
 * - Handlers return correct shape { ok, data } or { ok: false, error: { code, message } }
 * - 403/400 semantic error mapping
 */

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

import {
  handleCapturePaymentIntent,
  handleCreatePaymentIntent,
  handleMarkPixPaid,
} from "../../../server/paymentsRouterHandler";

const config = {
  coreUrl: "http://localhost:3001",
  coreServiceKey: "test-key",
  stripeSecretKey: "",
  sumupAccessToken: "",
  sumupApiBaseUrl: "https://api.sumup.com",
};

describe("paymentsGatewayRoutes", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("POST /api/v1/payments/intents handler", () => {
    it("returns shape { ok, data } on success", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: "uuid-1",
            restaurant_id: "r1",
            amount: 1000,
            provider: "pix",
            status: "requires_action",
          }),
      });
      const r = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toBeDefined();
      }
    });

    it("returns shape { ok: false, error: { code, message } } on validation_error", async () => {
      const r = await handleCreatePaymentIntent(config, {
        restaurant_id: "",
        amount: 100,
        method: "card",
        country: "US",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe("validation_error");
        expect(typeof r.error.message).toBe("string");
      }
    });

    it("forwards idempotency key to Core RPC payload", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ id: "uuid-1" }),
      });

      await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        order_id: "ord_1",
        idempotency_key: "checkout:ord_1:retry_1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const payload = JSON.parse(String(options.body)) as {
        p_idempotency_key?: string;
      };
      expect(payload.p_idempotency_key).toBe("checkout:ord_1:retry_1");
    });

    it("maps subscription_blocked to 403 semantically", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => "SUBSCRIPTION_BLOCKED: Subscription is paused",
      });
      const r = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("subscription_blocked");
    });

    it("maps forbidden/order_not_found/invalid_transition/upstream_timeout", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "UNAUTHORIZED: actor lacks role",
      });
      const forbidden = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(forbidden.ok).toBe(false);
      if (!forbidden.ok) expect(forbidden.error.code).toBe("forbidden");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "ORDER_NOT_FOUND: order not in restaurant",
      });
      const notFound = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(notFound.ok).toBe(false);
      if (!notFound.ok) expect(notFound.error.code).toBe("order_not_found");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "INVALID_TRANSITION: OPEN -> CLOSED",
      });
      const invalidTransition = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(invalidTransition.ok).toBe(false);
      if (!invalidTransition.ok)
        expect(invalidTransition.error.code).toBe("invalid_transition");

      mockFetch.mockRejectedValueOnce({ name: "AbortError" });
      const timeout = await handleCreatePaymentIntent(config, {
        restaurant_id: "r1",
        amount: 1000,
        method: "pix",
        country: "BR",
      });
      expect(timeout.ok).toBe(false);
      if (!timeout.ok) expect(timeout.error.code).toBe("upstream_timeout");
    });
  });

  describe("POST /api/v1/payments/capture handler", () => {
    it("returns 400-mappable intent_not_found", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => "PAYMENT_INTENT_NOT_FOUND",
      });
      const r = await handleCapturePaymentIntent(config, { intent_id: "bad" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("intent_not_found");
    });

    it("maps forbidden and upstream_unavailable", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "ACTOR_REQUIRED: actor id missing",
      });
      const forbidden = await handleCapturePaymentIntent(config, {
        intent_id: "pi_1",
      });
      expect(forbidden.ok).toBe(false);
      if (!forbidden.ok) expect(forbidden.error.code).toBe("forbidden");

      mockFetch.mockRejectedValueOnce(new Error("socket hang up"));
      const unavailable = await handleCapturePaymentIntent(config, {
        intent_id: "pi_1",
      });
      expect(unavailable.ok).toBe(false);
      if (!unavailable.ok)
        expect(unavailable.error.code).toBe("upstream_unavailable");
    });
  });

  describe("POST /api/v1/payments/pix/paid handler", () => {
    it("returns 403-mappable forbidden for RBAC denial", async () => {
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

    it("maps upstream timeout for gateway retry handling", async () => {
      mockFetch.mockRejectedValueOnce({ name: "AbortError" });
      const r = await handleMarkPixPaid(config, {
        intent_id: "i1",
        actor_user_id: "u1",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("upstream_timeout");
    });

    it("returns 400-mappable validation_error when actor_user_id missing", async () => {
      const r = await handleMarkPixPaid(config, {
        intent_id: "i1",
        actor_user_id: "",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("validation_error");
    });
  });
});
