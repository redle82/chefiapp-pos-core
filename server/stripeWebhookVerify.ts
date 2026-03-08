/**
 * Stripe webhook signature verification (Node).
 * Contract for Edge webhook-stripe; allows unit testing verification logic without Deno.
 * Ref: docs/audit/ENDPOINT_RISK_AUDIT.md, supabase/functions/webhook-stripe/index.ts
 */

import Stripe from "stripe";

export type VerifyResult =
  | { ok: true; event: Stripe.Event }
  | { ok: false; error: string };

/**
 * Verifies Stripe webhook signature using the SDK (same contract as Edge).
 * Returns { ok: true, event } on success, { ok: false, error } when signature is missing or invalid.
 */
export function verifyStripeWebhook(
  payload: Buffer | string,
  signature: string,
  secret: string,
): VerifyResult {
  if (!signature?.trim() || !secret?.trim()) {
    return { ok: false, error: "Missing signature or secret" };
  }
  try {
    const body = typeof payload === "string" ? payload : payload.toString("utf8");
    const event = Stripe.webhooks.constructEvent(body, signature, secret);
    return { ok: true, event };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
