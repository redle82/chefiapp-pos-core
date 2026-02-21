/**
 * logAuditEvent - Frontend Helper para Logs de Auditoria
 *
 * Wrapper para chamar API que loga eventos em gm_audit_logs.
 * Captura IP e User-Agent automaticamente.
 * Não bloqueia operações se falhar.
 */

// LEGACY / LAB — blocked in Docker mode via core/supabase shim
import { supabase } from "../supabase";

export interface AuditEventParams {
  action: string; // e.g., 'order_created', 'order_status_changed'
  resourceEntity: string; // e.g., 'gm_orders', 'gm_payments'
  resourceId?: string; // ID do recurso afetado
  metadata?: Record<string, any>; // Dados contextuais
}

/**
 * Log audit event to backend
 * Non-blocking: failures are logged but don't throw errors
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // Silently fail if not authenticated (e.g., during SSR or before login)
      return;
    }

    const response = await fetch("/api/audit-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ChefiApp-Token": session.access_token,
      },
      body: JSON.stringify({
        action: params.action,
        resource_entity: params.resourceEntity,
        resource_id: params.resourceId,
        metadata: params.metadata || {},
      }),
    });

    if (!response.ok) {
      console.warn("[Audit] Failed to log event:", await response.text());
    }
  } catch (err) {
    // Non-blocking: audit logging should never break the main flow
    console.error("[Audit] Failed to log event:", err);
  }
}
