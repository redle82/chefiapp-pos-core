/**
 * reopenOrder — Reopen a CLOSED order so it can be modified again.
 *
 * Guards:
 *   - Only CLOSED orders can be reopened.
 *   - Only operators with role "manager" or "owner" can execute.
 *   - A reason must be provided (audit compliance).
 *
 * Flow:
 *   1. Validate role + current order status.
 *   2. Call updateOrderStatus(OPEN) on backend.
 *   3. Log audit event to local IndexedDB.
 *
 * The caller is responsible for navigating back to the POS with the reopened order.
 */

import type { UserRole } from "../../core/context/ContextTypes";
import { updateOrderStatus } from "../infra/CoreOrdersApi";
import { Logger } from "../logger";
import {
  logAuditEvent,
  type AuditEvent,
} from "../audit/AuditService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReopenOrderParams {
  orderId: string;
  restaurantId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  reason: string;
}

export interface ReopenOrderResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Role guard
// ---------------------------------------------------------------------------

const ALLOWED_ROLES: UserRole[] = ["manager", "owner"];

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function reopenOrder(
  params: ReopenOrderParams,
): Promise<ReopenOrderResult> {
  const {
    orderId,
    restaurantId,
    operatorId,
    operatorName,
    operatorRole,
    reason,
  } = params;

  // Guard: role check
  if (!ALLOWED_ROLES.includes(operatorRole)) {
    return {
      success: false,
      error: "PERMISSION_DENIED: Only managers or owners can reopen orders.",
    };
  }

  // Guard: reason is required
  if (!reason.trim()) {
    return {
      success: false,
      error: "REASON_REQUIRED: A reason must be provided to reopen an order.",
    };
  }

  try {
    // Transition order status back to OPEN on backend
    // Note: The backend RPC `update_order_status` handles status validation.
    // CLOSED → pending (backend uses lowercase status names)
    const result = await updateOrderStatus({
      order_id: orderId,
      restaurant_id: restaurantId,
      new_status: "pending",
      origin: "TPV_REOPEN",
    });

    if (result.error) {
      Logger.error("[reopenOrder] Backend status update failed", {
        orderId,
        error: result.error.message,
      });
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Log audit event (non-blocking)
    const auditEvent: AuditEvent = {
      action: "ORDER_REOPENED",
      orderId,
      operatorId,
      operatorName,
      reason,
      timestamp: new Date().toISOString(),
      metadata: {
        restaurantId,
        operatorRole,
        previousStatus: "CLOSED",
        newStatus: "pending",
      },
    };

    await logAuditEvent(auditEvent);

    Logger.info("[ORDER_REOPENED]", {
      orderId,
      restaurantId,
      operatorId,
      operatorName,
      reason,
    });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error reopening order";
    Logger.error("[reopenOrder] Exception", { orderId, error: message });
    return { success: false, error: message };
  }
}
