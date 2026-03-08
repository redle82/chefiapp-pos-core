/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import {
  buildCatalogSetupStorageKey,
  clearCatalogSetupDraft,
  getDefaultCatalogSetupDraft,
  loadCatalogSetupDraft,
  saveCatalogSetupDraft,
} from "./catalogSetupDraft";

describe("catalogSetupDraft", () => {
  const restaurantId = "rest-setup-test";

  it("loads default draft when storage is empty", () => {
    clearCatalogSetupDraft(restaurantId);

    const draft = loadCatalogSetupDraft(restaurantId);
    expect(draft.businessType).toBe("RESTAURANT");
    expect(draft.channels).toEqual(["LOCAL", "TAKEAWAY"]);
    expect(draft.brands.length).toBeGreaterThan(0);
  });

  it("saves and reloads normalized draft data", () => {
    clearCatalogSetupDraft(restaurantId);

    const initial = getDefaultCatalogSetupDraft();
    const saved = saveCatalogSetupDraft(restaurantId, {
      ...initial,
      country: "PT",
      currency: "EUR",
      brands: ["Sofia Gastrobar", "  ", "Ibiza Drinks"],
      channels: ["DELIVERY"],
    });

    expect(saved.brands).toEqual(["Sofia Gastrobar", "Ibiza Drinks"]);

    const loaded = loadCatalogSetupDraft(restaurantId);
    expect(loaded.country).toBe("PT");
    expect(loaded.channels).toEqual(["DELIVERY"]);
    expect(loaded.brands).toEqual(["Sofia Gastrobar", "Ibiza Drinks"]);
  });

  it("clears persisted draft", () => {
    const key = buildCatalogSetupStorageKey(restaurantId);
    const initial = getDefaultCatalogSetupDraft();

    saveCatalogSetupDraft(restaurantId, {
      ...initial,
      country: "BR",
    });
    expect(localStorage.getItem(key)).toBeTruthy();

    clearCatalogSetupDraft(restaurantId);
    expect(localStorage.getItem(key)).toBeNull();
  });
});
