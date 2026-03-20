/**
 * GET /api/cron/close-stale-shifts
 *
 * Vercel Cron Job — runs every 2 hours.
 * Finds shifts active for more than 14 hours and auto-closes them.
 *
 * Protected by CRON_SECRET env var (Vercel sets Authorization header for crons).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabase";

const MAX_SHIFT_HOURS = 14;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify cron secret (Vercel sends this for cron invocations)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabase = getSupabaseAdmin();
  const cutoff = new Date(
    Date.now() - MAX_SHIFT_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Find shifts that started more than 14h ago and are still active
  const { data: staleShifts, error: fetchError } = await supabase
    .from("shifts")
    .select("id, restaurant_id, user_id, start_time")
    .eq("status", "CONFIRMED")
    .is("end_time", null)
    .lt("start_time", cutoff);

  if (fetchError) {
    console.error("Failed to fetch stale shifts:", fetchError);
    res.status(500).json({ error: "Database query failed" });
    return;
  }

  if (!staleShifts || staleShifts.length === 0) {
    res.status(200).json({ closed: 0, message: "No stale shifts found" });
    return;
  }

  const now = new Date().toISOString();
  let closedCount = 0;

  for (const shift of staleShifts) {
    // Close the shift
    const { error: updateError } = await supabase
      .from("shifts")
      .update({
        status: "CANCELLED",
        end_time: now,
        updated_at: now,
      })
      .eq("id", shift.id);

    if (updateError) {
      console.error(`Failed to close shift ${shift.id}:`, updateError);
      continue;
    }

    // Log audit event
    await supabase.from("audit_log").insert({
      entity_type: "shift",
      entity_id: shift.id,
      action: "auto_closed_overtime",
      restaurant_id: shift.restaurant_id,
      user_id: shift.user_id,
      metadata: {
        start_time: shift.start_time,
        closed_at: now,
        reason: `Shift exceeded ${MAX_SHIFT_HOURS}h limit`,
      },
      created_at: now,
    });

    closedCount++;
  }

  console.log(`Closed ${closedCount}/${staleShifts.length} stale shifts`);

  res.status(200).json({
    closed: closedCount,
    total: staleShifts.length,
    cutoff,
  });
}
