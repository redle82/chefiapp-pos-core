import type { EffectContext } from "../../../../core-engine/effects";
import {
  addOrderItem,
  createOrderAtomic,
  removeOrderItem,
  updateOrderItemQty,
  updateOrderStatus,
} from "../infra/CoreOrdersApi";
import { Logger } from "../logger";
// ANTI-SUPABASE §4: Order projection write only via Core. Zero Supabase/DbWriteGate for orders.

/**
 * Order Projection (Sovereign Write)
 *
 * Enforces Law 1 (Single Writer) by projecting Kernel Events to the Database
 * via the authorized atomic RPC.
 */
export async function persistOrder(context: EffectContext): Promise<void> {
  const {
    entityId,
    restaurantId,
    items,
    tableId,
    tableNumber,
    paymentMethod,
    syncMetadata,
  } = context;

  Logger.info("[Sovereignty] Projecting Order Creation...", { entityId });

  // 1. Prepare RPC payload
  const rpcItems = (items || []).map((item: any) => ({
    product_id: item.productId,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.priceCents || item.unitPrice, // Normalized
  }));

  // ERRO-002 Fix: Adicionar origem 'CAIXA' no syncMetadata para pedidos do TPV
  const enrichedSyncMetadata = {
    ...(syncMetadata || {}),
    origin: "CAIXA", // ERRO-002 Fix: Pedidos criados via TPV são do caixa
  };

  // 2. Core Orders API — Docker Core quando ativo; Supabase transicional (FINANCIAL_CORE_VIOLATION_AUDIT remediated)
  const { data, error } = await createOrderAtomic({
    p_restaurant_id: restaurantId,
    p_items: rpcItems,
    p_payment_method: paymentMethod || "cash",
    p_sync_metadata: enrichedSyncMetadata,
  });

  if (error) {
    Logger.error("[Sovereignty] Projection Failed", error);
    const constraintError = { code: error.code, message: error.message };
    if (
      constraintError.code === "23505" &&
      constraintError.message?.includes("idx_one_open_order_per_table")
    ) {
      const dbError = new Error(
        `TABLE_HAS_ACTIVE_ORDER: ${constraintError.message}`
      );
      (dbError as any).code = "23505";
      (dbError as any).constraint = "idx_one_open_order_per_table";
      throw dbError;
    }
    const dbError = new Error(`Projection Failed: ${error.message}`);
    if (constraintError.code) (dbError as any).code = constraintError.code;
    throw dbError;
  }

  // Origin is set via sync_metadata in create_order_atomic (Core). No Supabase domain write.

  // 3. Validation
  if (data.id !== entityId && entityId) {
    // If entityId was provided (UUIDv4 from Client), ensure DB used it if possible.
    // Currently create_order_atomic GENERATES a new UUID.
    // We need to support "Caller ID" eventually for pure idempotency.
    // For now, we accept the DB ID.
    Logger.warn("[Sovereignty] ID Mismatch (DB Generated vs Kernel Request)", {
      dbId: data.id,
      kernelId: entityId,
    });
  }

  Logger.info("[Sovereignty] Order Projected Successfully", { id: data.id });
}

/**
 * Persist Item Addition (Law 1)
 * Write only via Core Orders API — no Supabase/DbWriteGate.
 */
export async function persistOrderItem(context: EffectContext): Promise<void> {
  const { entityId, item } = context;
  const restaurantId = (context as any).restaurantId;
  Logger.info("[Sovereignty] Projecting Item Addition...", { entityId, item });

  const unitPrice = item.priceCents ?? item.unitPrice ?? 0;
  const quantity = item.quantity ?? 1;
  const result = await addOrderItem({
    order_id: entityId,
    restaurant_id: restaurantId,
    product_id: item.productId ?? null,
    name_snapshot: item.name ?? "",
    price_snapshot: unitPrice,
    quantity,
    subtotal_cents: unitPrice * quantity,
    modifiers: item.modifiers ?? [],
    notes: item.notes ?? null,
    category_name: item.categoryName ?? null,
    consumption_group_id: item.consumptionGroupId ?? null,
  });

  if (result.error) {
    Logger.error("[Sovereignty] Item Projection Failed", result.error);
    throw new Error(`Item Projection Failed: ${result.error.message}`);
  }
}

