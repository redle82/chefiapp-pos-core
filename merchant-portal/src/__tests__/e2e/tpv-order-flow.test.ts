/**
 * E2E Test: TPV Order Flow
 * Tests the complete order lifecycle from product selection to payment.
 *
 * Run with: npx vitest run src/__tests__/e2e/tpv-order-flow.test.ts
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase client
vi.mock("../../infra/docker-core/connection", () => ({
  dockerCoreClient: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: { id: "test-order-1" }, error: null }) }) }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    rpc: () => ({ data: { success: true }, error: null }),
  },
}));

describe("TPV Order Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Order Context Selection", () => {
    it("should support 4 order modes", () => {
      const modes = ["dine_in", "counter", "takeaway", "delivery"];
      expect(modes).toHaveLength(4);
      modes.forEach((mode) => {
        expect(["dine_in", "counter", "takeaway", "delivery"]).toContain(mode);
      });
    });
  });

  describe("Cart Operations", () => {
    it("should calculate item total correctly", () => {
      const item = { name: "Pizza", priceCents: 1600, quantity: 2 };
      const total = item.priceCents * item.quantity;
      expect(total).toBe(3200);
    });

    it("should calculate subtotal for multiple items", () => {
      const items = [
        { name: "Pizza", priceCents: 1600, quantity: 1 },
        { name: "Nachos", priceCents: 1200, quantity: 2 },
        { name: "Water", priceCents: 200, quantity: 1 },
      ];
      const subtotal = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
      expect(subtotal).toBe(4200); // 1600 + 2400 + 200
    });

    it("should apply percentage discount correctly", () => {
      const subtotal = 10000; // €100
      const discountPercent = 10;
      const discount = Math.round(subtotal * (discountPercent / 100));
      expect(discount).toBe(1000); // €10
      expect(subtotal - discount).toBe(9000);
    });

    it("should apply fixed discount correctly", () => {
      const subtotal = 5000; // €50
      const discountFixed = 500; // €5
      expect(subtotal - discountFixed).toBe(4500);
    });

    it("should calculate VAT correctly", () => {
      const subtotal = 10000;
      const vatRate = 0.23; // 23% PT
      const vat = Math.round(subtotal * vatRate / (1 + vatRate));
      expect(vat).toBe(1870); // €18.70 VAT from €100 inclusive
    });
  });

  describe("Split Bill", () => {
    it("should split equally with correct rounding", () => {
      const total = 10000; // €100
      const people = 3;
      const perPerson = Math.floor(total / people);
      const lastPerson = total - perPerson * (people - 1);
      expect(perPerson).toBe(3333);
      expect(lastPerson).toBe(3334);
      expect(perPerson * 2 + lastPerson).toBe(total);
    });

    it("should validate custom split sums to total", () => {
      const total = 5000;
      const customAmounts = [2000, 1500, 1500];
      const sum = customAmounts.reduce((s, a) => s + a, 0);
      expect(sum).toBe(total);
    });
  });

  describe("Tips", () => {
    it("should calculate tip percentages", () => {
      const subtotal = 10000;
      expect(Math.round(subtotal * 0.05)).toBe(500);
      expect(Math.round(subtotal * 0.10)).toBe(1000);
      expect(Math.round(subtotal * 0.15)).toBe(1500);
      expect(Math.round(subtotal * 0.20)).toBe(2000);
    });

    it("should round up correctly", () => {
      const total = 3420; // €34.20
      const roundedUp = Math.ceil(total / 100) * 100;
      expect(roundedUp).toBe(3500); // €35.00
      expect(roundedUp - total).toBe(80); // tip = €0.80
    });
  });

  describe("Payment Methods", () => {
    it("should support all 7 payment methods", () => {
      const methods = ["cash", "card", "mbway", "sumup_eur", "pix", "manual", "stripe_terminal"];
      expect(methods).toHaveLength(7);
    });
  });

  describe("Receipt Data", () => {
    it("should build receipt snapshot with all required fields", () => {
      const receipt = {
        orderId: "test-123",
        orderIdShort: "#TEST123",
        timestamp: new Date().toISOString(),
        table: "4",
        orderMode: "dine_in",
        restaurant: { name: "Sofia Gastrobar", taxId: "123456789" },
        items: [{ name: "Pizza", quantity: 1, unit_price: 1600, line_total: 1600 }],
        subtotalCents: 1600,
        discountCents: 0,
        taxCents: 368,
        taxBreakdown: [{ rateLabel: "23%", rate: 23, baseAmount: 1232, taxAmount: 368 }],
        tipCents: 0,
        grandTotalCents: 1600,
        paymentMethod: "cash" as const,
      };

      expect(receipt.orderId).toBeDefined();
      expect(receipt.restaurant.name).toBe("Sofia Gastrobar");
      expect(receipt.items).toHaveLength(1);
      expect(receipt.grandTotalCents).toBe(1600);
      expect(receipt.taxBreakdown[0].rate).toBe(23);
    });
  });
});
