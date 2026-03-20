/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events, verifies signature, updates
 * order/payment status in Supabase. Idempotent via webhook_events table.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabase";

// Stripe event types we handle
const HANDLED_EVENTS = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
]);

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function verifyStripeSignature(
  rawBody: Buffer,
  signature: string,
  secret: string,
): Promise<Record<string, unknown>> {
  // Use Node crypto to verify Stripe signature (no stripe SDK dependency)
  const crypto = await import("node:crypto");

  const elements = signature.split(",");
  const timestamp = elements
    .find((e) => e.startsWith("t="))
    ?.slice(2);
  const v1Signatures = elements
    .filter((e) => e.startsWith("v1="))
    .map((e) => e.slice(3));

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid Stripe signature format");
  }

  // Reject events older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > 300) {
    throw new Error("Webhook timestamp too old");
  }

  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const isValid = v1Signatures.some((sig) =>
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)),
  );

  if (!isValid) {
    throw new Error("Invalid Stripe signature");
  }

  return JSON.parse(rawBody.toString("utf8"));
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"] as string;
  if (!signature) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Record<string, unknown>;
  try {
    const rawBody = await readRawBody(req);
    event = await verifyStripeSignature(rawBody, signature, secret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const eventId = event.id as string;
  const eventType = event.type as string;

  if (!HANDLED_EVENTS.has(eventType)) {
    res.status(200).json({ received: true, handled: false });
    return;
  }

  const supabase = getSupabaseAdmin();

  // Idempotency check: skip if event already processed
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  // Record event before processing (at-least-once delivery)
  await supabase.from("webhook_events").insert({
    event_id: eventId,
    source: "stripe",
    event_type: eventType,
    payload: event,
    processed_at: new Date().toISOString(),
  });

  // Process based on event type
  try {
    const data = event.data as { object: Record<string, unknown> };
    const obj = data.object;

    switch (eventType) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(supabase, obj);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(supabase, obj);
        break;
      case "charge.refunded":
        await handleChargeRefunded(supabase, obj);
        break;
      case "charge.dispute.created":
        await handleDisputeCreated(supabase, obj);
        break;
    }
  } catch (err) {
    console.error(`Error processing ${eventType}:`, err);
    // Still return 200 so Stripe doesn't retry; error is logged
  }

  res.status(200).json({ received: true });
}

// --- Event Handlers ---

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  paymentIntent: Record<string, unknown>,
): Promise<void> {
  const orderId = (paymentIntent.metadata as Record<string, string>)?.order_id;
  if (!orderId) return;

  await supabase
    .from("payments")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  await supabase
    .from("orders")
    .update({ status: "PAID", updated_at: new Date().toISOString() })
    .eq("id", orderId);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  paymentIntent: Record<string, unknown>,
): Promise<void> {
  const orderId = (paymentIntent.metadata as Record<string, string>)?.order_id;
  if (!orderId) return;

  await supabase
    .from("payments")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntent.id);
}

async function handleChargeRefunded(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  charge: Record<string, unknown>,
): Promise<void> {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  await supabase
    .from("payments")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId);
}

async function handleDisputeCreated(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  dispute: Record<string, unknown>,
): Promise<void> {
  const paymentIntentId = dispute.payment_intent as string;

  await supabase.from("payment_disputes").insert({
    stripe_dispute_id: dispute.id,
    stripe_payment_intent_id: paymentIntentId,
    amount: dispute.amount,
    reason: dispute.reason,
    status: dispute.status,
    created_at: new Date().toISOString(),
  });
}
