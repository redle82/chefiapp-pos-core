/**
 * OrderWriter — Criação de pedidos e marcação de itens (Core RPC / gm_orders).
 */

import { createOrderAtomic } from "../../core/infra/CoreOrdersApi";
import { dockerCoreClient } from "../docker-core/connection";

export interface OrderItemInput {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderResult {
  id: string;
  total_cents: number;
  status: string;
}

/**
 * Cria pedido atómico no Core (RPC create_order_atomic).
 */
export async function createOrder(
  restaurantId: string,
  items: OrderItemInput[],
  origin: string = "CAIXA",
  paymentMethod: string = "cash",
  syncMetadata?: Record<string, unknown>
): Promise<CreateOrderResult> {
  const params = {
    p_restaurant_id: restaurantId,
    p_items: items.map((i) => ({
      product_id: i.product_id,
      name: i.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    p_payment_method: paymentMethod,
    p_sync_metadata: syncMetadata ?? null,
  };
  const { data, error } = await createOrderAtomic(params);
  if (error) throw new Error(error.message ?? "Falha ao criar pedido");
  if (!data?.id) throw new Error("Core não devolveu id do pedido");
  return {
    id: data.id,
    total_cents: data.total_cents ?? 0,
    status: data.status ?? "OPEN",
  };
}

/**
 * Marca item como pronto (RPC mark_item_ready). Retorna all_items_ready se o pedido passou a READY.
 */
export async function markItemReady(
  itemId: string,
  restaurantId: string
): Promise<{ all_items_ready: boolean }> {
  const out = await dockerCoreClient.rpc("mark_item_ready", {
    p_item_id: itemId,
    p_restaurant_id: restaurantId,
  });
  if (out.error) throw new Error(out.error.message ?? "Falha ao marcar item pronto");
  const data = out.data as { all_items_ready?: boolean } | null;
  return { all_items_ready: data?.all_items_ready ?? false };
}
