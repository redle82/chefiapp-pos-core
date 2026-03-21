/**
 * ReconciliationEngine — enqueue error, runOnce error paths
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReconciliationEngine } from "./ReconciliationEngine";

const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
}));
const mockGetTableClient = vi.fn().mockResolvedValue({
  from: mockFrom,
});
const mockInvokeRpc = vi.fn();

vi.mock("../infra/coreRpc", () => ({
  getTableClient: () => mockGetTableClient(),
  invokeRpc: (fn: string, params: object) => mockInvokeRpc(fn, params),
}));

vi.mock("../logger", () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("ReconciliationEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("enqueue", () => {
    it("throws when client.insert returns error", async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: "Database constraint violation", code: "23505" },
      });

      await expect(
        ReconciliationEngine.enqueue(
          "rest-1",
          "cash_register",
          "cr-1",
          "Test reason",
          "NORMAL",
          {},
        ),
      ).rejects.toThrow("CRITICAL_CONSTITUTIONAL_BREACH");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_id: "rest-1",
          entity_type: "cash_register",
          entity_id: "cr-1",
          reason: "Test reason",
          status: "PENDING",
        }),
      );
    });

    it("resolves when insert succeeds", async () => {
      mockInsert.mockResolvedValue({ data: { id: "job-1" }, error: null });

      await expect(
        ReconciliationEngine.enqueue(
          "rest-1",
          "cash_register",
          "cr-1",
          "Hybrid Write",
          "NORMAL",
          { op: "INSERT" },
        ),
      ).resolves.toBeUndefined();
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("runOnce", () => {
    it("returns zero stats when invokeRpc returns error", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC failed", code: "PGRST116" },
      });

      const result = await ReconciliationEngine.runOnce(25);

      expect(result).toEqual({ processed: 0, resolved: 0, failed: 0 });
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "dequeue_reconciliation_jobs",
        { p_limit: 25 },
      );
    });

    it("returns zero stats when jobs is empty array", async () => {
      mockInvokeRpc.mockResolvedValue({ data: [], error: null });

      const result = await ReconciliationEngine.runOnce(10);

      expect(result).toEqual({ processed: 0, resolved: 0, failed: 0 });
    });

    it("returns zero stats when jobs is null/undefined", async () => {
      mockInvokeRpc.mockResolvedValue({ data: null, error: null });

      const result = await ReconciliationEngine.runOnce(10);

      expect(result).toEqual({ processed: 0, resolved: 0, failed: 0 });
    });
  });
});
