/**
 * ConflictResolver — Unit tests (LWW + getVersion).
 * Fase 3 Sync/Offline: version conflict guard.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictResolver } from "./ConflictResolver";

const mockFrom = vi.fn();
const mockGetTableClient = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  getTableClient: () => mockGetTableClient(),
}));

vi.mock("../logger", () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function chainMock(result: { data: unknown; error: unknown }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve(result),
        }),
      }),
    }),
  };
}

describe("ConflictResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("shouldApplyUpdate", () => {
    it("returns true when record does not exist remotely", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({ data: null, error: null })
      );

      const result = await ConflictResolver.shouldApplyUpdate(
        "gm_orders",
        "ord-1",
        2000
      );

      expect(result).toBe(true);
    });

    it("returns true when local timestamp >= remote updated_at (LWW apply)", async () => {
      const remoteTime = new Date("2026-02-01T12:00:00.000Z").getTime();
      mockGetTableClient.mockResolvedValue(
        chainMock({
          data: { updated_at: "2026-02-01T12:00:00.000Z", version: 1 },
          error: null,
        })
      );

      const result = await ConflictResolver.shouldApplyUpdate(
        "gm_orders",
        "ord-1",
        remoteTime
      );

      expect(result).toBe(true);
    });

    it("returns true when local timestamp > remote (newer)", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({
          data: { updated_at: "2026-02-01T10:00:00.000Z", version: 1 },
          error: null,
        })
      );

      const result = await ConflictResolver.shouldApplyUpdate(
        "gm_orders",
        "ord-1",
        new Date("2026-02-01T12:00:00.000Z").getTime()
      );

      expect(result).toBe(true);
    });

    it("returns false when local timestamp < remote (stale)", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({
          data: { updated_at: "2026-02-01T14:00:00.000Z", version: 2 },
          error: null,
        })
      );

      const result = await ConflictResolver.shouldApplyUpdate(
        "gm_orders",
        "ord-1",
        new Date("2026-02-01T12:00:00.000Z").getTime()
      );

      expect(result).toBe(false);
    });

    it("returns true when query returns error (fail-safe)", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({ data: null, error: { message: "permission denied" } })
      );

      const result = await ConflictResolver.shouldApplyUpdate(
        "gm_orders",
        "ord-1",
        1000
      );

      expect(result).toBe(true);
    });

    it("returns true when getTableClient throws", async () => {
      mockGetTableClient.mockRejectedValue(new Error("network"));

      const result = await ConflictResolver.shouldApplyUpdate(
        "gm_orders",
        "ord-1",
        1000
      );

      expect(result).toBe(true);
    });
  });

  describe("getVersion", () => {
    it("returns version when record exists", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({ data: { version: 3 }, error: null })
      );

      const version = await ConflictResolver.getVersion("gm_orders", "ord-1");

      expect(version).toBe(3);
    });

    it("returns null when record does not exist", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({ data: null, error: null })
      );

      const version = await ConflictResolver.getVersion("gm_orders", "ord-1");

      expect(version).toBe(null);
    });

    it("returns null when query returns error", async () => {
      mockGetTableClient.mockResolvedValue(
        chainMock({ data: null, error: { message: "timeout" } })
      );

      const version = await ConflictResolver.getVersion("gm_orders", "ord-1");

      expect(version).toBe(null);
    });

    it("returns null when getTableClient throws", async () => {
      mockGetTableClient.mockRejectedValue(new Error("network"));

      const version = await ConflictResolver.getVersion("gm_orders", "ord-1");

      expect(version).toBe(null);
    });
  });
});
