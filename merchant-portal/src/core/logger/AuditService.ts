// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import { supabase } from "../supabase";
import { Logger } from "./Logger";

export interface AuditLogPayload {
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  actorId?: string;
  tenantId?: string;
}

/**
 * 🔱 AuditService (Opus 6.0)
 *
 * Sovereignty Level: PHASE 3 (Operation)
 * Responsibility: Securely log critical actions to the immutable audit trail.
 */
class AuditServiceCore {
  /**
   * Log a critical action.
   * This is fire-and-forget to avoid blocking the UI, but logs failures to the system Logger.
   */
  async log(payload: AuditLogPayload) {
    try {
      // resolve session if needed
      let { actorId, tenantId } = payload;

      if (!actorId || !tenantId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          actorId = actorId || session.user.id;
          // Try to extract tenant from metadata or localStorage if not explicit
          tenantId =
            tenantId || (session.user.app_metadata?.tenant_id as string);
        }
      }

      // If we still don't have a tenantId, check TabIsolatedStorage as fallback (fragile but better than loss)
      if (!tenantId) {
        const stored = getTabIsolated("chefiapp_active_tenant");
        if (stored) tenantId = stored;
      }

      if (!actorId || !tenantId) {
        Logger.warn("AuditService: Missing context", {
          actorId,
          tenantId,
          action: payload.action,
        });
        // We cannot insert without these FKs.
        return;
      }

      const { error } = await supabase.from("gm_audit_logs").insert({
        tenant_id: tenantId,
        actor_id: actorId,
        action: payload.action,
        resource_entity: payload.entity,
        resource_id: payload.entityId,
        metadata: payload.metadata || {},
        user_agent: navigator.userAgent,
      });

      if (error) {
        Logger.error("AuditService: Insert Failed", error, payload);
      }
    } catch (e) {
      Logger.error("AuditService: Exception", e, payload);
    }
  }
}

export const AuditService = new AuditServiceCore();
