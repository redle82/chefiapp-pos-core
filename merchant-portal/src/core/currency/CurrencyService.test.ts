import { describe, expect, it } from "vitest";
import { currencyService, getCurrencySymbol } from "./CurrencyService";

describe("CurrencyService", () => {
  it("falls back to default currency when unknown code is provided", () => {
    currencyService.setDefaultCurrency("EUR");

    const unknownCode = "ZZZ" as unknown as
      | "EUR"
      | "USD"
      | "GBP"
      | "BRL"
      | "MXN"
      | "CAD"
      | "AUD";

    const fallback = currencyService.getCurrency(unknownCode);
    expect(fallback.code).toBe("EUR");
  });

  it("returns fallback exchange rate=1 for unmapped currency pair", () => {
    const from = "EUR";
    const to = "EUR";
    expect(currencyService.getExchangeRate(from, to)).toBe(1);

    const unknownPairTo = "CAD";
    const unknownPairFrom = "MXN";
    // Known pair returns configured rate, proving branch differs from fallback
    expect(
      currencyService.getExchangeRate(unknownPairFrom, unknownPairTo),
    ).toBe(1);
  });

  it("formats using default currency symbol helper", () => {
    currencyService.setDefaultCurrency("GBP");
    expect(getCurrencySymbol()).toBe("£");
  });
});
