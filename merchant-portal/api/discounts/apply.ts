/**
 * POST /api/discounts/apply
 *
 * Applies a discount to an order with role-based thresholds:
 *   - Any role: discounts <= 20%
 *   - Manager or owner: discounts > 20% and <= 50%
 *   - Owner only: discounts > 50%
 *
 * Logs audit event for any discount > 20%.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveRole } from "../_lib/rbac";
import { logAudit } from "../_lib/auditLog";
import { getSupabaseAdmin } from "../_lib/supabase";
import { AuthError } from "../_lib/auth";

type DiscountType = "percentage" | "fixed";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const ctx = await resolveRole(req);

    const { orderId, discountType, value } = req.body as {
      orderId?: string;
      discountType?: DiscountType;
      value?: number;
    };

    if (!orderId || typeof orderId !== "string") {
      res.status(400).json({ error: "orderId is required" });
      return;
    }

    if (!discountType || !["percentage", "fixed"].includes(discountType)) {
      res.status(400).json({ error: "discountType must be 'percentage' or 'fixed'" });
      return;
    }

    if (typeof value !== "number" || value <= 0) {
      res.status(400).json({ error: "value must be a positive number" });
      return;
    }

    if (discountType === "percentage" && value > 100) {
      res.status(400).json({ error: "Percentage discount cannot exceed 100%" });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch order and verify ownership
    const { data: order, error: fetchError } = await supabase
      .from("gm_orders")
      .select("id, total_cents, restaurant_id, status")
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: "Failed to fetch order" });
      return;
    }

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const totalCents = order.total_cents as number;

    // Calculate effective discount percentage
    let effectivePercentage: number;
    let discountCents: number;

    if (discountType === "percentage") {
      effectivePercentage = value;
      discountCents = Math.round((totalCents * value) / 100);
    } else {
      // Fixed amount in cents
      discountCents = Math.round(value * 100);
      effectivePercentage = totalCents > 0 ? (discountCents / totalCents) * 100 : 0;
    }

    // Enforce role-based thresholds
    if (effectivePercentage > 50 && ctx.role !== "owner") {
      res.status(403).json({
        error: "Discounts above 50% require owner authorization",
      });
      return;
    }

    if (effectivePercentage > 20 && !["manager", "owner"].includes(ctx.role)) {
      res.status(403).json({
        error: "Discounts above 20% require manager or owner authorization",
      });
      return;
    }

    // Apply discount
    const newTotalCents = Math.max(0, totalCents - discountCents);

    const { error: updateError } = await supabase
      .from("gm_orders")
      .update({
        discount_cents: discountCents,
        total_cents: newTotalCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId);

    if (updateError) {
      res.status(500).json({ error: "Failed to apply discount" });
      return;
    }

    // Log audit event for any discount > 20%
    if (effectivePercentage > 20) {
      await logAudit(
        {
          action: "discount_applied",
          actorId: ctx.userId,
          actorRole: ctx.role,
          restaurantId: ctx.restaurantId,
          entityType: "order",
          entityId: orderId,
          details: {
            discountType,
            value,
            effectivePercentage: Math.round(effectivePercentage * 100) / 100,
            discountCents,
            originalTotalCents: totalCents,
            newTotalCents,
          },
        },
        req,
      );
    }

    res.status(200).json({
      success: true,
      newTotal: newTotalCents / 100,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("[discounts/apply] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
