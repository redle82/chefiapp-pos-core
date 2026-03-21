/**
 * Churn Recovery Engine — Smart downgrade before full pause
 *
 * Integrates with gm_churn_recovery_attempts and gm_restaurants.billing_status.
 * Transition: past_due → past_due_limited → past_due_readonly → paused.
 * Config from billingGraceConfig (no hardcoded numbers).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { GRACE_ATTEMPT_THRESHOLDS } from "./billingGraceConfig";

export interface DetectResult {
  attemptId: string;
  attemptCount: number;
  nextRetryAt: string | null;
  escalated: boolean;
  newStatus?: string;
}

export interface ApplySmartDowngradeResult {
  applied: boolean;
  newStatus: string | null;
}

export interface ExecuteRetryResult {
  success: boolean;
  message: string;
}

export interface DueRetryRow {
  id: string;
  restaurant_id: string;
  attempt_count: number;
  next_retry_at: string | null;
}

/**
 * Detect failed payment — create or update attempt, apply smart downgrade.
 * Idempotent per restaurant (UNIQUE on restaurant_id).
 */
export async function detectFailedPayment(
  client: SupabaseClient,
  restaurantId: string,
  failureReason?: string
): Promise<DetectResult | null> {
  const { data, error } = await client.rpc("churn_detect_failed_payment", {
    p_restaurant_id: restaurantId,
    p_failure_reason: failureReason ?? null,
    p_limited_after: GRACE_ATTEMPT_THRESHOLDS.limitedAfterAttempts,
    p_readonly_after: GRACE_ATTEMPT_THRESHOLDS.readonlyAfterAttempts,
    p_pause_after: GRACE_ATTEMPT_THRESHOLDS.pauseAfterAttempts,
  });
  if (error) {
    throw new Error(`churn_detect_failed_payment failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    attemptId: row.attempt_id,
    attemptCount: row.attempt_count ?? 0,
    nextRetryAt: row.next_retry_at ?? null,
    escalated: row.escalated ?? false,
    newStatus: row.new_status ?? undefined,
  };
}

/**
 * Apply smart downgrade from current attempt record (idempotent).
 * Use when re-applying status without a new payment failure.
 */
export async function applySmartDowngrade(
  client: SupabaseClient,
  restaurantId: string
): Promise<ApplySmartDowngradeResult> {
  const { data, error } = await client.rpc("churn_apply_smart_downgrade", {
    p_restaurant_id: restaurantId,
    p_limited_after: GRACE_ATTEMPT_THRESHOLDS.limitedAfterAttempts,
    p_readonly_after: GRACE_ATTEMPT_THRESHOLDS.readonlyAfterAttempts,
    p_pause_after: GRACE_ATTEMPT_THRESHOLDS.pauseAfterAttempts,
  });
  if (error) {
    throw new Error(`churn_apply_smart_downgrade failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { applied: false, newStatus: null };
  return {
    applied: row.applied ?? false,
    newStatus: row.new_status ?? null,
  };
}

export function scheduleRetry(_client: SupabaseClient, _restaurantId: string): void {
  // Scheduling is done in detectFailedPayment RPC
}

export async function executeRetry(
  client: SupabaseClient,
  restaurantId: string
): Promise<ExecuteRetryResult> {
  const { data, error } = await client.rpc("churn_execute_retry", {
    p_restaurant_id: restaurantId,
  });
  if (error) {
    throw new Error(`churn_execute_retry failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { success: false, message: "No result" };
  return {
    success: row.success ?? false,
    message: row.message ?? "",
  };
}

export async function markRecovered(
  client: SupabaseClient,
  restaurantId: string
): Promise<boolean> {
  const { data, error } = await client.rpc("churn_mark_recovered", {
    p_restaurant_id: restaurantId,
  });
  if (error) {
    throw new Error(`churn_mark_recovered failed: ${error.message}`);
  }
  return data === true;
}

export function escalateIfMaxAttemptsReached(attemptCount: number): boolean {
  return attemptCount >= GRACE_ATTEMPT_THRESHOLDS.pauseAfterAttempts;
}

export async function scanForDueRetries(client: SupabaseClient): Promise<DueRetryRow[]> {
  const { data, error } = await client.rpc("churn_scan_due_retries");
  if (error) {
    throw new Error(`churn_scan_due_retries failed: ${error.message}`);
  }
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    restaurant_id: r.restaurant_id as string,
    attempt_count: (r.attempt_count as number) ?? 0,
    next_retry_at: (r.next_retry_at as string) ?? null,
  }));
}
