/**
 * Payment registry — getAvailableProviders, getProvider, isMethodAvailable, getRegionFromCurrency.
 */
import { describe, expect, it } from "vitest";
import {
  getAvailableMethods,
  getAvailableProviders,
  getProvider,
  getRegionFromCurrency,
  isMethodAvailable,
} from "./registry";

describe("payments/registry", () => {
  it("getRegionFromCurrency returns BR for BRL", () => {
    expect(getRegionFromCurrency("BRL")).toBe("BR");
  });

  it("getRegionFromCurrency returns EU for EUR", () => {
    expect(getRegionFromCurrency("EUR")).toBe("EU");
  });

  it("getRegionFromCurrency returns US for USD", () => {
    expect(getRegionFromCurrency("USD")).toBe("US");
  });

  it("getRegionFromCurrency returns DEFAULT for unknown currency", () => {
    expect(getRegionFromCurrency("")).toBe("DEFAULT");
    expect(getRegionFromCurrency("CHF")).toBe("DEFAULT");
  });

  it("getRegionFromCurrency returns GB for GBP", () => {
    expect(getRegionFromCurrency("GBP")).toBe("GB");
  });

  it("getRegionFromCurrency returns MX for MXN", () => {
    expect(getRegionFromCurrency("MXN")).toBe("MX");
  });

  it("getRegionFromCurrency returns CA for CAD", () => {
    expect(getRegionFromCurrency("CAD")).toBe("CA");
  });

  it("getRegionFromCurrency returns AU for AUD", () => {
    expect(getRegionFromCurrency("AUD")).toBe("AU");
  });

  it("getProvider returns provider for known method", () => {
    const cash = getProvider("cash");
    expect(cash).toBeDefined();
    expect(cash?.id).toBe("cash");
  });

  it("getProvider returns undefined for unknown method", () => {
    expect(getProvider("unknown" as any)).toBeUndefined();
  });

  it("getAvailableProviders returns array filtered by region and availability", () => {
    const providers = getAvailableProviders("BR");
    expect(Array.isArray(providers)).toBe(true);
    providers.forEach((p) => {
      expect(p.isAvailable()).toBe(true);
      expect(p.supportedRegions).toContain("BR");
    });
  });

  it("getAvailableMethods returns method ids for region", () => {
    const methods = getAvailableMethods("EU");
    expect(Array.isArray(methods)).toBe(true);
  });

  it("isMethodAvailable returns false for unknown method", () => {
    expect(isMethodAvailable("unknown" as any, "BR")).toBe(false);
  });

  it("isMethodAvailable returns boolean for known method", () => {
    const cash = isMethodAvailable("cash", "DEFAULT");
    expect(typeof cash).toBe("boolean");
    expect(cash).toBe(true);
  });
});
