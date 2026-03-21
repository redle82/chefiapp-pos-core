import { describe, expect, it } from "vitest";
import {
  calculateChange,
  calculateGrandTotal,
  calculateTip,
  formatCentsToDecimal,
  parseToCents,
} from "./calculatePaymentTotals";

describe("calculatePaymentTotals", () => {
  it("uses custom tip when tipPercent is null", () => {
    expect(calculateTip(10_00, null, "5.50")).toBe(550);
  });

  it("returns 0 for invalid custom tip mapping", () => {
    expect(calculateTip(10_00, null, "abc")).toBe(0);
    expect(parseToCents("not-a-number")).toBe(0);
  });

  it("computes grand total and negative change branches", () => {
    expect(calculateGrandTotal(1_000, 200)).toBe(1_200);
    expect(calculateChange(500, 1_200)).toBe(-700);
  });

  it("formats cents with two decimals", () => {
    expect(formatCentsToDecimal(1234)).toBe("12.34");
  });
});
