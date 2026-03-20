/**
 * Server-side Audit Log
 *
 * Writes immutable audit events to gm_audit_logs via Supabase service_role.
 * This bypasses RLS (INSERT is denied to normal users via policy).
 * The audit log is append-only and cannot be updated or deleted.
 */
import type { VercelRequest } from "@vercel/node";
import { getSupabaseAdmin } from "./supabase";
import type { Role } from "./rbac";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditEvent {
  action: string;
  actorId: string;
  actorRole: Role;
  restaurantId: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  result?: "success" | "failure" | "partial";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Write an immutable audit event to gm_audit_logs.
 * Uses service_role client to bypass RLS INSERT denial.
 * Never throws — logs errors to console but does not break the caller.
 */
export async function logAudit(
  event: AuditEvent,
  req?: VercelRequest,
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const ip = req ? extractIp(req) : "server";

    const { error } = await supabase.from("gm_audit_logs").insert({
      event_type: event.action,
      action: event.action,
      actor_id: event.actorId,
      actor_type: "user",
      restaurant_id: event.restaurantId,
      resource_type: event.entityType,
      resource_id: event.entityId,
      details: event.details ?? null,
      result: event.result ?? "success",
      metadata: {
        ip_address: event.ipAddress ?? ip,
        actor_role: event.actorRole,
        source: "api_server",
      },
    });

    if (error) {
      console.error("[audit] Failed to write audit log:", error.message);
    }
  } catch (err) {
    console.error(
      "[audit] Unexpected error writing audit log:",
      err instanceof Error ? err.message : err,
    );
  }
}
