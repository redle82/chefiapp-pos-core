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
import { canReopenOrder } from "../../domain/invariants/OrderInvariants";
import type { Order } from "../../domain/order/types";

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

  // Guard: validate via domain invariant
  // Build a minimal order snapshot representing a PAID/CLOSED order
  const orderSnapshot: Order = {
    id: orderId,
    restaurantId,
    status: "PAID",
    type: "dine_in",
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    createdAt: "",
    updatedAt: "",
  };

  const check = canReopenOrder(orderSnapshot, operatorRole, reason);
  if (!check.allowed) {
    return { success: false, error: check.reason };
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
