import { describe, expect, it } from "@jest/globals";
import {
  computeVatFromGross,
  computeVatTotals,
  PT_VAT_RATES,
} from "../../../fiscal-modules/pt/vat/vatEngine";

describe("PT VAT engine", () => {
  it("computes VAT from gross for standard rate", () => {
    const result = computeVatFromGross(12.3, PT_VAT_RATES.standard);

    expect(result.net).toBeCloseTo(10.0, 2);
    expect(result.vat).toBeCloseTo(2.3, 2);
    expect(result.gross).toBeCloseTo(12.3, 2);
  });

  it("computes VAT from gross for intermediate rate", () => {
    const result = computeVatFromGross(11.3, PT_VAT_RATES.intermediate);

    expect(result.net).toBeCloseTo(10.0, 2);
    expect(result.vat).toBeCloseTo(1.3, 2);
    expect(result.gross).toBeCloseTo(11.3, 2);
  });

  it("computes VAT from gross for reduced rate", () => {
    const result = computeVatFromGross(10.6, PT_VAT_RATES.reduced);

    expect(result.net).toBeCloseTo(10.0, 2);
    expect(result.vat).toBeCloseTo(0.6, 2);
    expect(result.gross).toBeCloseTo(10.6, 2);
  });

  it("computes VAT from gross for zero rate", () => {
    const result = computeVatFromGross(10.0, PT_VAT_RATES.zero);

    expect(result.net).toBeCloseTo(10.0, 2);
    expect(result.vat).toBeCloseTo(0.0, 2);
    expect(result.gross).toBeCloseTo(10.0, 2);
  });

  it("aggregates VAT totals across mixed rates", () => {
    const summary = computeVatTotals([
      { gross: 12.3, rate: PT_VAT_RATES.standard },
      { gross: 11.3, rate: PT_VAT_RATES.intermediate },
      { gross: 10.6, rate: PT_VAT_RATES.reduced },
      { gross: 10.0, rate: PT_VAT_RATES.zero },
    ]);

    expect(summary.grossTotal).toBeCloseTo(44.2, 2);
    expect(summary.netTotal).toBeCloseTo(40.0, 2);
    expect(summary.vatTotal).toBeCloseTo(4.2, 2);
  });
});
