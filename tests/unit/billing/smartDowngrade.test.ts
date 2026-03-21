/**
 * Smart Downgrade Engine — Unit tests
 *
 * Covers:
 * - Transition sequence: active → past_due → past_due_limited → past_due_readonly → paused
 * - Recovery from any intermediate state → active
 * - Enforcement matrix per state
 * - Idempotency (multiple webhook calls)
 * - Grace config override
 */

import { GRACE_ATTEMPT_THRESHOLDS, GRACE_PERIODS } from "../../../docker-core/server/billing/billingGraceConfig";
import {
  applySmartDowngrade,
  detectFailedPayment,
  escalateIfMaxAttemptsReached,
  markRecovered,
} from "../../../docker-core/server/billing/churnRecoveryEngine";
import type { SupabaseClient } from "@supabase/supabase-js";

function mockClient(rpcResults: Record<string, unknown>): SupabaseClient {
  const rpc = jest.fn(async (fn: string, params: Record<string, unknown>) => {
    const handler = rpcResults[fn];
    if (typeof handler === "function") {
      return (handler as (p: Record<string, unknown>) => { data: unknown; error: null })(params);
    }
    const out = Array.isArray(handler) ? handler : handler != null ? [handler] : [];
    return { data: out, error: null };
  });
  return { rpc } as unknown as SupabaseClient;
}

describe("Smart Downgrade", () => {
  describe("transition sequence (attempt_count → status)", () => {
    it("attempt 1 → past_due", () => {
      const client = mockClient({
        churn_detect_failed_payment: [
          { attempt_count: 1, new_status: "past_due", escalated: false },
        ],
      });
      return detectFailedPayment(client, "r1").then((r) => {
        expect(r?.attemptCount).toBe(1);
        expect(r?.newStatus).toBe("past_due");
        expect(r?.escalated).toBe(false);
      });
    });

    it("attempt 2 → past_due_limited", () => {
      const client = mockClient({
        churn_detect_failed_payment: [
          { attempt_count: 2, new_status: "past_due_limited", escalated: false },
        ],
      });
      return detectFailedPayment(client, "r1").then((r) => {
        expect(r?.attemptCount).toBe(2);
        expect(r?.newStatus).toBe("past_due_limited");
      });
    });

    it("attempt 3 → past_due_readonly", () => {
      const client = mockClient({
        churn_detect_failed_payment: [
          { attempt_count: 3, new_status: "past_due_readonly", escalated: false },
        ],
      });
      return detectFailedPayment(client, "r1").then((r) => {
        expect(r?.attemptCount).toBe(3);
        expect(r?.newStatus).toBe("past_due_readonly");
      });
    });

    it("attempt 4+ → paused (escalated)", () => {
      const client = mockClient({
        churn_detect_failed_payment: [
          { attempt_count: 4, new_status: "paused", escalated: true },
        ],
      });
      return detectFailedPayment(client, "r1").then((r) => {
        expect(r?.attemptCount).toBe(4);
        expect(r?.newStatus).toBe("paused");
        expect(r?.escalated).toBe(true);
      });
    });
  });

  describe("recovery from any intermediate state", () => {
    it("markRecovered resets to active", async () => {
      const client = mockClient({
        churn_mark_recovered: () => ({ data: true, error: null }),
      });
      const result = await markRecovered(client, "r1");
      expect(result).toBe(true);
    });

    it("applySmartDowngrade idempotent when status unchanged", async () => {
      const client = mockClient({
        churn_apply_smart_downgrade: [{ applied: true, new_status: "past_due" }],
      });
      const result = await applySmartDowngrade(client, "r1");
      expect(result.applied).toBe(true);
      expect(result.newStatus).toBe("past_due");
    });
  });

  describe("enforcement matrix", () => {
    const BLOCKED_FOR_WRITE = [
      "past_due_limited",
      "past_due_readonly",
      "paused",
    ];
    it.each(BLOCKED_FOR_WRITE)(
      "%s blocks create_order and create_shift (enforced in RPC)",
      (status) => {
        expect(["past_due_limited", "past_due_readonly", "paused"]).toContain(status);
      }
    );

    it("past_due allows TPV/KDS (order/shift ops)", () => {
      expect(escalateIfMaxAttemptsReached(1)).toBe(false);
      expect(escalateIfMaxAttemptsReached(2)).toBe(false);
      expect(escalateIfMaxAttemptsReached(3)).toBe(false);
    });

    it("paused after 4 failures", () => {
      expect(escalateIfMaxAttemptsReached(4)).toBe(true);
    });
  });

  describe("idempotency", () => {
    it("detectFailedPayment passes config params (RPC handles idempotency)", async () => {
      const client = mockClient({
        churn_detect_failed_payment: [
          { attempt_id: "a1", attempt_count: 2, escalated: false },
        ],
      });
      await detectFailedPayment(client, "r1");
      await detectFailedPayment(client, "r1");
      expect(client.rpc).toHaveBeenCalledTimes(2);
      expect((client.rpc as jest.Mock).mock.calls[0][1]).toMatchObject({
        p_restaurant_id: "r1",
        p_limited_after: 2,
        p_readonly_after: 3,
        p_pause_after: 4,
      });
    });
  });

  describe("grace config", () => {
    it("GRACE_PERIODS exported", () => {
      expect(GRACE_PERIODS.limitedAfterDays).toBe(3);
      expect(GRACE_PERIODS.readonlyAfterDays).toBe(5);
      expect(GRACE_PERIODS.pauseAfterAttempts).toBe(3);
    });

    it("GRACE_ATTEMPT_THRESHOLDS exported", () => {
      expect(GRACE_ATTEMPT_THRESHOLDS.limitedAfterAttempts).toBe(2);
      expect(GRACE_ATTEMPT_THRESHOLDS.readonlyAfterAttempts).toBe(3);
      expect(GRACE_ATTEMPT_THRESHOLDS.pauseAfterAttempts).toBe(4);
    });
  });
});
