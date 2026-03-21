import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
vi.mock("../docker-core/connection", () => ({
  dockerCoreClient: {
    from: (table: string) => fromMock(table),
  },
}));

type Result<T> = { data: T | null; error: unknown };

function createChain<T>(result: Result<T>) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    maybeSingle: () => Promise.resolve(result),
  };
  chain.then = (fn: (r: Result<T>) => any) => Promise.resolve(result).then(fn);
  return chain;
}

describe("RestaurantReader", () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
  });

  it("readRestaurantBySlug returns null on error", async () => {
    fromMock.mockReturnValue(
      createChain({ data: null, error: { message: "fail" } }),
    );

    const { readRestaurantBySlug } = await import("./RestaurantReader");
    const out = await readRestaurantBySlug("slug-1");

    expect(out).toBeNull();
    expect(fromMock).toHaveBeenCalledWith("gm_restaurants");
  });

  it("readRestaurantById returns row on success", async () => {
    fromMock.mockReturnValue(
      createChain({
        data: { id: "r1", name: "Restaurant 1", slug: "rest-1" },
        error: null,
      }),
    );

    const { readRestaurantById } = await import("./RestaurantReader");
    const out = await readRestaurantById("r1");

    expect(out).toEqual({ id: "r1", name: "Restaurant 1", slug: "rest-1" });
  });

  it("readMenuCategories returns [] on error and data on success", async () => {
    fromMock
      .mockReturnValueOnce(createChain({ data: null, error: { message: "x" } }))
      .mockReturnValueOnce(
        createChain({
          data: [
            { id: "c1", restaurant_id: "r1", name: "Drinks", sort_order: 1 },
            { id: "c2", restaurant_id: "r1", name: "Food", sort_order: 2 },
          ],
          error: null,
        }),
      );

    const { readMenuCategories } = await import("./RestaurantReader");

    const fail = await readMenuCategories("r1");
    const ok = await readMenuCategories("r1");

    expect(fail).toEqual([]);
    expect(ok).toHaveLength(2);
  });

  it("readProducts returns [] on error and maps asset_image_url on success", async () => {
    fromMock
      .mockReturnValueOnce(createChain({ data: null, error: { message: "x" } }))
      .mockReturnValueOnce(
        createChain({
          data: [
            {
              id: "p1",
              restaurant_id: "r1",
              category_id: "c1",
              name: "Beer",
              price_cents: 300,
              gm_product_assets: { image_url: "https://img/beer.png" },
            },
            {
              id: "p2",
              restaurant_id: "r1",
              category_id: null,
              name: "Water",
              price_cents: 100,
              gm_product_assets: null,
            },
          ],
          error: null,
        }),
      );

    const { readProducts } = await import("./RestaurantReader");

    const fail = await readProducts("r1");
    const ok = await readProducts("r1");

    expect(fail).toEqual([]);
    expect(ok[0].asset_image_url).toBe("https://img/beer.png");
    expect(ok[1].asset_image_url).toBeNull();
  });

  it("readTableByNumber returns null on missing table", async () => {
    fromMock.mockReturnValue(createChain({ data: null, error: null }));

    const { readTableByNumber } = await import("./RestaurantReader");
    const out = await readTableByNumber("r1", 7);

    expect(out).toBeNull();
    expect(fromMock).toHaveBeenCalledWith("gm_tables");
  });

  it("readMenu aggregates categories and products", async () => {
    fromMock
      .mockReturnValueOnce(
        createChain({
          data: [
            { id: "c1", restaurant_id: "r1", name: "Drinks", sort_order: 1 },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createChain({
          data: [
            {
              id: "p1",
              restaurant_id: "r1",
              category_id: "c1",
              name: "Beer",
              price_cents: 300,
              gm_product_assets: { image_url: "https://img/beer.png" },
            },
          ],
          error: null,
        }),
      );

    const { readMenu } = await import("./RestaurantReader");
    const out = await readMenu("r1");

    expect(out.categories).toHaveLength(1);
    expect(out.products).toHaveLength(1);
    expect(out.products[0].asset_image_url).toBe("https://img/beer.png");
  });
});
