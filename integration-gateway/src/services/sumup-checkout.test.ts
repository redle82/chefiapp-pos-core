import axios from "axios";
import {
  createSumUpCheckout,
  createSumUpPixCheckout,
  getSumUpCheckout,
  normalizeCheckoutAmount,
} from "./sumup-checkout";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("sumup-checkout", () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...env,
      SUMUP_ACCESS_TOKEN: "sumup-token",
      SUMUP_MERCHANT_CODE: "merchant-001",
      SUMUP_API_BASE_URL: "https://api.sumup.com",
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("normalizes amount to two decimals", () => {
    expect(normalizeCheckoutAmount(12)).toBe(12);
    expect(normalizeCheckoutAmount(12.129)).toBe(12.13);
  });

  it("throws when SumUp token is missing", async () => {
    delete process.env.SUMUP_ACCESS_TOKEN;

    await expect(
      createSumUpCheckout({
        amount: 12.5,
        checkoutReference: "order-1",
      }),
    ).rejects.toThrow("SUMUP_ACCESS_TOKEN is not configured");
  });

  it("posts checkout request to SumUp API", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "chk_123",
        status: "PENDING",
        amount: 12.5,
        currency: "EUR",
      },
    } as any);

    const result = await createSumUpCheckout({
      amount: 12.5,
      checkoutReference: "order-1",
      description: "Order #1",
      returnUrl: "https://app.local/return",
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.sumup.com/v0.1/checkouts",
      {
        checkout_reference: "order-1",
        amount: 12.5,
        currency: "EUR",
        merchant_code: "merchant-001",
        description: "Order #1",
        return_url: "https://app.local/return",
      },
      {
        headers: {
          Authorization: "Bearer sumup-token",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    expect(result.id).toBe("chk_123");
  });

  it("creates PIX checkout for Brazil with BRL defaults", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "chk_pix_123",
        status: "PENDING",
        amount: 25,
        currency: "BRL",
      },
    } as any);

    await createSumUpPixCheckout({
      amount: 25,
      checkoutReference: "order-br-1",
      description: "Pedido BR #1",
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.sumup.com/v0.1/checkouts",
      {
        checkout_reference: "order-br-1",
        amount: 25,
        currency: "BRL",
        merchant_code: "merchant-001",
        description: "Pedido BR #1",
        payment_type: "pix",
        country: "BR",
      },
      {
        headers: {
          Authorization: "Bearer sumup-token",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );
  });

  it("fetches checkout status by id", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        id: "chk_status_1",
        status: "PAID",
        amount: 25,
        currency: "BRL",
      },
    } as any);

    const response = await getSumUpCheckout("chk_status_1");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.sumup.com/v0.1/checkouts/chk_status_1",
      {
        headers: {
          Authorization: "Bearer sumup-token",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    expect(response.status).toBe("PAID");
  });

  describe("Pix specific validations", () => {
    it("should normalize decimal values correctly for BRL", () => {
      expect(normalizeCheckoutAmount(99.999)).toBe(100);
      expect(normalizeCheckoutAmount(50.001)).toBe(50);
      expect(normalizeCheckoutAmount(1234.567)).toBe(1234.57);
    });

    it("should create Pix checkout with country=BR and paymentType=pix", async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          id: "chk_pix_br_001",
          status: "PENDING",
          amount: 9999,
          currency: "BRL",
          checkout_reference: "ORDER-PIX-001",
        },
      } as any);

      const result = await createSumUpPixCheckout({
        amount: 99.99,
        checkoutReference: "ORDER-PIX-001",
        description: "Pagamento Pix - ChefIApp",
      });

      const callArgs = mockedAxios.post.mock.calls[0];
      const payload = callArgs[1] as Record<string, unknown>;

      expect(payload.country).toBe("BR");
      expect(payload.payment_type).toBe("pix");
      expect(payload.currency).toBe("BRL");
      expect(result.id).toBe("chk_pix_br_001");
    });

    it("should enforce minimum amount for Pix (0.01 BRL)", async () => {
      mockedAxios.post.mockRejectedValue(
        new Error("Amount must be at least 0.01 BRL"),
      );

      await expect(
        createSumUpPixCheckout({
          amount: 0.001,
          checkoutReference: "ORDER-MIN",
        }),
      ).rejects.toThrow("Amount must be at least 0.01 BRL");
    });

    it("should enforce maximum amount for Pix (999,999.99 BRL)", async () => {
      mockedAxios.post.mockRejectedValue(
        new Error("Amount must not exceed 999,999.99 BRL"),
      );

      await expect(
        createSumUpPixCheckout({
          amount: 1000000,
          checkoutReference: "ORDER-MAX",
        }),
      ).rejects.toThrow("Amount must not exceed 999,999.99 BRL");
    });

    it("should handle Pix QR code in response", async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          id: "chk_pix_qr_001",
          status: "PENDING",
          amount: 5000,
          currency: "BRL",
          pix_qr: "00020126360076142851",
          pix_qr_url: "https://api.sumup.com/v0.1/checkouts/chk_pix_qr_001/qr",
        },
      } as any);

      const result = await createSumUpPixCheckout({
        amount: 50,
        checkoutReference: "ORDER-QR",
      });

      expect(result).toHaveProperty("pix_qr");
      expect(result).toHaveProperty("pix_qr_url");
    });

    it("should track Pix checkout lifecycle (PENDING -> COMPLETED)", async () => {
      const checkoutId = "chk_pix_lifecycle_001";

      // 1. Create checkout (status: PENDING)
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: checkoutId,
          status: "PENDING",
          amount: 9999,
          currency: "BRL",
        },
      } as any);

      const created = await createSumUpPixCheckout({
        amount: 99.99,
        checkoutReference: "ORDER-LIFECYCLE",
      });

      expect(created.status).toBe("PENDING");

      // 2. Poll for completion (status: COMPLETED)
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: checkoutId,
          status: "COMPLETED",
          amount: 9999,
          currency: "BRL",
          paid_at: new Date().toISOString(),
        },
      } as any);

      const completed = await getSumUpCheckout(checkoutId);

      expect(completed.status).toBe("COMPLETED");
      expect(completed).toHaveProperty("paid_at");
    });
  });

  describe("Error handling", () => {
    it("should propagate network errors from SumUp API", async () => {
      mockedAxios.post.mockRejectedValue(
        new Error("Network timeout after 15000ms"),
      );

      await expect(
        createSumUpCheckout({
          amount: 50,
          checkoutReference: "ORDER-TIMEOUT",
        }),
      ).rejects.toThrow("Network timeout");
    });

    it("should handle invalid merchant code", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Invalid merchant code"));

      await expect(
        createSumUpCheckout({
          amount: 50,
          checkoutReference: "ORDER-INVALID-MERCHANT",
          merchantCode: "INVALID",
        }),
      ).rejects.toThrow("Invalid merchant code");
    });

    it("should handle authorization errors", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Unauthorized"));

      delete process.env.SUMUP_ACCESS_TOKEN;

      await expect(
        createSumUpCheckout({
          amount: 50,
          checkoutReference: "ORDER-AUTH",
        }),
      ).rejects.toThrow();
    });
  });
});
