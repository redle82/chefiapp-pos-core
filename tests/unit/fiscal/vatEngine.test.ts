import {
  PT_VAT_RATES,
  computeVatFromGross,
  computeVatTotals,
} from "../../../fiscal-modules/pt/vat/vatEngine";

describe("vatEngine", () => {
  describe("PT_VAT_RATES", () => {
    it("should define correct Portuguese rates", () => {
      expect(PT_VAT_RATES.standard).toBe(0.23);
      expect(PT_VAT_RATES.intermediate).toBe(0.13);
      expect(PT_VAT_RATES.reduced).toBe(0.06);
      expect(PT_VAT_RATES.zero).toBe(0);
    });
  });

  describe("computeVatFromGross", () => {
    it("should extract 23% IVA from gross amount", () => {
      const result = computeVatFromGross(123.0, 0.23);
      expect(result.gross).toBe(123.0);
      expect(result.net).toBeCloseTo(100.0, 2);
      expect(result.vat).toBeCloseTo(23.0, 2);
      expect(result.rate).toBe(0.23);
    });

    it("should handle zero rate", () => {
      const result = computeVatFromGross(100.0, 0);
      expect(result.net).toBe(100.0);
      expect(result.vat).toBe(0);
    });

    it("should handle reduced rate (6%)", () => {
      const result = computeVatFromGross(10.6, 0.06);
      expect(result.net).toBeCloseTo(10.0, 2);
      expect(result.vat).toBeCloseTo(0.6, 2);
    });

    it("should throw on negative gross", () => {
      expect(() => computeVatFromGross(-1, 0.23)).toThrow("zero or greater");
    });

    it("should throw on negative rate", () => {
      expect(() => computeVatFromGross(100, -0.1)).toThrow("zero or greater");
    });

    it("should round to 2 decimal places", () => {
      const result = computeVatFromGross(99.99, 0.23);
      const decimals = result.vat.toString().split(".")[1]?.length ?? 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });

  describe("computeVatTotals", () => {
    it("should sum multiple items with different rates", () => {
      const result = computeVatTotals([
        { gross: 123.0, rate: 0.23 },
        { gross: 10.6, rate: 0.06 },
      ]);
      expect(result.grossTotal).toBeCloseTo(133.6, 2);
      expect(result.vatTotal).toBeCloseTo(23.6, 1);
    });

    it("should handle empty array", () => {
      const result = computeVatTotals([]);
      expect(result.grossTotal).toBe(0);
      expect(result.netTotal).toBe(0);
      expect(result.vatTotal).toBe(0);
    });
  });
});
