import { describe, expect, it } from "vitest";
import { normalizeMenuCache } from "./MenuCache";

describe("normalizeMenuCache", () => {
  it("returns { categories, products } as-is when already normalized", () => {
    const snapshot = {
      categories: [{ id: "c1", name: "Bebidas" }],
      products: [{ id: "p1", name: "Café", category_id: "c1", price_cents: 150 }],
    };
    expect(normalizeMenuCache(snapshot)).toEqual(snapshot);
  });

  it("converts legacy fullCatalog to { categories, products }", () => {
    const snapshot = {
      fullCatalog: [
        { id: "c1", name: "Bebidas", products: [{ id: "p1", name: "Café", price_cents: 150 }] },
        { id: "c2", name: "Comida", products: [] },
      ],
    };
    const out = normalizeMenuCache(snapshot);
    expect(out.categories).toEqual([{ id: "c1", name: "Bebidas" }, { id: "c2", name: "Comida" }]);
    expect(out.products).toHaveLength(1);
    expect(out.products[0]).toMatchObject({ id: "p1", name: "Café", category_id: "c1" });
  });

  it("returns empty arrays for null or invalid input", () => {
    expect(normalizeMenuCache(null)).toEqual({ categories: [], products: [] });
    expect(normalizeMenuCache(undefined)).toEqual({ categories: [], products: [] });
    expect(normalizeMenuCache({})).toEqual({ categories: [], products: [] });
  });
});
