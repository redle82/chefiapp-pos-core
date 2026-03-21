/**
 * Unit tests for Payment Provider Router
 * - provider selection by country/method
 * - currency resolution
 * - error normalization
 */

import {
  resolveProvider,
  resolveCurrencyByCountry,
  normalizeProviderEvent,
} from "../../../docker-core/server/payments/providerRouter";

describe("providerRouter", () => {
  describe("resolveProvider", () => {
    it("returns stripe for US card", () => {
      expect(resolveProvider({ country: "US", method: "card" })).toBe("stripe");
      expect(resolveProvider({ country: "US", method: "card", mode: "online" })).toBe("stripe");
    });

    it("returns stripe for GB card", () => {
      expect(resolveProvider({ country: "GB", method: "card" })).toBe("stripe");
    });

    it("returns sumup for ES card", () => {
      expect(resolveProvider({ country: "ES", method: "card" })).toBe("sumup");
    });

    it("returns pix for BR pix", () => {
      expect(resolveProvider({ country: "BR", method: "pix" })).toBe("pix");
    });

    it("returns sumup for BR card pos, stripe for online", () => {
      expect(resolveProvider({ country: "BR", method: "card", mode: "pos" })).toBe("sumup");
      expect(resolveProvider({ country: "BR", method: "card", mode: "online" })).toBe("stripe");
    });

    it("returns pix for cash (manual)", () => {
      expect(resolveProvider({ country: "BR", method: "cash" })).toBe("pix");
    });
  });

  describe("resolveCurrencyByCountry", () => {
    it("returns BRL for BR", () => {
      expect(resolveCurrencyByCountry("BR")).toBe("BRL");
    });
    it("returns USD for US", () => {
      expect(resolveCurrencyByCountry("US")).toBe("USD");
    });
    it("returns GBP for GB", () => {
      expect(resolveCurrencyByCountry("GB")).toBe("GBP");
    });
    it("returns EUR for ES", () => {
      expect(resolveCurrencyByCountry("ES")).toBe("EUR");
    });
  });

  describe("normalizeProviderEvent", () => {
    it("normalizes Stripe payment_intent.succeeded to PaymentReceipt", () => {
      const event = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_xxx",
            amount: 1000,
            currency: "usd",
          },
        },
      };
      const result = normalizeProviderEvent("stripe", event);
      expect("code" in result).toBe(false);
      const receipt = result as { provider: string; provider_ref: string; amount: number; currency: string };
      expect(receipt.provider).toBe("stripe");
      expect(receipt.provider_ref).toBe("pi_xxx");
      expect(receipt.amount).toBe(1000);
      expect(receipt.currency).toBe("USD");
    });

    it("normalizes Stripe payment_intent.payment_failed to PaymentError", () => {
      const event = {
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_yyy",
            last_payment_error: { message: "Card declined" },
          },
        },
      };
      const result = normalizeProviderEvent("stripe", event);
      expect("code" in result).toBe(true);
      expect("retryable" in result).toBe(true);
      if ("code" in result) {
        expect(result.code).toBe("payment_failed");
        expect(result.message).toBe("Card declined");
        expect(result.retryable).toBe(true);
      }
    });

    it("normalizes SumUp paid event to PaymentReceipt", () => {
      const event = {
        status: "PAID",
        paymentId: "tx_123",
        checkout_reference: "ord_1",
        amount: 15.5,
        currency: "eur",
      };
      const result = normalizeProviderEvent("sumup", event);
      expect("code" in result).toBe(false);
      const receipt = result as { provider: string; provider_ref: string; amount: number };
      expect(receipt.provider).toBe("sumup");
      expect(receipt.provider_ref).toBe("tx_123");
      expect(receipt.amount).toBe(1550); // 15.5 * 100
    });

    it("normalizes Pix paid event to PaymentReceipt", () => {
      const event = {
        status: "paid",
        transaction_id: "e2e_abc",
        intent_id: "pix_1",
        amount: 25.0,
      };
      const result = normalizeProviderEvent("pix", event);
      expect("code" in result).toBe(false);
      const receipt = result as { provider: string; provider_ref: string; amount: number; currency: string };
      expect(receipt.provider).toBe("pix");
      expect(receipt.provider_ref).toBe("e2e_abc");
      expect(receipt.amount).toBe(2500);
      expect(receipt.currency).toBe("BRL");
    });
  });
});
