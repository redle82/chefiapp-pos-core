/**
 * Unit tests: Churn Worker
 *
 * Tests runChurnWorker with mocked Supabase client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { runChurnWorker } from "../../../docker-core/server/workers/churnWorker";

describe("churnWorker", () => {
  it("scans due retries and executes each", async () => {
    const rpc = jest.fn(async (fn: string) => {
      if (fn === "churn_scan_due_retries")
        return {
          data: [
            { id: "a1", restaurant_id: "r1", attempt_count: 1, next_retry_at: "2026-02-25T00:00:00Z" },
            { id: "a2", restaurant_id: "r2", attempt_count: 2, next_retry_at: "2026-02-25T00:00:00Z" },
          ],
          error: null,
        };
      if (fn === "churn_execute_retry")
        return { data: [{ success: true, message: "ok" }], error: null };
      return { data: [], error: null };
    });
    const client = { rpc } as unknown as SupabaseClient;
    const result = await runChurnWorker(client);
    expect(result.scanned).toBe(2);
    expect(result.executed).toBe(2);
    expect(result.errors).toEqual([]);
  });

  it("counts failures in errors array", async () => {
    const rpcImpl = jest.fn(async (fn: string, _params?: Record<string, unknown>) => {
      if (fn === "churn_scan_due_retries")
        return {
          data: [{ id: "a1", restaurant_id: "r1", attempt_count: 1, next_retry_at: "2026-02-25T00:00:00Z" }],
          error: null,
        };
      if (fn === "churn_execute_retry")
        return { data: null, error: { message: "Simulated error" } };
      return { data: [], error: null };
    });
    const client = { rpc: rpcImpl } as unknown as SupabaseClient;
    const result = await runChurnWorker(client);
    expect(result.scanned).toBe(1);
    expect(result.executed).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain("r1");
    expect(result.errors[0]).toContain("Simulated error");
  });

  it("returns zero scanned when no due retries", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient;
    const result = await runChurnWorker(client);
    expect(result.scanned).toBe(0);
    expect(result.executed).toBe(0);
  });
});
