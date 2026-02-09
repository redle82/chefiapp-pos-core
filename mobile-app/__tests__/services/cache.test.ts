/**
 * Cache Service — Unit tests
 *
 * Tests cache get/set, TTL expiry, invalidation patterns, withCache wrapper.
 */
import {
  getCache,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  clearAllCache,
  withCache,
  CacheKeys,
} from "../../services/cache";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@chefiapp:cache:";

describe("Cache Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setCache + getCache", () => {
    it("stores and retrieves a value", async () => {
      await setCache("test-key", { hello: "world" });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${CACHE_PREFIX}test-key`,
        expect.stringContaining('"hello":"world"'),
      );
    });

    it("returns null for missing keys", async () => {
      const result = await getCache("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null for expired cache", async () => {
      // Simulate expired entry
      const expiredEntry = JSON.stringify({
        data: { v: 1 },
        timestamp: Date.now() - 999_999_999,
        ttl: 1000, // 1 second TTL
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(expiredEntry);
      const result = await getCache("expired");
      expect(result).toBeNull();
      // Should also remove expired entry
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        `${CACHE_PREFIX}expired`,
      );
    });

    it("returns data when not expired", async () => {
      const validEntry = JSON.stringify({
        data: { v: 42 },
        timestamp: Date.now(),
        ttl: 60_000, // 1 minute
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(validEntry);
      const result = await getCache<{ v: number }>("fresh");
      expect(result).toEqual({ v: 42 });
    });
  });

  describe("invalidateCache", () => {
    it("removes the key", async () => {
      await invalidateCache("menu:r1");
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        `${CACHE_PREFIX}menu:r1`,
      );
    });
  });

  describe("invalidateCachePattern", () => {
    it("removes matching keys", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        `${CACHE_PREFIX}menu:r1`,
        `${CACHE_PREFIX}menu:r2`,
        `${CACHE_PREFIX}user:u1`,
      ]);
      await invalidateCachePattern("menu:");
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        `${CACHE_PREFIX}menu:r1`,
        `${CACHE_PREFIX}menu:r2`,
      ]);
    });
  });

  describe("clearAllCache", () => {
    it("removes all cache-prefixed keys", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        `${CACHE_PREFIX}a`,
        `${CACHE_PREFIX}b`,
        "@other_key",
      ]);
      await clearAllCache();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        `${CACHE_PREFIX}a`,
        `${CACHE_PREFIX}b`,
      ]);
    });
  });

  describe("withCache", () => {
    it("returns cached value on hit", async () => {
      const entry = JSON.stringify({
        data: "cached!",
        timestamp: Date.now(),
        ttl: 60_000,
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(entry);
      const fn = jest.fn();
      const result = await withCache("key", fn);
      expect(result).toBe("cached!");
      expect(fn).not.toHaveBeenCalled();
    });

    it("calls function and caches on miss", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const fn = jest.fn(() => Promise.resolve("fresh"));
      const result = await withCache("key", fn);
      expect(result).toBe("fresh");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("CacheKeys helpers", () => {
    it("generates correct key patterns", () => {
      expect(CacheKeys.menu("r1")).toBe("menu:r1");
      expect(CacheKeys.categories("r2")).toBe("categories:r2");
      expect(CacheKeys.products("r3")).toBe("products:r3");
      expect(CacheKeys.restaurant("r4")).toBe("restaurant:r4");
      expect(CacheKeys.userRoles("u1")).toBe("user:roles:u1");
      expect(CacheKeys.userRestaurants("u2")).toBe("user:restaurants:u2");
    });
  });
});
