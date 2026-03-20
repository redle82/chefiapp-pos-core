/**
 * POST /api/payments/refund
 *
 * Issues a refund for a payment. Requires manager or owner role.
 * Validates paymentId and amount (positive, <= original amount).
 * Calls Stripe refund API and logs an immutable audit event.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireRole } from "../_lib/rbac";
import { logAudit } from "../_lib/auditLog";
import { getSupabaseAdmin } from "../_lib/supabase";
import { AuthError } from "../_lib/auth";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const ctx = await requireRole(req, ["manager", "owner"]);

    const { paymentId, amount, reason } = req.body as {
      paymentId?: string;
      amount?: number;
      reason?: string;
    };

    if (!paymentId || typeof paymentId !== "string") {
      res.status(400).json({ error: "paymentId is required" });
      return;
    }

    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "amount must be a positive number" });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch payment and verify ownership
    const { data: payment, error: fetchError } = await supabase
      .from("gm_payments")
      .select("id, amount_cents, stripe_payment_intent_id, restaurant_id, order_id, status")
      .eq("id", paymentId)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: "Failed to fetch payment" });
      return;
    }

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const originalAmountCents = payment.amount_cents as number;
    const amountCents = Math.round(amount * 100);

    if (amountCents > originalAmountCents) {
      res.status(400).json({
        error: `Refund amount (${amount}) exceeds original payment (${originalAmountCents / 100})`,
      });
      return;
    }

    // Call Stripe refund API
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      res.status(500).json({ error: "Stripe not configured" });
      return;
    }

    const stripePaymentIntentId = payment.stripe_payment_intent_id as string;
    if (!stripePaymentIntentId) {
      res.status(400).json({ error: "Payment has no associated Stripe payment intent" });
      return;
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        payment_intent: stripePaymentIntentId,
        amount: String(amountCents),
        reason: "requested_by_customer",
      }),
    });

    const stripeData = (await stripeResponse.json()) as Record<string, unknown>;

    if (!stripeResponse.ok) {
      const stripeError = (stripeData.error as Record<string, unknown>)?.message ?? "Stripe refund failed";
      res.status(502).json({ error: stripeError });
      return;
    }

    const refundId = stripeData.id as string;

    // Record refund in gm_refunds
    const idempotencyKey = `refund_${paymentId}_${amountCents}_${Date.now()}`;

    await supabase.from("gm_refunds").insert({
      payment_id: paymentId,
      order_id: payment.order_id,
      restaurant_id: ctx.restaurantId,
      amount_cents: amountCents,
      reason: reason ?? "Requested by operator",
      status: "completed",
      stripe_refund_id: refundId,
      operator_id: ctx.userId,
      idempotency_key: idempotencyKey,
    });

    // Update payment status if full refund
    if (amountCents === originalAmountCents) {
      await supabase
        .from("gm_payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }

    await logAudit(
      {
        action: "payment_refunded",
        actorId: ctx.userId,
        actorRole: ctx.role,
        restaurantId: ctx.restaurantId,
        entityType: "payment",
        entityId: paymentId,
        details: {
          refundId,
          amountCents,
          originalAmountCents,
          isPartial: amountCents < originalAmountCents,
          reason: reason ?? "Requested by operator",
        },
      },
      req,
    );

    res.status(200).json({ success: true, refundId });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("[payments/refund] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
