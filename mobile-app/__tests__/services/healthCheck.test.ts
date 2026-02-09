/**
 * HealthCheck Service — Unit tests
 *
 * Tests checkHealth, checkBackendHealth, isOnline.
 */
import {
  checkHealth,
  checkBackendHealth,
  isOnline,
} from "../../services/healthCheck";
import { supabase } from "../../services/supabase";

describe("HealthCheck Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkHealth", () => {
    it("returns online when both db and auth pass", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const result = await checkHealth();
      expect(result.status).toBe("online");
      expect(result.database).toBe("ok");
      expect(result.authentication).toBe("ok");
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeTruthy();
    });

    it("returns offline when db fails", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue({ data: null, error: { message: "down" } }),
        }),
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const result = await checkHealth();
      expect(result.status).toBe("offline");
      expect(result.database).toBe("error");
      expect(result.authentication).toBe("ok");
    });

    it("returns offline when auth fails", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: "auth down" },
      });
      const result = await checkHealth();
      expect(result.status).toBe("offline");
      expect(result.database).toBe("ok");
      expect(result.authentication).toBe("error");
    });

    it("handles thrown exceptions safely", async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error("crash");
      });
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error("crash"),
      );
      const result = await checkHealth();
      expect(result.status).toBe("offline");
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("checkBackendHealth", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns online when backend returns healthy", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "healthy",
            checks: { database: "ok", authentication: "ok" },
            responseTime: 42,
          }),
      }) as any;
      const result = await checkBackendHealth("https://example.com");
      expect(result.status).toBe("online");
      expect(result.database).toBe("ok");
    });

    it("returns offline on fetch error", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network")) as any;
      const result = await checkBackendHealth("https://example.com");
      expect(result.status).toBe("offline");
    });
  });

  describe("isOnline", () => {
    it("returns true when checkHealth status is online", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest
            .fn()
            .mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      });
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const result = await isOnline();
      expect(result).toBe(true);
    });

    it("returns false when checkHealth status is offline", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error("down")),
        }),
      });
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error("down"),
      );
      const result = await isOnline();
      expect(result).toBe(false);
    });
  });
});
