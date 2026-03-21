/**
 * Unit tests for SumUp Payment Provider
 * - createIntent: config validation, fetch success/error, network failure
 * - captureIntent: config validation, fetch success/not_paid/error
 * - handleWebhookEvent: invalid JSON, success/error paths
 */

import {
  createIntent,
  captureIntent,
  handleWebhookEvent,
} from "../../../../docker-core/server/payments/providers/sumupProvider";

const validConfig = { accessToken: "sk_test_sumup_123" };
const createParams = {
  restaurantId: "rest-1",
  orderId: "ord-1",
  amount: 1500,
  currency: "EUR",
};

describe("sumupProvider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("createIntent", () => {
    it("returns provider_not_configured when accessToken is missing", async () => {
      const result = await createIntent({ accessToken: "" }, createParams);
      expect("error" in result).toBe(true);
      expect((result as { error: { code: string } }).error.code).toBe("provider_not_configured");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns intent on fetch 200 with valid JSON", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_123",
              status: "PENDING",
              amount: 15.0,
              currency: "EUR",
              checkout_reference: "ord-1",
            })
          ),
      });

      const result = await createIntent(validConfig, createParams);
      expect("intent" in result).toBe(true);
      const intent = (result as { intent: unknown }).intent as {
        id: string;
        status: string;
        amount: number;
        provider: string;
      };
      expect(intent.id).toBe("chk_123");
      expect(intent.status).toBe("created");
      expect(intent.amount).toBe(1500);
      expect(intent.provider).toBe("sumup");
    });

    it("returns error with retryable false on fetch 4xx", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve(JSON.stringify({ message: "Invalid amount" })),
      });

      const result = await createIntent(validConfig, createParams);
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string; retryable: boolean } }).error;
      expect(err.code).toBe("sumup_api_error");
      expect(err.retryable).toBe(false);
    });

    it("returns error with retryable true on fetch 5xx", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: () => Promise.resolve(JSON.stringify({ error: "SumUp down" })),
      });

      const result = await createIntent(validConfig, createParams);
      expect("error" in result).toBe(true);
      const err = (result as { error: { retryable: boolean } }).error;
      expect(err.retryable).toBe(true);
    });

    it("returns network_error when fetch throws", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await createIntent(validConfig, createParams);
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string; retryable: boolean } }).error;
      expect(err.code).toBe("network_error");
      expect(err.retryable).toBe(true);
    });

    it("maps PAID status to succeeded", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_456",
              status: "PAID",
              amount: 20.0,
              currency: "EUR",
            })
          ),
      });

      const result = await createIntent(validConfig, createParams);
      expect("intent" in result).toBe(true);
      expect((result as { intent: { status: string } }).intent.status).toBe("succeeded");
    });

    it("maps EXPIRED status to expired", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_exp",
              status: "EXPIRED",
              amount: 5.0,
              currency: "EUR",
            })
          ),
      });

      const result = await createIntent(validConfig, createParams);
      expect("intent" in result).toBe(true);
      expect((result as { intent: { status: string } }).intent.status).toBe("expired");
    });

    it("maps unknown status to processing", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_unk",
              status: "SOMETHING_NEW",
              amount: 10.0,
              currency: "EUR",
            })
          ),
      });

      const result = await createIntent(validConfig, createParams);
      expect("intent" in result).toBe(true);
      expect((result as { intent: { status: string } }).intent.status).toBe("processing");
    });

    it("returns sumup_api_error with fallback message when 4xx body is not JSON", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("<html>error page</html>"),
      });

      const result = await createIntent(validConfig, createParams);
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string; message: string } }).error;
      expect(err.code).toBe("sumup_api_error");
      expect(err.message).toContain("400");
      expect(err.message).toContain("error page");
    });

    it("uses checkoutReference when provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_789",
              status: "PENDING",
              amount: 10.0,
              currency: "EUR",
            })
          ),
      });

      await createIntent(validConfig, {
        ...createParams,
        orderId: null,
        checkoutReference: "my-ref-123",
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.checkout_reference).toBe("my-ref-123");
    });
  });

  describe("captureIntent", () => {
    it("returns provider_not_configured when accessToken is missing", async () => {
      const result = await captureIntent({ accessToken: "" }, { intentId: "chk_1" });
      expect("error" in result).toBe(true);
      expect((result as { error: { code: string } }).error.code).toBe("provider_not_configured");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns receipt on fetch 200 with PAID status", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_1",
              status: "PAID",
              amount: 15.5,
              currency: "EUR",
            })
          ),
      });

      const result = await captureIntent(validConfig, { intentId: "chk_1" });
      expect("receipt" in result).toBe(true);
      const receipt = (result as { receipt: unknown }).receipt as {
        intent_id: string;
        provider: string;
        amount: number;
        currency: string;
      };
      expect(receipt.intent_id).toBe("chk_1");
      expect(receipt.provider).toBe("sumup");
      expect(receipt.amount).toBe(1550);
      expect(receipt.currency).toBe("EUR");
    });

    it("returns not_paid when status is PENDING", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_2",
              status: "PENDING",
              amount: 10.0,
              currency: "EUR",
            })
          ),
      });

      const result = await captureIntent(validConfig, { intentId: "chk_2" });
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string } }).error;
      expect(err.code).toBe("not_paid");
    });

    it("returns capture_failed when fetch is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve(""),
      });

      const result = await captureIntent(validConfig, { intentId: "chk_3" });
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string } }).error;
      expect(err.code).toBe("capture_failed");
    });

    it("returns capture_failed when fetch throws", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Timeout"));

      const result = await captureIntent(validConfig, { intentId: "chk_4" });
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string; retryable: boolean } }).error;
      expect(err.code).toBe("capture_failed");
      expect(err.retryable).toBe(true);
    });

    it("returns capture_failed when 200 body is not JSON", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("not-json"),
      });

      const result = await captureIntent(validConfig, { intentId: "chk_4" });
      expect("error" in result).toBe(true);
      const err = (result as { error: { code: string } }).error;
      expect(err.code).toBe("capture_failed");
    });

    it("accepts SUCCESS as paid status", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chk_5",
              status: "SUCCESS",
              amount: 25.0,
              currency: "EUR",
            })
          ),
      });

      const result = await captureIntent(validConfig, { intentId: "chk_5" });
      expect("receipt" in result).toBe(true);
    });
  });

  describe("handleWebhookEvent", () => {
    it("returns ok: false with status 400 for invalid JSON", () => {
      const result = handleWebhookEvent("not json", undefined, undefined, () => {});
      expect(result.ok).toBe(false);
      expect((result as { status: number }).status).toBe(400);
      expect((result as { json: { error: string } }).json.error).toBe("invalid_json");
    });

    it("returns ok: true and calls handler for valid SumUp paid payload", () => {
      const handler = jest.fn();
      const body = JSON.stringify({
        id: "pay_1",
        status: "PAID",
        amount: 1000,
        currency: "EUR",
      });

      const result = handleWebhookEvent(body, "sig", "secret", handler);

      expect(result.ok).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it("returns ok: true and calls errorHandler for normalized error", () => {
      const errorHandler = jest.fn();
      const body = JSON.stringify({ status: "FAILED", error: "payment_declined" });

      const result = handleWebhookEvent(body, "sig", "secret", () => {}, errorHandler);

      expect(result.ok).toBe(true);
      expect(errorHandler).toHaveBeenCalled();
    });
  });
});
