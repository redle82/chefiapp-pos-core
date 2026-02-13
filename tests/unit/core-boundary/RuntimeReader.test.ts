import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../../merchant-portal/src/infra/docker-core/connection", () => {
  const chain: Record<string, jest.Mock<any>> = {
    select: jest.fn<any>().mockReturnThis(),
    eq: jest.fn<any>().mockReturnThis(),
    maybeSingle: jest.fn<any>(),
    limit: jest.fn<any>().mockReturnThis(),
    order: jest.fn<any>().mockReturnThis(),
    upsert: jest.fn<any>().mockReturnThis(),
    update: jest.fn<any>().mockReturnThis(),
    then: jest.fn<any>((cb: any) => cb({ data: null, error: null })),
  };
  return {
    dockerCoreClient: { from: jest.fn<any>(() => chain), __chain: chain },
  };
});

jest.mock("../../../merchant-portal/src/core/logger", () => ({
  Logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock(
  "../../../merchant-portal/src/core/storage/TabIsolatedStorage",
  () => ({
    setTabIsolated: jest.fn(),
    removeTabIsolated: jest.fn(),
    getTabIsolated: jest.fn(),
  }),
);

jest.mock("../../../merchant-portal/src/core/kernel/RuntimeContext", () => ({
  assertValidRestaurantId: jest.fn(),
}));

import { dockerCoreClient } from "../../../merchant-portal/src/infra/docker-core/connection";
import {
  fetchFirstRestaurantId,
  fetchInstalledModules,
  fetchSetupStatus,
  restaurantExistsInCore,
} from "../../../merchant-portal/src/infra/readers/RuntimeReader";

const chain = (dockerCoreClient as any).__chain;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RuntimeReader", () => {
  describe("restaurantExistsInCore", () => {
    it("should return true when restaurant exists", async () => {
      chain.maybeSingle.mockResolvedValueOnce({
        data: { id: "r-1" },
        error: null,
      });
      const result = await restaurantExistsInCore("r-1");
      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      chain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "fail" },
      });
      const result = await restaurantExistsInCore("r-1");
      expect(result).toBe(false);
    });
  });

  describe("fetchFirstRestaurantId", () => {
    it("should return first restaurant id", async () => {
      const mockData = [{ id: "first-id" }];
      chain.order.mockReturnValueOnce({ data: mockData, error: null });
      const result = await fetchFirstRestaurantId();
      expect(result).toBe("first-id");
    });
  });

  describe("fetchInstalledModules", () => {
    it("should return module ids", async () => {
      chain.eq.mockReturnValueOnce(chain).mockReturnValueOnce({
        data: [{ module_id: "tpv" }, { module_id: "kds" }],
        error: null,
      });
      const result = await fetchInstalledModules("r-1");
      expect(result).toEqual(["tpv", "kds"]);
    });

    it("should return empty array on error", async () => {
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce({ data: null, error: { message: "fail" } });
      const result = await fetchInstalledModules("r-1");
      expect(result).toEqual([]);
    });
  });

  describe("fetchSetupStatus", () => {
    it("should return sections map", async () => {
      const sections = { menu: true, staff: false };
      chain.maybeSingle.mockResolvedValueOnce({
        data: { restaurant_id: "r-1", sections },
        error: null,
      });
      const result = await fetchSetupStatus("r-1");
      expect(result).toEqual(sections);
    });

    it("should return empty object on error", async () => {
      chain.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "fail" },
      });
      const result = await fetchSetupStatus("r-1");
      expect(result).toEqual({});
    });
  });
});
