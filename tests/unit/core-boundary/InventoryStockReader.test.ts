import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const fromMock = jest.fn();
const rpcMock: jest.Mock = jest.fn();

jest.mock(
  "../../../merchant-portal/src/infra/docker-core/connection",
  () => ({
    dockerCoreClient: {
      from: (table: string) => fromMock(table),
      rpc: (fn: string, params?: any) => rpcMock(fn, params),
    },
  }),
);

type Result<T> = { data: T | null; error: any };

function chainFor<T>(result: Result<T>) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
  };
  chain.then = (fn: (r: Result<T>) => any) => Promise.resolve(result).then(fn);
  return chain;
}

// TODO: enable when InventoryStockReader contract is stabilized for Jest tests.
describe.skip("InventoryStockReader (Core DB → merchant-portal)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("readLocations devolve [] em erro", async () => {
    fromMock.mockReturnValueOnce(
      chainFor({ data: null, error: { message: "fail" } }),
    );
    const { readLocations } = await import(
      "../../../merchant-portal/src/infra/readers/InventoryStockReader"
    );

    const rows = await readLocations("r1");
    expect(rows).toEqual([]);
  });

  it("readLocations devolve linhas quando sem erro", async () => {
    const rows = [{ id: "loc1", restaurant_id: "r1", name: "Câmara" }];
    fromMock.mockReturnValueOnce(chainFor({ data: rows, error: null }));
    const { readLocations } = await import(
      "../../../merchant-portal/src/infra/readers/InventoryStockReader"
    );

    const out = await readLocations("r1");
    expect(fromMock).toHaveBeenCalledWith("gm_locations");
    expect(out).toEqual(rows);
  });

  it("readStockAlerts filtra alertas por qty <= min_qty e enriquece nomes", async () => {
    // 1) gm_stock_levels
    const stockRows = [
      {
        id: "s1",
        restaurant_id: "r1",
        location_id: "loc1",
        ingredient_id: "ing1",
        qty: 5,
        min_qty: 10,
      },
      {
        id: "s2",
        restaurant_id: "r1",
        location_id: "loc2",
        ingredient_id: "ing2",
        qty: 20,
        min_qty: 10,
      },
    ];
    fromMock
      // call 1: gm_stock_levels
      .mockReturnValueOnce(
        chainFor({ data: stockRows, error: null }) as any,
      )
      // call 2: gm_ingredients
      .mockReturnValueOnce(
        chainFor({
          data: [
            { id: "ing1", name: "Tomate" },
            { id: "ing2", name: "Cebola" },
          ],
          error: null,
        }) as any,
      )
      // call 3: gm_locations
      .mockReturnValueOnce(
        chainFor({
          data: [
            { id: "loc1", name: "Câmara Fria" },
            { id: "loc2", name: "Despensa" },
          ],
          error: null,
        }) as any,
      );

    const { readStockAlerts } = await import(
      "../../../merchant-portal/src/infra/readers/InventoryStockReader"
    );

    const alerts = await readStockAlerts("r1");

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      ingredient_id: "ing1",
      ingredient_name: "Tomate",
      location_id: "loc1",
      location_name: "Câmara Fria",
    });
  });

  it("lookupIngredientByBarcode devolve found:false em caso de erro no RPC", async () => {
    (rpcMock as any).mockResolvedValueOnce({
      data: null,
      error: { message: "rpc error" },
    });
    const { lookupIngredientByBarcode } = await import(
      "../../../merchant-portal/src/infra/readers/InventoryStockReader"
    );

    const res = await lookupIngredientByBarcode("r1", "123");
    expect(res).toEqual({ found: false });
  });

  it("lookupIngredientByBarcode devolve resultado do RPC quando existe", async () => {
    (rpcMock as any).mockResolvedValueOnce({
      data: { found: true, ingredient_id: "ing1", name: "Tomate" },
      error: null,
    });
    const { lookupIngredientByBarcode } = await import(
      "../../../merchant-portal/src/infra/readers/InventoryStockReader"
    );

    const res = await lookupIngredientByBarcode("r1", "123");
    expect(res.found).toBe(true);
    expect(res.ingredient_id).toBe("ing1");
  });
});

