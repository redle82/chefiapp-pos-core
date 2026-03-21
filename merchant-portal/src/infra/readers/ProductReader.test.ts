import { beforeEach, describe, expect, it, vi } from "vitest";

const readProductsMock = vi.fn();
const readMenuCategoriesMock = vi.fn();

vi.mock("./RestaurantReader", () => ({
  readProducts: (...args: unknown[]) => readProductsMock(...args),
  readMenuCategories: (...args: unknown[]) => readMenuCategoriesMock(...args),
}));

describe("ProductReader", () => {
  beforeEach(() => {
    vi.resetModules();
    readProductsMock.mockReset();
    readMenuCategoriesMock.mockReset();
  });

  it("maps category_name and gm_menu_categories when category exists", async () => {
    readProductsMock.mockResolvedValue([
      {
        id: "p1",
        restaurant_id: "r1",
        category_id: "c1",
        name: "Beer",
        price_cents: 300,
      },
    ]);
    readMenuCategoriesMock.mockResolvedValue([
      { id: "c1", restaurant_id: "r1", name: "Drinks", sort_order: 1 },
    ]);

    const { readProductsByRestaurant } = await import("./ProductReader");
    const out = await readProductsByRestaurant("r1");

    expect(out).toHaveLength(1);
    expect(out[0].category_name).toBe("Drinks");
    expect(out[0].gm_menu_categories?.id).toBe("c1");
  });

  it("sets category fields to null when category is missing or category_id is null", async () => {
    readProductsMock.mockResolvedValue([
      {
        id: "p1",
        restaurant_id: "r1",
        category_id: "missing",
        name: "Beer",
        price_cents: 300,
      },
      {
        id: "p2",
        restaurant_id: "r1",
        category_id: null,
        name: "Water",
        price_cents: 100,
      },
    ]);
    readMenuCategoriesMock.mockResolvedValue([
      { id: "c1", restaurant_id: "r1", name: "Drinks", sort_order: 1 },
    ]);

    const { readProductsByRestaurant } = await import("./ProductReader");
    const out = await readProductsByRestaurant("r1", true, true);

    expect(out[0].category_name).toBeNull();
    expect(out[0].gm_menu_categories).toBeNull();
    expect(out[1].category_name).toBeNull();
    expect(out[1].gm_menu_categories).toBeNull();
  });
});
