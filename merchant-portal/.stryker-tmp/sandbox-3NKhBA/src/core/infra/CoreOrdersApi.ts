/**
 * Core Orders API — Criação e atualização de pedidos via Core (Docker) exclusivamente.
 *
 * Contrato: CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md
 * Criação e escrita de pedidos (ordem, itens, quantidades, status) são soberania do Core.
 * UI chama esta API apenas. Backend único: Docker Core (PostgREST/RPC).
 *
 * Arquitetura Híbrida:
 * - Operações críticas (orders, payments) → coreClient (sempre Docker)
 * - Leituras/Analytics → analyticsClient (InsForge com fallback Docker)
 * - Este arquivo usa coreClient para garantir disponibilidade offline
 */
// @ts-nocheck


import { Logger } from "../logger";
import { addSample as latencyAddSample } from "../observability/latencyStore";
import { coreClient } from "./coreClient";
import { publishEvent } from "./eventBus";
import type {
  OrderCreatedEvent,
  OrderItemAddedEvent,
  OrderItemRemovedEvent,
  OrderStatusChangedEvent,
} from "./eventTypes";
import { createEvent } from "./eventTypes";

export type CreateOrderAtomicParams = {
  p_restaurant_id: string;
  p_items: Array<{
    product_id: string | null;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  p_payment_method?: string;
  p_sync_metadata?: Record<string, unknown>;
};

export type CreateOrderAtomicResult = {
  id: string;
  total_cents: number;
  status: string;
};

/** Payload para adicionar item a um pedido existente (schema gm_order_items). */
export type AddOrderItemParams = {
  order_id: string;
  restaurant_id: string;
  product_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  subtotal_cents: number;
  modifiers?: unknown[];
  notes?: string | null;
  category_name?: string | null;
  consumption_group_id?: string | null;
};

/** Payload para atualizar quantidade de um item (e subtotal). */
export type UpdateOrderItemQtyParams = {
  order_id: string;
  item_id: string;
  restaurant_id: string;
  quantity: number;
  unit_price_cents?: number;
};

/** Payload para atualizar status do pedido (RPC update_order_status). */
export type UpdateOrderStatusParams = {
  order_id: string;
  restaurant_id: string;
  new_status: string;
  /** Origem da transição (KDS, TPV, etc.) para auditabilidade. */
  origin?: string;
};

export type CoreOrdersApiResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

/**
 * Invoca create_order_atomic no Core (Docker). Backend único: Docker Core.
 * atomic transaction: create_order_atomic is the single write path for order creation.
 */
export async function createOrderAtomic(
  params: CreateOrderAtomicParams,
): Promise<CoreOrdersApiResult<CreateOrderAtomicResult>> {
  const normalized = {
    p_restaurant_id: params.p_restaurant_id,
    p_items: params.p_items,
    p_payment_method: params.p_payment_method ?? "cash",
    p_sync_metadata: params.p_sync_metadata ?? null,
  };

  const t0 = Date.now();
  const out = await coreClient.rpc("create_order_atomic", normalized);
  const durationMs = Date.now() - t0;
  latencyAddSample(params.p_restaurant_id, "create_order_atomic", durationMs);

  const data = out.data as CreateOrderAtomicResult | null;
  if (out.error) {
    return {
      data: null,
      error: {
        message: out.error.message,
        code: out.error.code,
      },
    };
  }
  if (!data?.id) {
    return {
      data: null,
      error: { message: "Core RPC did not return order id" },
    };
  }
  Logger.info("[CORE_ORDER_CONFIRM]", {
    order_id: data.id,
    restaurant_id: params.p_restaurant_id,
    total_cents: data.total_cents,
    status: data.status,
    timestamp: new Date().toISOString(),
    origin: "TPV",
  });

  // Publish event to Cognitive Layer (fire-and-forget)
  publishEvent(
    createEvent<OrderCreatedEvent>(
      "order.created",
      {
        orderId: data.id,
        tableId: "unknown", // TODO: pass table_id from params
        items: params.p_items.map((item) => ({
          productId: item.product_id ?? "custom",
          quantity: item.quantity,
          price: item.unit_price,
        })),
        totalAmount: data.total_cents / 100,
      },
      params.p_restaurant_id,
    ),
  ).catch((err) => {
    // Event publishing should never block Core operations
    Logger.warn("[EVENT_BUS] Failed to publish order.created", err);
  });

  return { data, error: null };
}

/**
 * Adiciona um item a um pedido existente. PostgREST INSERT em gm_order_items (Docker Core).
 * @legacy Viola imutabilidade pós-confirmação (FLUXO_DE_PEDIDO_OPERACIONAL). Mantido para compatibilidade; Fase 1 não usa após confirmação.
 */
export async function addOrderItem(
  params: AddOrderItemParams,
): Promise<CoreOrdersApiResult<{ id: string }>> {
  const row = {
    order_id: params.order_id,
    product_id: params.product_id,
    name_snapshot: params.name_snapshot,
    price_snapshot: params.price_snapshot,
    quantity: params.quantity,
    subtotal_cents: params.subtotal_cents,
    modifiers: params.modifiers ?? [],
    notes: params.notes ?? null,
  };

  // Use coreClient (always Docker)
  const out = await coreClient
    .from("gm_order_items")
    .insert(row)
    .select("id")
    .single();
  const data = out.data as { id: string } | null;
  if (out.error) {
    return {
      data: null,
      error: { message: out.error.message, code: out.error.code },
    };
  }
  if (!data?.id) {
    return {
      data: null,
      error: { message: "Core did not return item id" },
    };
  }

  // Publish event to Cognitive Layer (fire-and-forget)
  publishEvent(
    createEvent<OrderItemAddedEvent>(
      "order.item_added",
      {
        orderId: params.order_id,
        productId: params.product_id ?? "custom",
        quantity: params.quantity,
        price: params.price_snapshot,
      },
      params.restaurant_id,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish order.item_added", err);
  });

  return { data, error: null };
}

/**
 * Remove um item de um pedido. PostgREST DELETE em gm_order_items (Docker Core).
 * @legacy Viola imutabilidade pós-confirmação (FLUXO_DE_PEDIDO_OPERACIONAL). Mantido para compatibilidade; Fase 1 não usa após confirmação.
 */
export async function removeOrderItem(
  orderId: string,
  itemId: string,
  _restaurantId: string,
): Promise<CoreOrdersApiResult<null>> {
  // Use coreClient (always Docker)
  const out = await coreClient
    .from("gm_order_items")
    .delete()
    .eq("id", itemId)
    .eq("order_id", orderId);
  if (out.error) {
    return {
      data: null,
      error: { message: out.error.message, code: out.error.code },
    };
  }

  // Publish event to Cognitive Layer (fire-and-forget)
  publishEvent(
    createEvent<OrderItemRemovedEvent>(
      "order.item_removed",
      {
        orderId: orderId,
        productId: "unknown", // itemId is internal, not product_id
        quantity: 1, // We don't know quantity from delete, default to 1
      },
      _restaurantId,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish order.item_removed", err);
  });

  return { data: null, error: null };
}

/**
 * Atualiza quantidade (e subtotal) de um item. PostgREST PATCH em gm_order_items (Docker Core).
 * @legacy Viola imutabilidade pós-confirmação (FLUXO_DE_PEDIDO_OPERACIONAL). Mantido para compatibilidade; Fase 1 não usa após confirmação.
 */
export async function updateOrderItemQty(
  params: UpdateOrderItemQtyParams,
): Promise<CoreOrdersApiResult<null>> {
  const updates: Record<string, unknown> = { quantity: params.quantity };
  if (params.unit_price_cents !== undefined) {
    updates.subtotal_cents = params.unit_price_cents * params.quantity;
  }

  // Use coreClient (always Docker)
  const out = await coreClient
    .from("gm_order_items")
    .update(updates)
    .eq("id", params.item_id)
    .eq("order_id", params.order_id);
  if (out.error) {
    return {
      data: null,
      error: { message: out.error.message, code: out.error.code },
    };
  }
  return { data: null, error: null };
}

/**
 * Atualiza o status do pedido (RPC update_order_status no Core). Docker Core exclusivamente.
 */
export async function updateOrderStatus(
  params: UpdateOrderStatusParams,
): Promise<CoreOrdersApiResult<{ order_id: string; new_status: string }>> {
  const rpcParams = {
    p_order_id: params.order_id,
    p_restaurant_id: params.restaurant_id,
    p_new_status: params.new_status,
  };

  // Use coreClient (always Docker)
  const out = await coreClient.rpc("update_order_status", rpcParams);
  const data = out.data as { order_id: string; new_status: string } | null;
  if (out.error) {
    return {
      data: null,
      error: { message: out.error.message, code: out.error.code },
    };
  }
  if (!data?.order_id) {
    return {
      data: null,
      error: { message: "Core RPC did not return order_id" },
    };
  }
  Logger.info("[CORE_ORDER_STATUS]", {
    order_id: data.order_id,
    restaurant_id: params.restaurant_id,
    new_status: data.new_status,
    timestamp: new Date().toISOString(),
    origin: params.origin ?? "KDS",
  });

  // Publish event to Cognitive Layer (fire-and-forget)
  publishEvent(
    createEvent<OrderStatusChangedEvent>(
      "order.status_changed",
      {
        orderId: data.order_id,
        fromStatus: "unknown", // We don't track previous status in this call
        toStatus: data.new_status,
        reason: params.origin,
      },
      params.restaurant_id,
    ),
  ).catch((err) => {
    Logger.warn("[EVENT_BUS] Failed to publish order.status_changed", err);
  });

  return { data, error: null };
}