/**
 * Persist Item Removal (Law 1)
 * Write only via Core Orders API — no Supabase/DbWriteGate.
 */
export async function persistRemoveItem(context: EffectContext): Promise<void> {
  const { entityId, itemId } = context;
  const restaurantId = (context as any).restaurantId;
  Logger.info("[Sovereignty] Projecting Item Removal...", { entityId, itemId });

  const result = await removeOrderItem(entityId, itemId, restaurantId);

  if (result.error) {
    Logger.error("[Sovereignty] Item Removal Failed", result.error);
    throw new Error(`Item Removal Failed: ${result.error.message}`);
  }
}

/**
 * Persist Item Quantity Update (Law 1)
 * Write only via Core Orders API — no Supabase/DbWriteGate.
 */
export async function persistUpdateItemQty(
  context: EffectContext
): Promise<void> {
  const { entityId, itemId, quantity, unitPriceCents } = context;
  const restaurantId = (context as any).restaurantId;
  Logger.info("[Sovereignty] Projecting Item Update...", {
    entityId,
    itemId,
    quantity,
  });

  const result = await updateOrderItemQty({
    order_id: entityId,
    item_id: itemId,
    restaurant_id: restaurantId,
    quantity,
    unit_price_cents: unitPriceCents,
  });

  if (result.error) {
    Logger.error("[Sovereignty] Item Update Failed", result.error);
    throw new Error(`Item Update Failed: ${result.error.message}`);
  }
}

/**
 * Persist Order Status Change (Law 1)
 * Maps Kernel Transitions (FINALIZE, MARK_READY, SERVE) to DB Status.
 * Write only via Core RPC update_order_status — no Supabase/DbWriteGate.
 */
export async function persistOrderStatus(
  context: EffectContext
): Promise<void> {
  const { entityId, targetStatus } = context;
  const restaurantId = (context as any).restaurantId;

  if (!targetStatus) {
    throw new Error(
      "[Sovereignty] Missing targetStatus for Status Persistence"
    );
  }

  Logger.info("[Sovereignty] Projecting Status Change...", {
    entityId,
    targetStatus,
  });

  const result = await updateOrderStatus({
    order_id: entityId,
    restaurant_id: restaurantId,
    new_status: targetStatus,
  });

  if (result.error) {
    Logger.error("[Sovereignty] Status Projection Failed", result.error);
    throw new Error(`Status Projection Failed: ${result.error.message}`);
  }
}

/**
 * Persist Payment (Law 1 - Financial)
 * Wraps PaymentEngine to ensure Kernel is the Authority for Transactions.
 */
import { PaymentEngine } from "../tpv/PaymentEngine"; // Dynamic Import to avoid cycles? No, static is fine here.

export async function persistPayment(context: EffectContext): Promise<void> {
  const {
    entityId,
    amountCents,
    method,
    metadata,
    restaurantId,
    cashRegisterId,
    idempotencyKey,
    isPartial,
  } = context;

  if (!amountCents || !method || !restaurantId || !cashRegisterId) {
    throw new Error(
      "[Sovereignty] Missing Payment Details for Kernel Transaction"
    );
  }

  Logger.info("[Sovereignty] Processing Sovereign Payment...", {
    entityId,
    amountCents,
  });

  // Use PaymentEngine (Legacy/Robust) to execute the DB Transaction
  // This maintains all current validations (Split Payment, Idempotency, etc)

  if (isPartial) {
    await PaymentEngine.processSplitPayment({
      orderId: entityId,
      restaurantId,
      cashRegisterId,
      amountCents,
      method,
      metadata,
      idempotencyKey,
    });
  } else {
    await PaymentEngine.processPayment({
      orderId: entityId,
      restaurantId,
      cashRegisterId,
      amountCents,
      method,
      metadata,
      idempotencyKey,
    });
  }
}
