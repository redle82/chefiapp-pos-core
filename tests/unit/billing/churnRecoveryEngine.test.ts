/**
 * Unit tests: Churn Recovery Engine
 *
 * Covers: detectFailedPayment, scheduleRetry, executeRetry, markRecovered,
 * escalateIfMaxAttemptsReached, scanForDueRetries.
 * Uses mocked Supabase client (no DB required).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applySmartDowngrade,
  detectFailedPayment,
  escalateIfMaxAttemptsReached,
  executeRetry,
  markRecovered,
  scanForDueRetries,
} from "../../../docker-core/server/billing/churnRecoveryEngine";

function mockSupabase(
  rpcResults: Record<string, unknown[] | Record<string, unknown>>
): SupabaseClient {
  const rpc = jest.fn(async (fn: string, params: Record<string, unknown>) => {
    const result = rpcResults[fn];
    if (!result) return { data: null, error: null };
    const out = Array.isArray(result) ? result : [result];
    return { data: out, error: null };
  });
  return { rpc } as unknown as SupabaseClient;
}

describe("churnRecoveryEngine", () => {
  describe("escalateIfMaxAttemptsReached", () => {
    it("returns false when attempt_count < pauseAfterAttempts (4)", () => {
      expect(escalateIfMaxAttemptsReached(0)).toBe(false);
      expect(escalateIfMaxAttemptsReached(1)).toBe(false);
      expect(escalateIfMaxAttemptsReached(2)).toBe(false);
      expect(escalateIfMaxAttemptsReached(3)).toBe(false);
    });
    it("returns true when attempt_count >= 4", () => {
      expect(escalateIfMaxAttemptsReached(4)).toBe(true);
      expect(escalateIfMaxAttemptsReached(5)).toBe(true);
    });
  });

  describe("detectFailedPayment", () => {
    it("returns attempt record from RPC", async () => {
      const client = mockSupabase({
        churn_detect_failed_payment: [
          {
            attempt_id: "a1",
            attempt_count: 1,
            next_retry_at: "2026-02-26T12:00:00Z",
            escalated: false,
          },
        ],
      });
      const result = await detectFailedPayment(client, "r1", "card_declined");
      expect(result).toEqual({
        attemptId: "a1",
        attemptCount: 1,
        nextRetryAt: "2026-02-26T12:00:00Z",
        escalated: false,
      });
      expect(client.rpc).toHaveBeenCalledWith("churn_detect_failed_payment", expect.objectContaining({
        p_restaurant_id: "r1",
        p_failure_reason: "card_declined",
        p_limited_after: 2,
        p_readonly_after: 3,
        p_pause_after: 4,
      }));
    });

    it("throws on RPC error", async () => {
      const client = {
        rpc: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      } as unknown as SupabaseClient;
      await expect(detectFailedPayment(client, "r1")).rejects.toThrow("churn_detect_failed_payment failed");
    });
  });

  describe("executeRetry", () => {
    it("returns success from RPC", async () => {
      const client = mockSupabase({
        churn_execute_retry: [{ success: true, message: "Retry executed (record updated)" }],
      });
      const result = await executeRetry(client, "r1");
      expect(result).toEqual({ success: true, message: "Retry executed (record updated)" });
      expect(client.rpc).toHaveBeenCalledWith("churn_execute_retry", {
        p_restaurant_id: "r1",
      });
    });
    it("returns failure when retry not due", async () => {
      const client = mockSupabase({
        churn_execute_retry: [{ success: false, message: "Retry not yet due" }],
      });
      const result = await executeRetry(client, "r1");
      expect(result.success).toBe(false);
    });
  });

  describe("markRecovered", () => {
    it("returns true on success", async () => {
      const client = {
        rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      } as unknown as SupabaseClient;
      const result = await markRecovered(client, "r1");
      expect(result).toBe(true);
      expect(client.rpc).toHaveBeenCalledWith("churn_mark_recovered", {
        p_restaurant_id: "r1",
      });
    });
    it("throws on RPC error", async () => {
      const client = {
        rpc: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      } as unknown as SupabaseClient;
      await expect(markRecovered(client, "r1")).rejects.toThrow("churn_mark_recovered failed");
    });
  });

  describe("scanForDueRetries", () => {
    it("returns rows from RPC", async () => {
      const client = mockSupabase({
        churn_scan_due_retries: [
          {
            id: "id1",
            restaurant_id: "r1",
            attempt_count: 1,
            next_retry_at: "2026-02-25T10:00:00Z",
          },
        ],
      });
      const result = await scanForDueRetries(client);
      expect(result).toEqual([
        {
          id: "id1",
          restaurant_id: "r1",
          attempt_count: 1,
          next_retry_at: "2026-02-25T10:00:00Z",
        },
      ]);
      expect(client.rpc).toHaveBeenCalledWith("churn_scan_due_retries");
    });
    it("returns empty array when no due retries", async () => {
      const client = mockSupabase({ churn_scan_due_retries: [] });
      const result = await scanForDueRetries(client);
      expect(result).toEqual([]);
    });
  });

  describe("applySmartDowngrade", () => {
    it("returns applied and new_status from RPC", async () => {
      const client = mockSupabase({
        churn_apply_smart_downgrade: [{ applied: true, new_status: "past_due_limited" }],
      });
      const result = await applySmartDowngrade(client, "r1");
      expect(result).toEqual({ applied: true, newStatus: "past_due_limited" });
      expect(client.rpc).toHaveBeenCalledWith("churn_apply_smart_downgrade", expect.objectContaining({
        p_restaurant_id: "r1",
        p_limited_after: 2,
        p_readonly_after: 3,
        p_pause_after: 4,
      }));
    });
    it("returns not applied when no attempt record", async () => {
      const client = mockSupabase({
        churn_apply_smart_downgrade: [{ applied: false, new_status: null }],
      });
      const result = await applySmartDowngrade(client, "r1");
      expect(result).toEqual({ applied: false, newStatus: null });
    });
  });
});
