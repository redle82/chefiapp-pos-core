import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../../merchant-portal/src/infra/docker-core/connection", () => {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };
  return {
    dockerCoreClient: { from: jest.fn(() => chain), __chain: chain },
  };
});

import { dockerCoreClient } from "../../../merchant-portal/src/infra/docker-core/connection";
import { readRestaurantPeople } from "../../../merchant-portal/src/infra/readers/RestaurantPeopleReader";

const chain = (dockerCoreClient as any).__chain;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RestaurantPeopleReader", () => {
  it("readRestaurantPeople devolve [] em erro", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: null,
      error: { message: "fail" },
    });

    const people = await readRestaurantPeople("r1");
    expect(people).toEqual([]);
  });

  it("readRestaurantPeople devolve apenas registos ativos", async () => {
    (chain.order as jest.Mock).mockReturnValueOnce({
      data: [
        {
          id: "u1",
          restaurant_id: "r1",
          user_id: "user-1",
          role: "waiter",
          active: true,
          deleted_at: null,
        },
        {
          id: "u2",
          restaurant_id: "r1",
          user_id: "user-2",
          role: "kitchen",
          active: false,
          deleted_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    });

    const people = await readRestaurantPeople("r1");

    expect(people).toHaveLength(2);
    expect(people[0].id).toBe("u1");
    expect(people[1].id).toBe("u2");
  });
});

