/**
 * AuditLogService.ts
 * Client-side audit logging service
 * Integrates with docker-core gm_audit_logs via RPC (invokeRpc)
 *
 * Usage:
 *   await AuditLogService.logOrderCreated(restaurantId, orderId, tableId, userId);
 *   await AuditLogService.logPaymentRecorded(restaurantId, orderId, amount, method);
 *   await AuditLogService.logConfigChanged(restaurantId, key, oldVal, newVal, userId);
 *
 * Notes:
 * - Uses invokeRpc() from core/infra/coreRpc (Docker Core compatible)
 * - Failures are logged but don't block operations
 * - Requires restaurant_id (tenant isolation)
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { invokeRpc } from "../infra/coreRpc";

export interface AuditLogEvent {
  restaurantId: string;
  eventType: string;
  action: string;
  actorId?: string;
  actorType?: "user" | "system" | "support_admin";
  resourceType?: string;
  resourceId?: string;
  result?: "success" | "failure" | "partial";
  details?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogService {
  /**
   * Generic audit event logger
   * Calls log_audit_event RPC (SECURITY DEFINER, safe for users to call)
   * Uses invokeRpc (Docker Core compatible)
   */
  static async log(
    event: AuditLogEvent,
  ): Promise<{ success: boolean; auditId?: string; error?: string }> {
    // Only works with Docker Core backend
    if (getBackendType() !== BackendType.docker) {
      console.warn("[AuditLog] Not Docker Core backend, skipping audit log");
      return { success: false, error: "Not Docker Core backend" };
    }

    try {
      const result = await invokeRpc<{ audit_id?: string; id?: string }>(
        "log_audit_event",
        {
          p_restaurant_id: event.restaurantId,
          p_event_type: event.eventType,
          p_action: event.action,
          p_actor_id: event.actorId || null,
          p_actor_type: event.actorType || "user",
          p_resource_type: event.resourceType || null,
          p_resource_id: event.resourceId || null,
          p_result: event.result || "success",
          p_details: event.details || null,
          p_error_code: event.errorCode || null,
          p_error_message: event.errorMessage || null,
          p_metadata: event.metadata || null,
        },
      );

      if (result.error || !result.data) {
        console.error("[AuditLog] RPC returned failure:", result);
        return {
          success: false,
          error: result.error?.message || "Unknown error",
        };
      }

      return {
        success: true,
        auditId: result.data.audit_id || result.data.id,
      };
    } catch (err) {
      console.error("[AuditLog] Exception:", err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Log order creation
   */
  static async logOrderCreated(
    restaurantId: string,
    orderId: string,
    tableId: string | null,
    userId?: string,
  ) {
    return this.log({
      restaurantId,
      eventType: "order_created",
      action: "create",
      actorId: userId,
      resourceType: "order",
      resourceId: orderId,
      details: { tableId },
      metadata: { source: "app_layer" },
    });
  }

  /**
   * Log order payment status change
   */
  static async logOrderPaymentStatusChanged(
    restaurantId: string,
    orderId: string,
    fromStatus: string,
    toStatus: string,
    userId?: string,
  ) {
    return this.log({
      restaurantId,
      eventType: "order_payment_status_changed",
      action: "update",
      actorId: userId,
      resourceType: "order",
      resourceId: orderId,
      details: { from: fromStatus, to: toStatus },
      metadata: { source: "app_layer" },
    });
  }

  /**
   * Log payment recorded
   */
  static async logPaymentRecorded(
    restaurantId: string,
    orderId: string,
    amount: number,
    method: string,
    userId?: string,
  ) {
    return this.log({
      restaurantId,
      eventType: "payment_recorded",
      action: "create",
      actorId: userId,
      resourceType: "payment",
      details: { orderId, amount, method },
      result: "success",
      metadata: { source: "app_layer" },
    });
  }

  /**
   * Log config change
   */
  static async logConfigChanged(
    restaurantId: string,
    configKey: string,
    oldValue: unknown,
    newValue: unknown,
    userId?: string,
  ) {
    return this.log({
      restaurantId,
      eventType: "config_changed",
      action: "update",
      actorId: userId,
      resourceType: "config",
      details: { key: configKey, oldValue, newValue },
      metadata: { source: "app_layer" },
    });
  }

  /**
   * Log successful login (called after successful auth)
   * Uses Docker Core RPC via invokeRpc
   */
  static async logLoginSuccess(
    restaurantId: string,
    metadata?: Record<string, unknown>,
  ) {
    if (getBackendType() !== BackendType.docker) {
      return { success: false, error: "Not Docker Core backend" };
    }

    try {
      const result = await invokeRpc<{ audit_id?: string; id?: string }>(
        "record_auth_event",
        {
          p_event_type: "login_success",
          p_restaurant_id: restaurantId,
          p_metadata: metadata || null,
        },
      );

      if (result.error || !result.data) {
        console.error("[AuditLog] Login success log failed:", result);
        return {
          success: false,
          error: result.error?.message || "Unknown error",
        };
      }

      return { success: true, auditId: result.data.audit_id || result.data.id };
    } catch (err) {
      console.error("[AuditLog] Login success exception:", err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Log logout (called before logout)
   * Uses Docker Core RPC via invokeRpc
   */
  static async logLogout(
    restaurantId?: string,
    metadata?: Record<string, unknown>,
  ) {
    if (getBackendType() !== BackendType.docker) {
      return { success: false, error: "Not Docker Core backend" };
    }

    try {
      const result = await invokeRpc<{ audit_id?: string; id?: string }>(
        "record_auth_event",
        {
          p_event_type: "logout",
          p_restaurant_id: restaurantId || null,
          p_metadata: metadata || null,
        },
      );

      if (result.error || !result.data) {
        console.error("[AuditLog] Logout log failed:", result);
        return {
          success: false,
          error: result.error?.message || "Unknown error",
        };
      }

      return { success: true, auditId: result.data.audit_id || result.data.id };
    } catch (err) {
      console.error("[AuditLog] Logout exception:", err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Log login failure (anon, before auth)
   * Safe to call without authentication via invokeRpc
   */
  static async logLoginFailure(
    identifier: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ) {
    if (getBackendType() !== BackendType.docker) {
      return { success: false, error: "Not Docker Core backend" };
    }

    try {
      const result = await invokeRpc<{ audit_id?: string; id?: string }>(
        "log_login_failure",
        {
          p_identifier: identifier,
          p_reason: reason,
          p_metadata: metadata || null,
        },
      );

      if (result.error || !result.data) {
        console.warn("[AuditLog] Login failure log returned non-success");
        // Don't throw, just warn
        return {
          success: false,
          error: result.error?.message || "Unknown error",
        };
      }

      return { success: true, auditId: result.data.audit_id || result.data.id };
    } catch (err) {
      console.warn("[AuditLog] Login failure exception:", err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get audit logs for a restaurant (requires auth + membership)
   * Uses Docker Core RPC via invokeRpc
   */
  static async getLogs(
    restaurantId: string,
    options?: {
      from?: string; // ISO 8601 timestamp
      to?: string;
      eventType?: string;
      action?: string;
      actorId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    if (getBackendType() !== BackendType.docker) {
      return { success: false, error: "Not Docker Core backend", logs: [] };
    }

    try {
      const result = await invokeRpc("get_audit_logs", {
        p_restaurant_id: restaurantId,
        p_from: options?.from || null,
        p_to: options?.to || null,
        p_event_type: options?.eventType || null,
        p_action: options?.action || null,
        p_actor_id: options?.actorId || null,
        p_limit: options?.limit || 100,
        p_offset: options?.offset || 0,
      });

      if (!result || !Array.isArray(result)) {
        console.error("[AuditLog] Get logs failed:", result);
        return { success: false, error: "Invalid response", logs: [] };
      }

      return { success: true, logs: result };
    } catch (err) {
      console.error("[AuditLog] Get logs exception:", err);
      return { success: false, error: String(err), logs: [] };
    }
  }

  /**
   * Note: Real-time subscriptions to gm_audit_logs via PostgREST/Realtime
   * Currently not implemented. Use getLogs() with polling instead.
   * Real-time support can be added in Phase B2 (observability infrastructure).
   */
}

export default AuditLogService;
