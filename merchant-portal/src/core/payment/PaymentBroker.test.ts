import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetBackendType, mockGetDockerCoreFetchClient, mockLogger } =
  vi.hoisted(() => ({
    mockGetBackendType: vi.fn(),
    mockGetDockerCoreFetchClient: vi.fn(),
    mockLogger: {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
  }));

const mockConfig = vi.hoisted(() => ({
  CORE_URL: "http://localhost:3001",
  API_BASE: "http://localhost:4320",
  isEdgeGateway: false,
}));

vi.mock("../infra/backendAdapter", () => ({
  BackendType: { docker: "docker", none: "none" },
  getBackendType: mockGetBackendType,
}));

vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: mockGetDockerCoreFetchClient,
}));

vi.mock("../logger", () => ({
  Logger: mockLogger,
}));

vi.mock("../../config", () => ({
  CONFIG: mockConfig,
}));

import { PaymentBroker } from "./PaymentBroker";

function mockResponse(options: {
  ok?: boolean;
  status?: number;
  jsonBody?: unknown;
  jsonThrows?: boolean;
}): Response {
  const {
    ok = true,
    status = 200,
    jsonBody = {},
    jsonThrows = false,
  } = options;
  return {
    ok,
    status,
    json: vi.fn(async () => {
      if (jsonThrows) throw new Error("invalid json");
      return jsonBody;
    }),
  } as unknown as Response;
}

