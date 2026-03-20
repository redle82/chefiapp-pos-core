/**
 * Order Use Cases
 *
 * Application Layer facade for order-related operations.
 * Orchestrates: domain invariants -> service execution -> domain events -> metrics.
 *
 * NO React imports. Pure TypeScript orchestration.
 *
 * Bounded Context: Order Management
 */

import type { Order, OrderItem } from "../domain/order/types";
import type { UserRole } from "../core/context/ContextTypes";
import type { DiscountDescriptor, InvariantResult } from "../domain/invariants/OrderInvariants";
import {
  canModifyOrder,
  canCancelOrder,
  canReopenOrder,
  canApplyDiscount,
} from "../domain/invariants/OrderInvariants";
import { calculateOrderTotals } from "../domain/order/calculateOrderTotals";
import {
  createOrderAtomic,
  addOrderItem,
  removeOrderItem,
  updateOrderStatus,
  type CreateOrderAtomicParams,
  type AddOrderItemParams,
} from "../core/infra/CoreOrdersApi";
import { emitDomainEvent } from "../domain/events/DomainEvents";
import { logAuditEvent } from "../core/audit/AuditService";
import { track } from "../analytics/track";
import { Logger } from "../core/logger";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface CreateOrderParams {
  restaurantId: string;
  items: Array<{
    productId: string | null;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod?: string;
  tableId?: string | null;
  operatorId?: string;
  idempotencyKey?: string;
}

export interface AddItemToOrderParams {
  orderId: string;
  restaurantId: string;
  order: Order;
  item: {
    productId: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    modifiers?: unknown[];
    notes?: string | null;
  };
}

export interface RemoveItemFromOrderParams {
  orderId: string;
  itemId: string;
  restaurantId: string;
  order: Order;
}

export interface ApplyDiscountParams {
  orderId: string;
  restaurantId: string;
  order: Order;
  discount: DiscountDescriptor;
  discountId: string;
  role: UserRole;
  operatorId?: string;
}

export interface CancelOrderParams {
  orderId: string;
  restaurantId: string;
  order: Order;
  reason: string;
  role: UserRole;
  operatorId?: string;
  operatorName?: string;
}

export interface ReopenOrderParams {
  orderId: string;
  restaurantId: string;
  order: Order;
  reason: string;
  role: UserRole;
  operatorId: string;
  operatorName: string;
}

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

/**
 * Create a new order.
 *
 * 1. Validate items are present.
 * 2. Create order atomically via CoreOrdersApi.
 * 3. Emit ORDER_CREATED domain event.
 * 4. Track metrics.
 */
export async function createOrder(
  params: CreateOrderParams,
): Promise<Result<{ orderId: string; totalCents: number }>> {
  // 1. Validate
  if (!params.items.length) {
    return { success: false, error: "Order must have at least one item." };
  }

  if (!params.restaurantId) {
    return { success: false, error: "Restaurant ID is required." };
  }

  // 2. Execute
  try {
    const apiParams: CreateOrderAtomicParams = {
      p_restaurant_id: params.restaurantId,
      p_items: params.items.map((i) => ({
        product_id: i.productId,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      })),
      p_payment_method: params.paymentMethod,
      p_idempotency_key: params.idempotencyKey,
      table_id: params.tableId,
    };

    const result = await createOrderAtomic(apiParams);

    if (result.error || !result.data) {
      return {
        success: false,
        error: result.error?.message ?? "Failed to create order.",
      };
    }

    const { id: orderId, total_cents: totalCents } = result.data;

    // 3. Emit domain event
    const orderItems: OrderItem[] = params.items.map((i, idx) => ({
      id: `item_${idx}`,
      productId: i.productId ?? "custom",
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    emitDomainEvent(
      { type: "ORDER_CREATED", orderId, items: orderItems },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Metrics
    track("order.created", {
      orderId,
      restaurantId: params.restaurantId,
      itemCount: params.items.length,
      totalCents,
    });

    return { success: true, data: { orderId, totalCents } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error creating order";
    Logger.error("[OrderUseCases.createOrder]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Add an item to an existing order.
 *
 * 1. Validate canModifyOrder invariant.
 * 2. Add item via CoreOrdersApi.
 * 3. Track metrics.
 */
export async function addItemToOrder(
  params: AddItemToOrderParams,
): Promise<Result<{ itemId: string }>> {
  // 1. Validate
  const check = canModifyOrder(params.order);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const subtotalCents = params.item.unitPrice * params.item.quantity;

    const apiParams: AddOrderItemParams = {
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      product_id: params.item.productId,
      name_snapshot: params.item.name,
      price_snapshot: params.item.unitPrice,
      quantity: params.item.quantity,
      subtotal_cents: subtotalCents,
      modifiers: params.item.modifiers,
      notes: params.item.notes,
    };

    const result = await addOrderItem(apiParams);

    if (result.error || !result.data) {
      return {
        success: false,
        error: result.error?.message ?? "Failed to add item.",
      };
    }

    // 3. Metrics
    track("order.item_added", {
      orderId: params.orderId,
      productId: params.item.productId,
      quantity: params.item.quantity,
    });

    return { success: true, data: { itemId: result.data.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error adding item";
    Logger.error("[OrderUseCases.addItemToOrder]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Remove an item from an existing order.
 *
 * 1. Validate canModifyOrder invariant.
 * 2. Remove item via CoreOrdersApi.
 * 3. Track metrics.
 */
export async function removeItemFromOrder(
  params: RemoveItemFromOrderParams,
): Promise<Result<null>> {
  // 1. Validate
  const check = canModifyOrder(params.order);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const result = await removeOrderItem(
      params.orderId,
      params.itemId,
      params.restaurantId,
    );

    if (result.error) {
      return {
        success: false,
        error: result.error.message ?? "Failed to remove item.",
      };
    }

    // 3. Metrics
    track("order.item_removed", {
      orderId: params.orderId,
      itemId: params.itemId,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error removing item";
    Logger.error("[OrderUseCases.removeItemFromOrder]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Apply a discount to an order.
 *
 * 1. Validate canApplyDiscount invariant.
 * 2. Apply discount (currently a local operation — backend handles via order recalc).
 * 3. Emit DISCOUNT_APPLIED domain event.
 * 4. Log audit event.
 * 5. Track metrics.
 */
export async function applyDiscount(
  params: ApplyDiscountParams,
): Promise<Result<{ newTotal: number }>> {
  // 1. Validate
  const check = canApplyDiscount(params.order, params.discount);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Calculate new totals
  try {
    const newTotals = calculateOrderTotals(
      params.order.items,
      0,
      params.discount.amountCents,
    );

    // 3. Emit domain event
    emitDomainEvent(
      {
        type: "DISCOUNT_APPLIED",
        orderId: params.orderId,
        discountId: params.discountId,
        amountCents: params.discount.amountCents,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Audit
    logAuditEvent({
      action: "DISCOUNT_APPLIED",
      orderId: params.orderId,
      operatorId: params.operatorId ?? "",
      operatorName: "",
      reason: `Discount ${params.discountId} applied: ${params.discount.amountCents} cents`,
      timestamp: new Date().toISOString(),
      metadata: {
        discountId: params.discountId,
        amountCents: params.discount.amountCents,
        role: params.role,
      },
    }).catch(() => {
      // Non-blocking: audit should never break the main flow
    });

    // 5. Metrics
    track("order.discount_applied", {
      orderId: params.orderId,
      discountId: params.discountId,
      amountCents: params.discount.amountCents,
    });

    return { success: true, data: { newTotal: newTotals.total } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error applying discount";
    Logger.error("[OrderUseCases.applyDiscount]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Cancel an order.
 *
 * 1. Validate canCancelOrder invariant.
 * 2. Update order status to CANCELLED via CoreOrdersApi.
 * 3. Emit ORDER_CANCELLED domain event.
 * 4. Log audit event.
 * 5. Track metrics.
 */
export async function cancelOrder(
  params: CancelOrderParams,
): Promise<Result<null>> {
  // 1. Validate
  const check = canCancelOrder(params.order, params.role);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const result = await updateOrderStatus({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      new_status: "cancelled",
      origin: "TPV_CANCEL",
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message ?? "Failed to cancel order.",
      };
    }

    // 3. Emit domain event
    emitDomainEvent(
      {
        type: "ORDER_CANCELLED",
        orderId: params.orderId,
        reason: params.reason,
        cancelledBy: params.operatorId ?? "unknown",
      },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Audit
    logAuditEvent({
      action: "ORDER_CANCELLED",
      orderId: params.orderId,
      operatorId: params.operatorId ?? "",
      operatorName: params.operatorName ?? "",
      reason: params.reason,
      timestamp: new Date().toISOString(),
      metadata: {
        restaurantId: params.restaurantId,
        role: params.role,
        previousStatus: params.order.status,
      },
    }).catch(() => {});

    // 5. Metrics
    track("order.cancelled", {
      orderId: params.orderId,
      reason: params.reason,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error cancelling order";
    Logger.error("[OrderUseCases.cancelOrder]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Reopen a closed/paid/cancelled order.
 *
 * 1. Validate canReopenOrder invariant.
 * 2. Update order status to OPEN via CoreOrdersApi.
 * 3. Log audit event (mandatory for compliance).
 * 4. Emit ORDER_REOPENED domain event.
 * 5. Track metrics.
 */
export async function reopenOrder(
  params: ReopenOrderParams,
): Promise<Result<null>> {
  // 1. Validate
  const check = canReopenOrder(params.order, params.role, params.reason);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const result = await updateOrderStatus({
      order_id: params.orderId,
      restaurant_id: params.restaurantId,
      new_status: "pending",
      origin: "TPV_REOPEN",
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message ?? "Failed to reopen order.",
      };
    }

    // 3. Audit (mandatory for reopen)
    await logAuditEvent({
      action: "ORDER_REOPENED",
      orderId: params.orderId,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      reason: params.reason,
      timestamp: new Date().toISOString(),
      metadata: {
        restaurantId: params.restaurantId,
        role: params.role,
        previousStatus: params.order.status,
        newStatus: "pending",
      },
    });

    // 4. Emit domain event
    emitDomainEvent(
      {
        type: "ORDER_REOPENED",
        orderId: params.orderId,
        reason: params.reason,
        reopenedBy: params.operatorId,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 5. Metrics
    track("order.reopened", {
      orderId: params.orderId,
      reason: params.reason,
      operator: params.operatorId,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error reopening order";
    Logger.error("[OrderUseCases.reopenOrder]", { error: message });
    return { success: false, error: message };
  }
}
