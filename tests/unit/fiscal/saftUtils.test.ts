import {
  formatSequence,
  buildInvoiceNumber,
  buildAtcud,
  computeHashChain,
} from "../../../fiscal-modules/pt/saft/saftUtils";

describe("saftUtils", () => {
  describe("formatSequence", () => {
    it("should pad sequence to default width of 6", () => {
      expect(formatSequence(1)).toBe("000001");
      expect(formatSequence(42)).toBe("000042");
      expect(formatSequence(999999)).toBe("999999");
    });

    it("should pad to custom width", () => {
      expect(formatSequence(1, 3)).toBe("001");
      expect(formatSequence(1, 10)).toBe("0000000001");
    });

    it("should throw on non-positive integer", () => {
      expect(() => formatSequence(0)).toThrow("positive integer");
      expect(() => formatSequence(-1)).toThrow("positive integer");
      expect(() => formatSequence(1.5)).toThrow("positive integer");
    });
  });

  describe("buildInvoiceNumber", () => {
    it("should format as SERIES-SEQUENCE", () => {
      expect(buildInvoiceNumber("FT-2026", 1)).toBe("FT-2026-000001");
      expect(buildInvoiceNumber("FT-2026", 123)).toBe("FT-2026-000123");
    });
  });

  describe("buildAtcud", () => {
    it("should format ATCUD same as invoice number", () => {
      expect(buildAtcud("FT-2026", 1)).toBe("FT-2026-000001");
      expect(buildAtcud("FT-2026", 42)).toBe("FT-2026-000042");
    });
  });

  describe("computeHashChain", () => {
    it("should produce a deterministic SHA-256 hex hash", () => {
      const hash = computeHashChain("GENESIS", "order-1|100.00");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should chain hashes — different prev produces different result", () => {
      const h1 = computeHashChain("GENESIS", "order-1|100.00");
      const h2 = computeHashChain(h1, "order-2|50.00");
      expect(h1).not.toBe(h2);
      expect(h2).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should be deterministic — same inputs produce same hash", () => {
      const a = computeHashChain("abc", "content");
      const b = computeHashChain("abc", "content");
      expect(a).toBe(b);
    });

    it("should treat empty/null prevHash as GENESIS", () => {
      const fromGenesis = computeHashChain("GENESIS", "data");
      const fromEmpty = computeHashChain("", "data");
      expect(fromEmpty).toBe(fromGenesis);
    });

    it("should maintain chain integrity over 5 sequential documents", () => {
      let prev = "GENESIS";
      const hashes: string[] = [];
      for (let i = 1; i <= 5; i++) {
        prev = computeHashChain(prev, `order-${i}|${i * 10}.00`);
        hashes.push(prev);
      }
      expect(new Set(hashes).size).toBe(5);
      hashes.forEach((h) => expect(h).toMatch(/^[a-f0-9]{64}$/));
    });
  });
});
