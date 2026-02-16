import { buildAtQrUrl } from "../../../fiscal-modules/pt/atQrUrl";

describe("atQrUrl", () => {
  it("should build a valid AT QR URL with all params", () => {
    const url = buildAtQrUrl({
      nif: "123456789",
      atcud: "FT-2026-000001",
      documentDate: "2026-02-14",
      total: 123.45,
      hash: "abc123",
    });
    expect(url).toContain("portaldasfinancas.gov.pt/at/qa");
    expect(url).toContain("nif=123456789");
    expect(url).toContain("atcud=FT-2026-000001");
    expect(url).toContain("d=2026-02-14");
    expect(url).toContain("t=123.45");
    expect(url).toContain("h=abc123");
  });

  it("should omit hash param when not provided", () => {
    const url = buildAtQrUrl({
      nif: "123456789",
      atcud: "FT-2026-000001",
      documentDate: "2026-02-14",
      total: 50.0,
    });
    expect(url).not.toContain("h=");
  });

  it("should strip non-digit chars from NIF", () => {
    const url = buildAtQrUrl({
      nif: "123-456-789",
      atcud: "FT-2026-000001",
      documentDate: "2026-01-01",
      total: 10.0,
    });
    expect(url).toContain("nif=123456789");
  });

  it("should truncate NIF to 9 digits", () => {
    const url = buildAtQrUrl({
      nif: "1234567890",
      atcud: "FT-2026-000001",
      documentDate: "2026-01-01",
      total: 10.0,
    });
    expect(url).toContain("nif=123456789");
    expect(url).not.toContain("nif=1234567890");
  });

  it("should format total with 2 decimal places", () => {
    const url = buildAtQrUrl({
      nif: "123456789",
      atcud: "FT-2026-000001",
      documentDate: "2026-01-01",
      total: 100,
    });
    expect(url).toContain("t=100.00");
  });
});
