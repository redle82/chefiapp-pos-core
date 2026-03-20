/**
 * POST /api/orders/reopen
 *
 * Reopens a previously closed/paid order. Requires manager or owner role.
 * Validates orderId and reason, updates status via Supabase admin,
 * and logs an immutable audit event.
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

    const { orderId, reason } = req.body as {
      orderId?: string;
      reason?: string;
    };

    if (!orderId || typeof orderId !== "string") {
      res.status(400).json({ error: "orderId is required" });
      return;
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      res.status(400).json({ error: "reason is required and must be non-empty" });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Verify order belongs to this restaurant
    const { data: order, error: fetchError } = await supabase
      .from("gm_orders")
      .select("id, status, restaurant_id")
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

    const previousStatus = order.status as string;

    // Update order status to OPEN
    const { error: updateError } = await supabase
      .from("gm_orders")
      .update({
        status: "OPEN",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("restaurant_id", ctx.restaurantId);

    if (updateError) {
      res.status(500).json({ error: "Failed to reopen order" });
      return;
    }

    await logAudit(
      {
        action: "order_reopened",
        actorId: ctx.userId,
        actorRole: ctx.role,
        restaurantId: ctx.restaurantId,
        entityType: "order",
        entityId: orderId,
        details: {
          reason: reason.trim(),
          previousStatus,
        },
      },
      req,
    );

    res.status(200).json({ success: true, orderId });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("[orders/reopen] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
