/**
 * SumUp webhook signature verification — testable in Node (Jest).
 * Edge equivalent: supabase/functions/webhook-sumup (uses Web Crypto).
 * Used to get branch coverage and regression tests for the same algorithm.
 */

import * as crypto from "crypto";

export function hmacSha256Hex(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

/**
 * Returns true if signature matches "sha256=" + HMAC-SHA256(secret, body).
 * If secret is empty or signature is missing, returns false.
 */
export function verifySumUpSignature(
  secret: string,
  body: string,
  signature: string | null | undefined,
): boolean {
  if (!secret || !signature) return false;
  const expected = "sha256=" + hmacSha256Hex(secret, body);
  return signature === expected;
}

/**
 * Derive event_id from payload (same logic as Edge and server handleSumUpWebhook).
 */
export function getSumUpEventId(payload: Record<string, unknown>): string {
  return (
    (payload.paymentId as string) ||
    (payload.event_id as string) ||
    (payload.id as string) ||
    `sumup_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Derive event_type from payload (same logic as Edge and server).
 */
export function getSumUpEventType(payload: Record<string, unknown>): string {
  const status = payload.status as string;
  if (status) return `payment.${String(status).toLowerCase()}`;
  return (payload.event_type as string) || "payment.notification";
}
