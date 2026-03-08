import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../../merchant-portal/src/infra/docker-core/connection", () => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
  };
  return {
    dockerCoreClient: { from: jest.fn(() => chain), __chain: chain },
  };
});

import { dockerCoreClient } from "../../../merchant-portal/src/infra/docker-core/connection";
import type * as RestaurantReaderModule from "../../../merchant-portal/src/infra/readers/RestaurantReader";
import * as RestaurantReader from "../../../merchant-portal/src/infra/readers/RestaurantReader";

const chain = (dockerCoreClient as any).__chain;
const {
  readMenu,
  readMenuCategories,
  readProducts,
  readRestaurantById,
  readRestaurantBySlug,
  readTableByNumber,
} = RestaurantReader as typeof RestaurantReaderModule;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RestaurantReader", () => {
  it("readRestaurantBySlug devolve null em erro", async () => {
    chain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "fail" },
    });

    const restaurant = await readRestaurantBySlug("slug-x");
    expect(restaurant).toBeNull();
  });

  it("readRestaurantById devolve restaurante quando existe", async () => {
    chain.maybeSingle.mockResolvedValueOnce({
      data: { id: "r1", name: "Rest 1" },
      error: null,
    });

    const restaurant = await readRestaurantById("r1");
    expect(restaurant).toEqual({ id: "r1", name: "Rest 1" });
  });

  it("readMenuCategories devolve lista vazia em erro", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: null,
      error: { message: "boom" },
    });

    const cats = await readMenuCategories("r1");
    expect(cats).toEqual([]);
  });

  it("readProducts mapeia asset_image_url a partir de gm_product_assets", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: [
        {
          id: "p1",
          restaurant_id: "r1",
          name: "Prod 1",
          price_cents: 1000,
          gm_product_assets: { image_url: "https://img/p1.png" },
        },
      ],
      error: null,
    });

    const products = await readProducts("r1");
    expect(products[0]).toMatchObject({
      id: "p1",
      asset_image_url: "https://img/p1.png",
    });
  });

  it("readTableByNumber devolve null em erro", async () => {
    chain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "no table" },
    });

    const table = await readTableByNumber("r1", 10);
    expect(table).toBeNull();
  });

  it("readMenu combina categorias e produtos", async () => {
    // Primeira chamada: readMenuCategories → via order()
    (chain.order as jest.Mock)
      .mockReturnValueOnce({
        data: [{ id: "c1", restaurant_id: "r1", name: "Bebidas" }],
        error: null,
      })
      // Segunda chamada: readProducts → order()
      .mockReturnValueOnce({
        data: [
          {
            id: "p1",
            restaurant_id: "r1",
            category_id: "c1",
            name: "Água",
            price_cents: 200,
            gm_product_assets: null,
          },
        ],
        error: null,
      });

    const menu = await readMenu("r1");

    expect(menu.categories).toHaveLength(1);
    expect(menu.products).toHaveLength(1);
    expect(menu.products[0].category_id).toBe("c1");
  });
});

