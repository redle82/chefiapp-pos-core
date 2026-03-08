import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../../merchant-portal/src/infra/docker-core/connection", () => {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };
  return {
    dockerCoreClient: { from: jest.fn(() => chain), __chain: chain },
  };
});

import { dockerCoreClient } from "../../../merchant-portal/src/infra/docker-core/connection";
import {
  readTables,
  readZones,
} from "../../../merchant-portal/src/infra/readers/MapReader";

const chain = (dockerCoreClient as any).__chain;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MapReader", () => {
  it("readTables devolve [] em erro", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: null,
      error: { message: "fail" },
    });

    const tables = await readTables("r1");
    expect(tables).toEqual([]);
  });

  it("readTables devolve filas quando não há erro", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: [
        { id: "t1", restaurant_id: "r1", number: 1 },
        { id: "t2", restaurant_id: "r1", number: 2 },
      ],
      error: null,
    });

    const tables = await readTables("r1");
    expect(tables).toHaveLength(2);
    expect(tables[0].number).toBe(1);
  });

  it("readZones transforma gm_locations em CoreRestaurantZone", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: [
        {
          id: "loc1",
          restaurant_id: "r1",
          name: "Bar",
          kind: "BAR",
        },
      ],
      error: null,
    });

    const zones = await readZones("r1");

    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({
      id: "loc1",
      restaurant_id: "r1",
      name: "Bar",
      code: "BAR",
      kind: "BAR",
    });
  });
});