describe("PaymentBroker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    mockGetBackendType.mockReturnValue("docker");
    mockConfig.isEdgeGateway = false;
  });

  describe("createPaymentIntent", () => {
    it("throws when backend is not docker", async () => {
      mockGetBackendType.mockReturnValue("none");

      await expect(
        PaymentBroker.createPaymentIntent({
          orderId: "ord-1",
          amount: 1000,
          currency: "EUR",
          restaurantId: "r1",
        }),
      ).rejects.toThrow("Payment requires Docker Core");
    });

    it("throws when rpc returns error", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        rpc: vi.fn(async () => ({
          error: { message: "rpc-error" },
          data: null,
        })),
      });

      await expect(
        PaymentBroker.createPaymentIntent({
          orderId: "ord-1",
          amount: 1000,
          currency: "EUR",
          restaurantId: "r1",
        }),
      ).rejects.toThrow("rpc-error");
    });

    it("throws when rpc payload has error field", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        rpc: vi.fn(async () => ({
          error: null,
          data: { error: "stripe-fail" },
        })),
      });

      await expect(
        PaymentBroker.createPaymentIntent({
          orderId: "ord-1",
          amount: 1000,
          currency: "EUR",
          restaurantId: "r1",
        }),
      ).rejects.toThrow("stripe-fail");
    });

    it("throws when id/clientSecret are missing", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        rpc: vi.fn(async () => ({ error: null, data: { id: "pi_1" } })),
      });

      await expect(
        PaymentBroker.createPaymentIntent({
          orderId: "ord-1",
          amount: 1000,
          currency: "EUR",
          restaurantId: "r1",
        }),
      ).rejects.toThrow("Core não retornou id ou clientSecret");
    });

    it("returns payment intent data on success", async () => {
      mockGetDockerCoreFetchClient.mockReturnValue({
        rpc: vi.fn(async () => ({
          error: null,
          data: { id: "pi_123", clientSecret: "sec_123" },
        })),
      });

      await expect(
        PaymentBroker.createPaymentIntent({
          orderId: "ord-1",
          amount: 1000,
          currency: "EUR",
          restaurantId: "r1",
        }),
      ).resolves.toEqual({ id: "pi_123", clientSecret: "sec_123" });
    });
  });

  describe("pix checkout", () => {
    it("throws gateway message on createPixCheckout failure", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 500,
          jsonBody: { message: "pix fail" },
        }),
      );

      await expect(
        PaymentBroker.createPixCheckout({
          orderId: "ord-1",
          amount: 1000,
          restaurantId: "r1",
        }),
      ).rejects.toThrow("pix fail");
    });

    it("uses fallback message when createPixCheckout error body is not json", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: false, status: 502, jsonThrows: true }),
      );

      await expect(
        PaymentBroker.createPixCheckout({
          orderId: "ord-1",
          amount: 1000,
          restaurantId: "r1",
        }),
      ).rejects.toThrow("HTTP 502: Failed to create Pix checkout");
    });

    it("returns pix checkout payload", async () => {
      const payload = {
        provider: "sumup",
        payment_method: "PIX",
        country: "BR",
        checkout_id: "co_1",
        checkout_reference: "ref_1",
        status: "PENDING",
        amount: 10,
        currency: "BRL",
      };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: payload }),
      );

      await expect(
        PaymentBroker.createPixCheckout({
          orderId: "ord-1",
          amount: 1000,
          restaurantId: "r1",
        }),
      ).resolves.toEqual(payload);
    });

    it("uses provided pix description instead of fallback", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: { ok: true } }),
      );

      await PaymentBroker.createPixCheckout({
        orderId: "ord-1",
        amount: 1000,
        restaurantId: "r1",
        description: "Custom Pix Description",
      });

      const [, request] = vi.mocked(globalThis.fetch).mock.calls[0];
      const body = JSON.parse(String((request as RequestInit).body));
      expect(body.description).toBe("Custom Pix Description");
    });

    it("throws/gets pix checkout status with both branches", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 404,
          jsonBody: { message: "not found" },
        }),
      );
      await expect(PaymentBroker.getPixCheckoutStatus("co-x")).rejects.toThrow(
        "not found",
      );

      const payload = {
        provider: "sumup",
        checkout_id: "co_1",
        status: "PAID",
        amount: 10,
        currency: "BRL",
      };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: payload }),
      );
      await expect(PaymentBroker.getPixCheckoutStatus("co-1")).resolves.toEqual(
        payload,
      );
    });
  });

  describe("sumup checkout", () => {
    it("throws and succeeds for createSumUpCheckout", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 400,
          jsonBody: { message: "sumup fail" },
        }),
      );
      await expect(
        PaymentBroker.createSumUpCheckout({
          orderId: "ord-1",
          restaurantId: "r1",
          amount: 10,
          currency: "EUR",
        }),
      ).rejects.toThrow("sumup fail");

      const payload = {
        success: true,
        checkout: {
          id: "s1",
          url: "https://sumup",
          status: "PENDING",
          amount: 10,
          currency: "EUR",
          expiresAt: "2030-01-01T00:00:00Z",
          reference: "ref",
        },
      };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: payload }),
      );

      await expect(
        PaymentBroker.createSumUpCheckout({
          orderId: "ord-1",
          restaurantId: "r1",
          amount: 10,
          currency: "EUR",
        }),
      ).resolves.toEqual(payload);
    });

    it("uses provided sumup description instead of fallback", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: { success: true, checkout: {} } }),
      );

      await PaymentBroker.createSumUpCheckout({
        orderId: "ord-1",
        restaurantId: "r1",
        amount: 10,
        currency: "EUR",
        description: "Custom SumUp Description",
      });

      const [, request] = vi.mocked(globalThis.fetch).mock.calls[0];
      const body = JSON.parse(String((request as RequestInit).body));
      expect(body.description).toBe("Custom SumUp Description");
    });

    it("throws and succeeds for getSumUpCheckoutStatus", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: false, status: 503, jsonThrows: true }),
      );
      await expect(
        PaymentBroker.getSumUpCheckoutStatus("co-1"),
      ).rejects.toThrow("HTTP 503: Failed to get SumUp checkout status");

      const payload = {
        success: true,
        checkout: {
          id: "co-1",
          status: "PAID",
          amount: 10,
          currency: "EUR",
          reference: "ref",
        },
      };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockResponse({ ok: true, jsonBody: payload }),
      );

      await expect(
        PaymentBroker.getSumUpCheckoutStatus("co-1"),
      ).resolves.toEqual(payload);
    });

    it("uses edge gateway routes when enabled", async () => {
      mockConfig.isEdgeGateway = true;

      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            jsonBody: {
              provider: "sumup",
              payment_method: "PIX",
              country: "BR",
              checkout_id: "co_1",
              checkout_reference: "ref_1",
              status: "PENDING",
              amount: 10,
              currency: "BRL",
            },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            jsonBody: {
              provider: "sumup",
              checkout_id: "co_1",
              status: "PAID",
              amount: 10,
              currency: "BRL",
            },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            jsonBody: {
              success: true,
              checkout: {
                id: "s1",
                url: "https://sumup",
                status: "PENDING",
                amount: 10,
                currency: "EUR",
                expiresAt: "2030-01-01T00:00:00Z",
                reference: "ref",
              },
            },
          }),
        )
        .mockResolvedValueOnce(
          mockResponse({
            ok: true,
            jsonBody: {
              success: true,
              checkout: {
                id: "co-1",
                status: "PAID",
                amount: 10,
                currency: "EUR",
                reference: "ref",
              },
            },
          }),
        );

      await PaymentBroker.createPixCheckout({
        orderId: "ord-1",
        amount: 1000,
        restaurantId: "r1",
      });
      await PaymentBroker.getPixCheckoutStatus("co_1");
      await PaymentBroker.createSumUpCheckout({
        orderId: "ord-1",
        restaurantId: "r1",
        amount: 10,
        currency: "EUR",
      });
      await PaymentBroker.getSumUpCheckoutStatus("co_1");

      const urls = vi
        .mocked(globalThis.fetch)
        .mock.calls.map((call) => String(call[0]));
      expect(urls.some((url) => url.includes("payment-pix-checkout"))).toBe(
        true,
      );
      expect(urls.some((url) => url.includes("sumup-create-checkout"))).toBe(
        true,
      );
      expect(urls.some((url) => url.includes("sumup-get-checkout/co_1"))).toBe(
        true,
      );
    });
  });
});
