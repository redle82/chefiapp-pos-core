import { describe, expect, it } from "vitest";
import { listProducts } from "./catalogApi";

describe("catalogApi products integrity", () => {
  it("returns products with minimum required fields", async () => {
    const products = await listProducts();

    expect(products.length).toBeGreaterThan(0);
    expect(
      products.every(
        (product) =>
          product.id.length > 0 &&
          product.name.length > 0 &&
          typeof product.basePriceCents === "number",
      ),
    ).toBe(true);
  });
});
