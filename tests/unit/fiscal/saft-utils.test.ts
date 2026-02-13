import { describe, expect, it } from "@jest/globals";
import {
  buildAtcud,
  buildInvoiceNumber,
  computeHashChain,
  formatSequence,
} from "../../../fiscal-modules/pt/saft/saftUtils";
import { generateSaftXml } from "../../../fiscal-modules/pt/saft/saftXml";
import type { TaxDocument } from "../../../fiscal-modules/types";

describe("SAF-T PT utils", () => {
  it("formats sequence with zero padding", () => {
    expect(formatSequence(1)).toBe("000001");
    expect(formatSequence(42)).toBe("000042");
    expect(formatSequence(123456)).toBe("123456");
  });

  it("builds invoice number and ATCUD from series + sequence", () => {
    expect(buildInvoiceNumber("FT-2026", 7)).toBe("FT-2026-000007");
    expect(buildAtcud("FT-2026", 7)).toBe("FT-2026-000007");
  });

  it("computes deterministic hash chain values", () => {
    const first = computeHashChain("", "payload");
    const second = computeHashChain("", "payload");
    const different = computeHashChain("", "payload-2");

    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first).toHaveLength(64);
  });
});

describe("SAF-T PT XML", () => {
  it("includes ATCUD, invoice number, and hash chain when provided", () => {
    const taxDoc: TaxDocument = {
      doc_type: "SAF-T",
      ref_event_id: "EVENT-PT-001",
      ref_seal_id: "SEAL-PT-001",
      total_amount: 12.3,
      taxes: { vat: 2.3 },
      items: [
        {
          code: "PROD-001",
          description: "Cafe",
          quantity: 1,
          unit_price: 12.3,
          total: 12.3,
        },
      ],
      raw_payload: {
        restaurant_id: "rest-pt-1",
        tax_registration_number: "123456789",
        restaurant_name: "Restaurante Teste",
        address: "Rua A",
        city: "Lisboa",
        postal_code: "1000-000",
        invoice_series: "FT-2026",
        invoice_sequence: 1,
        invoice_number: "FT-2026-000001",
        atcud: "FT-2026-000001",
        hash_chain: "abc123",
        issued_at: "2026-02-13T10:00:00.000Z",
      },
    };

    const xml = generateSaftXml(taxDoc);

    expect(xml).toContain("<InvoiceNo>FT-2026-000001</InvoiceNo>");
    expect(xml).toContain("<ATCUD>FT-2026-000001</ATCUD>");
    expect(xml).toContain("<Hash>abc123</Hash>");
  });
});
