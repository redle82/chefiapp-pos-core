import { describe, it, expect } from "vitest";
import type { TaxDocument } from "../../../../fiscal-modules/types";
import { buildFiscalReceiptHtml } from "./FiscalPrinter";

describe("buildFiscalReceiptHtml", () => {
  it("renders legal footer when provided", () => {
    const taxDoc = {
      doc_type: "MOCK",
      taxes: { vat: 23 },
      total_amount: 100,
      items: [
        { description: "Cafe", quantity: 1, unit_price: 1.0, total: 1.0 },
      ],
      raw_payload: {},
    } as TaxDocument;

    const html = buildFiscalReceiptHtml(taxDoc, {
      restaurant_name: "Cafe",
      payment_method: "cash",
      legal_footer: "Empresa XYZ - NIF 999999999",
    });

    expect(html).toContain("Empresa XYZ - NIF 999999999");
  });
});
