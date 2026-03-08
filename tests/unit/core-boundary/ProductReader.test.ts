import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../../merchant-portal/src/infra/readers/RestaurantReader", () => {
  return {
    readProducts: jest.fn(),
    readMenuCategories: jest.fn(),
  };
});

import {
  readMenuCategories,
  readProducts,
} from "../../../merchant-portal/src/infra/readers/RestaurantReader";
import {
  readProductsByRestaurant,
  type CoreProductWithCategory,
} from "../../../merchant-portal/src/infra/readers/ProductReader";

const readProductsMock = readProducts as unknown as jest.Mock<any>;
const readMenuCategoriesMock =
  readMenuCategories as unknown as jest.Mock<any>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ProductReader.readProductsByRestaurant", () => {
  it("devolve produtos com category_name e gm_menu_categories preenchidos", async () => {
    readProductsMock.mockResolvedValueOnce([
      {
        id: "p1",
        restaurant_id: "r1",
        category_id: "c1",
        name: "Hambúrguer",
        price_cents: 1000,
      } as CoreProductWithCategory,
    ]);

    readMenuCategoriesMock.mockResolvedValueOnce([
      {
        id: "c1",
        restaurant_id: "r1",
        name: "Pratos",
      },
    ] as any[]);

    const products = await readProductsByRestaurant("r1");

    expect(products).toHaveLength(1);
    expect(products[0].category_name).toBe("Pratos");
    expect(products[0].gm_menu_categories).toMatchObject({
      id: "c1",
      name: "Pratos",
    });
  });

  it("devolve category_name null quando categoria não existe", async () => {
    readProductsMock.mockResolvedValueOnce([
      {
        id: "p1",
        restaurant_id: "r1",
        category_id: "missing",
        name: "Sem categoria",
        price_cents: 500,
      } as CoreProductWithCategory,
    ]);

    readMenuCategoriesMock.mockResolvedValueOnce([] as any[]);

    const products = await readProductsByRestaurant("r1");

    expect(products[0].category_name).toBeNull();
    expect(products[0].gm_menu_categories).toBeNull();
  });
});

