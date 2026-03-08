import { describe, expect, it } from "vitest";
import { listCategories, listProducts } from "./catalogApi";

describe("catalogApi menu entities", () => {
  it("returns seeded categories and products in mock mode", async () => {
    const categories = await listCategories();
    const products = await listProducts();

    expect(categories.length).toBeGreaterThan(0);
    expect(products.length).toBeGreaterThan(0);

    expect(categories.some((item) => item.name.length > 0)).toBe(true);
    expect(products.some((item) => item.name.length > 0)).toBe(true);

    const firstProduct = products[0];
    expect((firstProduct?.basePriceCents ?? 0) >= 0).toBe(true);
  });
});
