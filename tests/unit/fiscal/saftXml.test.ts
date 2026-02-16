import { generateSaftInvoiceFragment, generateSaftXml } from "../../../fiscal-modules/pt/saft/saftXml";
import type { TaxDocument } from "../../../fiscal-modules/types";

function makeTaxDoc(overrides: Partial<TaxDocument> = {}): TaxDocument {
  return {
    doc_type: "SAF-T",
    ref_event_id: "evt-001",
    ref_seal_id: "seal-001",
    total_amount: 123.0,
    taxes: { vat: 23.01 },
    vatRate: 0.23,
    vatAmount: 2301,
    items: [
      { code: "PROD-1", description: "Picanha", quantity: 2, unit_price: 15.0, total: 30.0 },
      { code: "PROD-2", description: "Vinho Tinto", quantity: 1, unit_price: 93.0, total: 93.0 },
    ],
    raw_payload: {
      invoice_number: "FT-2026-000001",
      atcud: "FT-2026-000001",
      hash_chain: "abc123hash",
      issued_at: "2026-02-14T12:00:00Z",
      nif: "123456789",
    },
    ...overrides,
  };
}

describe("saftXml", () => {
  describe("generateSaftInvoiceFragment", () => {
    it("should produce XML with invoice number", () => {
      const xml = generateSaftInvoiceFragment(makeTaxDoc());
      expect(xml).toContain("FT-2026-000001");
    });

    it("should include all line items", () => {
      const xml = generateSaftInvoiceFragment(makeTaxDoc());
      expect(xml).toContain("Picanha");
      expect(xml).toContain("Vinho Tinto");
      expect(xml).toContain("<Quantity>2</Quantity>");
      expect(xml).toContain("<Quantity>1</Quantity>");
    });

    it("should include ATCUD when present", () => {
      const xml = generateSaftInvoiceFragment(makeTaxDoc());
      expect(xml).toContain("FT-2026-000001");
    });

    it("should include hash chain", () => {
      const xml = generateSaftInvoiceFragment(makeTaxDoc());
      expect(xml).toContain("abc123hash");
    });

    it("should escape XML special characters in descriptions", () => {
      const doc = makeTaxDoc({
        items: [{ code: "P1", description: "Pão & Manteiga <fresh>", quantity: 1, unit_price: 5.0, total: 5.0 }],
      });
      const xml = generateSaftInvoiceFragment(doc);
      expect(xml).toContain("&amp;");
      expect(xml).toContain("&lt;fresh&gt;");
      expect(xml).not.toContain("& ");
    });
  });

  describe("generateSaftXml", () => {
    it("should produce valid SAF-T XML with header", () => {
      const xml = generateSaftXml(makeTaxDoc());
      expect(xml).toContain("<?xml");
      expect(xml).toContain("AuditFile");
      expect(xml).toContain("1.04_01");
    });

    it("should include SourceDocuments section", () => {
      const xml = generateSaftXml(makeTaxDoc());
      expect(xml).toContain("<SourceDocuments>");
      expect(xml).toContain("<SalesInvoices>");
    });
  });
});
