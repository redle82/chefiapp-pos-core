import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("../docker-core/connection", () => ({
  dockerCoreClient: {
    from: (table: string) => fromMock(table),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

type QueryResult<T> = { data: T | null; error: unknown };

function createQueryChain<T>(result: QueryResult<T>) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    filter: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    single: () => Promise.resolve(result),
  };
  chain.then = (fn: (r: QueryResult<T>) => unknown) =>
    Promise.resolve(result).then(fn);
  return chain;
}

describe("InventoryStockReader", () => {
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    rpcMock.mockReset();
    consoleErrorSpy.mockClear();
  });

  it("covers read helpers with success and error fallbacks", async () => {
    fromMock
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "locations fail" } }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: [
            {
              id: "loc-1",
              restaurant_id: "r1",
              name: "Kitchen",
              kind: "KITCHEN",
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "equipment fail" } }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: [
            {
              id: "ei-1",
              restaurant_id: "r1",
              equipment_id: "eq-1",
              ingredient_id: "ing-1",
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "stock fail" } }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: [{ id: "bom-1" }], error: null }),
      );

    const {
      readLocations,
      readEquipment,
      readEquipmentIngredients,
      readStockLevels,
      readProductBOM,
    } = await import("./InventoryStockReader");

    expect(await readLocations("r1")).toEqual([]);
    expect(await readLocations("r1")).toEqual([
      { id: "loc-1", restaurant_id: "r1", name: "Kitchen", kind: "KITCHEN" },
    ]);
    expect(await readEquipment("r1")).toEqual([]);
    expect(await readEquipmentIngredients("r1")).toEqual([
      {
        id: "ei-1",
        restaurant_id: "r1",
        equipment_id: "eq-1",
        ingredient_id: "ing-1",
      },
    ]);
    expect(await readStockLevels("r1")).toEqual([]);
    expect(await readProductBOM("r1")).toEqual([{ id: "bom-1" }]);
  });

  it("covers equipment and mapping CRUD branches", async () => {
    fromMock
      .mockReturnValueOnce(
        createQueryChain({
          data: {
            id: "eq-1",
            restaurant_id: "r1",
            name: "Oven",
            kind: "OVEN",
            is_active: true,
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "create fail" } }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: {
            id: "eq-1",
            restaurant_id: "r1",
            name: "Oven 2",
            kind: "OVEN",
            is_active: true,
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "update fail" } }),
      )
      .mockReturnValueOnce(createQueryChain({ data: null, error: null }))
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "delete fail" } }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: {
            id: "map-1",
            restaurant_id: "r1",
            equipment_id: "eq-1",
            ingredient_id: "ing-1",
            notes: "cold",
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "map fail" } }),
      )
      .mockReturnValueOnce(createQueryChain({ data: null, error: null }))
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "unmap fail" } }),
      );

    const {
      createEquipment,
      updateEquipment,
      deleteEquipment,
      addIngredientToEquipment,
      removeIngredientFromEquipment,
    } = await import("./InventoryStockReader");

    expect(
      await createEquipment({
        restaurant_id: "r1",
        name: "Oven",
        kind: "OVEN",
      }),
    ).toMatchObject({ id: "eq-1" });
    expect(
      await createEquipment({
        restaurant_id: "r1",
        name: "Oven",
        kind: "OVEN",
      }),
    ).toBeNull();

    expect(await updateEquipment("eq-1", { name: "Oven 2" })).toMatchObject({
      id: "eq-1",
    });
    expect(await updateEquipment("eq-1", { name: "Oven 3" })).toBeNull();

    expect(await deleteEquipment("eq-1")).toBe(true);
    expect(await deleteEquipment("eq-1")).toBe(false);

    expect(
      await addIngredientToEquipment("r1", "eq-1", "ing-1", "cold"),
    ).toMatchObject({
      id: "map-1",
    });
    expect(
      await addIngredientToEquipment("r1", "eq-1", "ing-1", "cold"),
    ).toBeNull();

    expect(await removeIngredientFromEquipment("map-1")).toBe(true);
    expect(await removeIngredientFromEquipment("map-1")).toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("covers RPC helpers and stock alerts mapping", async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: {
          found: true,
          ingredient_id: "ing-1",
          name: "Tomato",
          unit: "kg",
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "barcode fail" } })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "associate fail" },
      })
      .mockResolvedValueOnce({
        data: [{ pack: "kitchen", count: 10 }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: "packs fail" } })
      .mockResolvedValueOnce({
        data: { imported: 8, skipped: 2, total_in_pack: 10 },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: "import fail" } });

    fromMock
      .mockReturnValueOnce(
        createQueryChain({
          data: [
            {
              id: "sl-1",
              restaurant_id: "r1",
              location_id: "loc-1",
              ingredient_id: "ing-1",
              qty: 3,
              min_qty: 5,
              updated_at: "2026-01-01T00:00:00Z",
            },
            {
              id: "sl-2",
              restaurant_id: "r1",
              location_id: "loc-2",
              ingredient_id: "ing-2",
              qty: 8,
              min_qty: 5,
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: [
            { id: "ing-1", restaurant_id: "r1", name: "Tomato", unit: "kg" },
            { id: "ing-2", restaurant_id: "r1", name: "Cheese", unit: "kg" },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({
          data: [
            {
              id: "loc-1",
              restaurant_id: "r1",
              name: "Cold Room",
              kind: "STORAGE",
            },
            {
              id: "loc-2",
              restaurant_id: "r1",
              name: "Dry Storage",
              kind: "STORAGE",
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryChain({ data: null, error: { message: "alerts fail" } }),
      );

    const {
      lookupIngredientByBarcode,
      associateBarcode,
      listIngredientPacks,
      importIngredientPack,
      readStockAlerts,
    } = await import("./InventoryStockReader");

    expect(await lookupIngredientByBarcode("r1", "123")).toMatchObject({
      found: true,
      ingredient_id: "ing-1",
    });
    expect(await lookupIngredientByBarcode("r1", "123")).toEqual({
      found: false,
    });
    expect(await lookupIngredientByBarcode("r1", "123")).toEqual({
      found: false,
    });

    expect(await associateBarcode("ing-1", "123")).toBe(true);
    expect(await associateBarcode("ing-1", "123")).toBe(false);

    expect(await listIngredientPacks()).toEqual([
      { pack: "kitchen", count: 10 },
    ]);
    expect(await listIngredientPacks()).toEqual([]);

    expect(await importIngredientPack("r1", "kitchen")).toEqual({
      imported: 8,
      skipped: 2,
      total_in_pack: 10,
    });
    expect(await importIngredientPack("r1", "kitchen")).toBeNull();

    expect(await readStockAlerts("r1")).toEqual([
      expect.objectContaining({
        id: "sl-1",
        ingredient_name: "Tomato",
        location_name: "Cold Room",
      }),
    ]);

    expect(await readStockAlerts("r1")).toEqual([]);
  });
});
