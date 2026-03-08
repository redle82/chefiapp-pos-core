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
  fetchRestaurant,
  fetchRestaurantForIdentity,
  fetchSetupStatus,
  restaurantExistsInCore,
} from "../../../merchant-portal/src/infra/readers/RuntimeReader";

const chain = (dockerCoreClient as any).__chain;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    configurable: true,
  });
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

  describe("logo_url backwards compatibility", () => {
    it("retries fetchRestaurant without logo_url when column does not exist", async () => {
      chain.maybeSingle
        .mockResolvedValueOnce({
          data: null,
          error: { message: "column gm_restaurants.logo_url does not exist" },
        })
        .mockResolvedValueOnce({
          data: {
            id: "r-runtime-1",
            name: "Runtime R1",
            slug: "runtime-r1",
            status: "active",
            tenant_id: null,
          },
          error: null,
        });

      const row = await fetchRestaurant("r-runtime-1");

      expect(row).toBeTruthy();
      expect(row?.id).toBe("r-runtime-1");
      expect((row as any)?.logo_url ?? null).toBeNull();
      expect(chain.maybeSingle).toHaveBeenCalledTimes(2);
      expect(chain.select).toHaveBeenNthCalledWith(
        2,
        "id,name,slug,status,tenant_id,product_mode,billing_status,trial_ends_at,country,timezone,currency,locale,type,created_at,updated_at",
      );
    });

    it("retries fetchRestaurantForIdentity without logo_url when column does not exist", async () => {
      chain.maybeSingle
        .mockResolvedValueOnce({
          data: null,
          error: { message: "column gm_restaurants.logo_url does not exist" },
        })
        .mockResolvedValueOnce({
          data: {
            id: "r-runtime-2",
            name: "Runtime R2",
            slug: "runtime-r2",
            status: "active",
            tenant_id: null,
            type: "Restaurante",
            city: "Lisboa",
            address: null,
            description: null,
          },
          error: null,
        });

      const row = await fetchRestaurantForIdentity("r-runtime-2");

      expect(row).toBeTruthy();
      expect(row?.id).toBe("r-runtime-2");
      expect((row as any)?.logo_url ?? null).toBeNull();
      expect(chain.maybeSingle).toHaveBeenCalledTimes(2);
      expect(chain.select).toHaveBeenNthCalledWith(
        2,
        "id,name,slug,status,tenant_id,type,city,address,description,country,timezone,currency,locale,created_at,updated_at",
      );
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
