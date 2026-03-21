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
  };
  chain.then = (fn: (r: Result<T>) => any) => Promise.resolve(result).then(fn);
  return chain;
}

describe("MapReader", () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
  });

  it("readTables returns [] on error", async () => {
    fromMock.mockReturnValue(
      createChain({ data: null, error: { message: "boom" } }),
    );

    const { readTables } = await import("./MapReader");
    const out = await readTables("r1");

    expect(out).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith("gm_tables");
  });

  it("readTables returns [] when data is null without error", async () => {
    fromMock.mockReturnValue(createChain({ data: null, error: null }));

    const { readTables } = await import("./MapReader");
    const out = await readTables("r1");

    expect(out).toEqual([]);
  });

  it("readZones maps kind into code/kind and handles missing kind", async () => {
    fromMock.mockReturnValue(
      createChain({
        data: [
          { id: "z1", restaurant_id: "r1", name: "Kitchen", kind: "KITCHEN" },
          { id: "z2", restaurant_id: "r1", name: "Unknown" },
        ],
        error: null,
      }),
    );

    const { readZones } = await import("./MapReader");
    const out = await readZones("r1");

    expect(out).toEqual([
      {
        id: "z1",
        restaurant_id: "r1",
        name: "Kitchen",
        code: "KITCHEN",
        kind: "KITCHEN",
      },
      {
        id: "z2",
        restaurant_id: "r1",
        name: "Unknown",
        code: undefined,
        kind: undefined,
      },
    ]);
    expect(fromMock).toHaveBeenCalledWith("gm_locations");
  });

  it("readZones returns [] on query error", async () => {
    fromMock.mockReturnValue(
      createChain({ data: null, error: { message: "fail" } }),
    );

    const { readZones } = await import("./MapReader");
    const out = await readZones("r1");

    expect(out).toEqual([]);
  });
});
