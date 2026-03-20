/**
 * PUT /api/shifts/edit
 *
 * Edits shift clock-in/clock-out times. Requires manager or owner role.
 * Logs audit event with before/after values.
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
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const ctx = await requireRole(req, ["manager", "owner"]);

    const { shiftId, clockIn, clockOut } = req.body as {
      shiftId?: string;
      clockIn?: string;
      clockOut?: string;
    };

    if (!shiftId || typeof shiftId !== "string") {
      res.status(400).json({ error: "shiftId is required" });
      return;
    }

    if (!clockIn && !clockOut) {
      res.status(400).json({ error: "At least one of clockIn or clockOut must be provided" });
      return;
    }

    // Validate date formats
    if (clockIn && isNaN(Date.parse(clockIn))) {
      res.status(400).json({ error: "clockIn must be a valid ISO date string" });
      return;
    }

    if (clockOut && isNaN(Date.parse(clockOut))) {
      res.status(400).json({ error: "clockOut must be a valid ISO date string" });
      return;
    }

    const supabase = getSupabaseAdmin();

    // Fetch existing shift and verify ownership
    const { data: shift, error: fetchError } = await supabase
      .from("shift_logs")
      .select("id, start_time, end_time, restaurant_id, employee_id, status")
      .eq("id", shiftId)
      .eq("restaurant_id", ctx.restaurantId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: "Failed to fetch shift" });
      return;
    }

    if (!shift) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }

    // Build before/after for audit
    const before = {
      start_time: shift.start_time,
      end_time: shift.end_time,
    };

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (clockIn) {
      updates.start_time = clockIn;
    }

    if (clockOut) {
      updates.end_time = clockOut;

      // Recalculate duration if we have both times
      const startTime = clockIn ? new Date(clockIn) : new Date(shift.start_time as string);
      const endTime = new Date(clockOut);
      const durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60),
      );

      if (durationMinutes < 0) {
        res.status(400).json({ error: "clockOut cannot be before clockIn" });
        return;
      }

      updates.duration_minutes = durationMinutes;
    }

    const { error: updateError } = await supabase
      .from("shift_logs")
      .update(updates)
      .eq("id", shiftId)
      .eq("restaurant_id", ctx.restaurantId);

    if (updateError) {
      res.status(500).json({ error: "Failed to update shift" });
      return;
    }

    const after = {
      start_time: clockIn ?? shift.start_time,
      end_time: clockOut ?? shift.end_time,
    };

    await logAudit(
      {
        action: "shift_edited",
        actorId: ctx.userId,
        actorRole: ctx.role,
        restaurantId: ctx.restaurantId,
        entityType: "shift",
        entityId: shiftId,
        details: {
          before,
          after,
          employeeId: shift.employee_id,
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
    console.error("[shifts/edit] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
