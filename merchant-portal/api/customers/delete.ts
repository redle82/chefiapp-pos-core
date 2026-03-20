/**
 * DELETE /api/customers/delete
 *
 * Anonymizes customer PII (GDPR-compliant deletion). Requires owner role.
 * Replaces personal data with "DELETED" but keeps financial records.
 * Logs a GDPR deletion audit event.
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
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const ctx = await requireRole(req, ["owner"]);

    const { customerId } = req.body as {
      customerId?: string;
    };

    if (!customerId || typeof customerId !== "string") {
      res.status(400).json({ error: "customerId is required" });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch customer and verify ownership
    const { data: customer, error: fetchError } = await supabase
      .from("gm_customers")
      .select("id, name, email, phone, restaurant_id")
      .eq("id", customerId)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: "Failed to fetch customer" });
      return;
    }

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    // Anonymize PII — replace with "DELETED" but keep the row for financial integrity
    const { error: updateError } = await supabase
      .from("gm_customers")
      .update({
        name: "DELETED",
        email: "DELETED",
        phone: "DELETED",
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .eq("restaurant_id", ctx.restaurantId);

    if (updateError) {
      res.status(500).json({ error: "Failed to anonymize customer data" });
      return;
    }

    await logAudit(
      {
        action: "customer_gdpr_deleted",
        actorId: ctx.userId,
        actorRole: ctx.role,
        restaurantId: ctx.restaurantId,
        entityType: "customer",
        entityId: customerId,
        details: {
          gdprAction: "anonymization",
          fieldsCleared: ["name", "email", "phone", "notes"],
          financialRecordsPreserved: true,
        },
      },
      req,
    );

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("[customers/delete] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
