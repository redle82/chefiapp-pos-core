// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateShiftReceiptHtml } from "./ShiftReceiptGenerator";

describe("generateShiftReceiptHtml", () => {
  it("includes legal footer when provided", () => {
    const html = generateShiftReceiptHtml({
      restaurantName: "Chef Test",
      terminalId: "TPV-1",
      operatorName: "Operator",
      openedAt: new Date("2025-01-01T10:00:00Z"),
      closedAt: new Date("2025-01-01T12:00:00Z"),
      openingBalanceCents: 1000,
      closingBalanceCents: 2000,
      dailySalesCents: 1500,
      expectedBalanceCents: 2500,
      differenceCents: -500,
      legalFooter: "NIF 123456789",
    });

    expect(html).toContain("NIF 123456789");
  });
});
