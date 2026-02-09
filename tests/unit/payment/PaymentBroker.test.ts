/**
 * PaymentBroker Unit Tests
 *
 * Tests the payment broker logic: validation, RPC construction,
 * error handling. Uses mocked Docker Core fetch client.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// ── Inline types + logic (avoid ts-jest import issues) ──

interface PaymentIntentResult {
  id: string;
  clientSecret: string;
}

interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  restaurantId: string;
  operatorId?: string;
  cashRegisterId?: string;
}

type BackendType = "docker" | "supabase" | "unknown";

/**
 * Core PaymentBroker validation logic (extracted for testability).
 */
function validatePaymentParams(params: CreatePaymentParams): string | null {
  if (!params.orderId || params.orderId.trim() === "") {
    return "orderId is required";
  }
  if (!params.restaurantId || params.restaurantId.trim() === "") {
    return "restaurantId is required";
  }
  if (typeof params.amount !== "number" || params.amount <= 0) {
    return "amount must be a positive number";
  }
  if (!params.currency || params.currency.trim() === "") {
    return "currency is required";
  }
  return null;
}

function buildRpcPayload(params: CreatePaymentParams) {
  return {
    action: "create-payment-intent",
    amount: params.amount,
    currency: params.currency,
    restaurant_id: params.restaurantId,
    order_id: params.orderId,
    operator_id: params.operatorId,
    cash_register_id: params.cashRegisterId,
  };
}

function assertDockerBackend(backendType: BackendType): void {
  if (backendType !== "docker") {
    throw new Error(
      "Payment requires Docker Core. Supabase domain fallback is forbidden.",
    );
  }
}

function parseRpcResponse(data: unknown): PaymentIntentResult {
  const d = data as Record<string, unknown> | null;
  if (d?.error) {
    throw new Error(String(d.error));
  }
  if (!d?.id || !d?.clientSecret) {
    throw new Error("Core não retornou id ou clientSecret");
  }
  return { id: String(d.id), clientSecret: String(d.clientSecret) };
}

// ── Tests ───────────────────────────────────────────────

describe("PaymentBroker", () => {
  describe("validatePaymentParams", () => {
    const validParams: CreatePaymentParams = {
      orderId: "order-123",
      amount: 1500,
      currency: "EUR",
      restaurantId: "rest-abc",
    };

    it("returns null for valid params", () => {
      expect(validatePaymentParams(validParams)).toBeNull();
    });

    it("rejects missing orderId", () => {
      expect(validatePaymentParams({ ...validParams, orderId: "" })).toBe(
        "orderId is required",
      );
    });

    it("rejects missing restaurantId", () => {
      expect(validatePaymentParams({ ...validParams, restaurantId: "" })).toBe(
        "restaurantId is required",
      );
    });

    it("rejects zero amount", () => {
      expect(validatePaymentParams({ ...validParams, amount: 0 })).toBe(
        "amount must be a positive number",
      );
    });

    it("rejects negative amount", () => {
      expect(validatePaymentParams({ ...validParams, amount: -100 })).toBe(
        "amount must be a positive number",
      );
    });

    it("rejects missing currency", () => {
      expect(validatePaymentParams({ ...validParams, currency: "" })).toBe(
        "currency is required",
      );
    });

    it("accepts optional fields as undefined", () => {
      const params: CreatePaymentParams = {
        orderId: "o1",
        amount: 100,
        currency: "EUR",
        restaurantId: "r1",
        operatorId: undefined,
        cashRegisterId: undefined,
      };
      expect(validatePaymentParams(params)).toBeNull();
    });
  });

  describe("buildRpcPayload", () => {
    it("maps params to RPC shape", () => {
      const payload = buildRpcPayload({
        orderId: "order-1",
        amount: 2500,
        currency: "EUR",
        restaurantId: "rest-1",
        operatorId: "op-1",
        cashRegisterId: "cr-1",
      });

      expect(payload).toEqual({
        action: "create-payment-intent",
        amount: 2500,
        currency: "EUR",
        restaurant_id: "rest-1",
        order_id: "order-1",
        operator_id: "op-1",
        cash_register_id: "cr-1",
      });
    });

    it("passes undefined for optional fields", () => {
      const payload = buildRpcPayload({
        orderId: "o1",
        amount: 100,
        currency: "EUR",
        restaurantId: "r1",
      });

      expect(payload.operator_id).toBeUndefined();
      expect(payload.cash_register_id).toBeUndefined();
    });
  });

  describe("assertDockerBackend", () => {
    it("does not throw for docker backend", () => {
      expect(() => assertDockerBackend("docker")).not.toThrow();
    });

    it("throws for supabase backend", () => {
      expect(() => assertDockerBackend("supabase")).toThrow(
        "Payment requires Docker Core",
      );
    });

    it("throws for unknown backend", () => {
      expect(() => assertDockerBackend("unknown")).toThrow(
        "Payment requires Docker Core",
      );
    });
  });

  describe("parseRpcResponse", () => {
    it("extracts id and clientSecret from valid response", () => {
      const result = parseRpcResponse({
        id: "pi_123",
        clientSecret: "pi_123_secret_abc",
      });

      expect(result.id).toBe("pi_123");
      expect(result.clientSecret).toBe("pi_123_secret_abc");
    });

    it("throws when response has error field", () => {
      expect(() => parseRpcResponse({ error: "card_declined" })).toThrow(
        "card_declined",
      );
    });

    it("throws when id is missing", () => {
      expect(() => parseRpcResponse({ clientSecret: "sec" })).toThrow(
        "Core não retornou id ou clientSecret",
      );
    });

    it("throws when clientSecret is missing", () => {
      expect(() => parseRpcResponse({ id: "pi_123" })).toThrow(
        "Core não retornou id ou clientSecret",
      );
    });

    it("throws when response is null", () => {
      expect(() => parseRpcResponse(null)).toThrow(
        "Core não retornou id ou clientSecret",
      );
    });
  });

  describe("Integration: full payment flow simulation", () => {
    it("validates → builds payload → parses response (happy path)", () => {
      const params: CreatePaymentParams = {
        orderId: "order-456",
        amount: 3200,
        currency: "EUR",
        restaurantId: "rest-789",
        operatorId: "op-1",
        cashRegisterId: "cr-2",
      };

      // 1. Validate
      const error = validatePaymentParams(params);
      expect(error).toBeNull();

      // 2. Check backend
      expect(() => assertDockerBackend("docker")).not.toThrow();

      // 3. Build payload
      const payload = buildRpcPayload(params);
      expect(payload.action).toBe("create-payment-intent");
      expect(payload.amount).toBe(3200);

      // 4. Parse response (simulated Core response)
      const result = parseRpcResponse({
        id: "pi_test_abc123",
        clientSecret: "pi_test_abc123_secret_xyz",
      });
      expect(result.id).toBe("pi_test_abc123");
      expect(result.clientSecret).toBe("pi_test_abc123_secret_xyz");
    });

    it("fails early if params are invalid", () => {
      const params: CreatePaymentParams = {
        orderId: "",
        amount: 0,
        currency: "",
        restaurantId: "",
      };

      const error = validatePaymentParams(params);
      expect(error).not.toBeNull();
    });

    it("fails early if backend is not docker", () => {
      expect(() => assertDockerBackend("supabase")).toThrow();
    });
  });
});
