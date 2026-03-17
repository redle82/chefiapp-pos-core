/**
 * OrderWriter — Criação de pedidos e marcação de itens (Core RPC / gm_orders).
 */

import { createOrderAtomic } from "../../core/infra/CoreOrdersApi";
import { dockerCoreClient } from "../docker-core/connection";
import { occupyTableForOrder } from "./TableWriter";

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

/** Informação de mesa para associar ao pedido. */
export interface OrderTableInfo {
  tableId: string;
  tableNumber: number;
}

/**
 * Cria pedido atómico no Core (RPC create_order_atomic).
 * O Core persiste sync_metadata.origin; KDS/AppStaff exibem badge "WEB" quando origin === "WEB_PUBLIC".
 * Se tableInfo fornecido, table_id e table_number são incluídos em sync_metadata
 * (o RPC extrai e persiste em gm_orders) e a mesa é automaticamente ocupada.
 * Contrato: PUBLIC_WEB_ORDER_FLOW_CONTRACT.md
 */
export async function createOrder(
  restaurantId: string,
  items: OrderItemInput[],
  origin: string = "CAIXA",
  paymentMethod: string = "cash",
  syncMetadata?: Record<string, unknown>,
  tableInfo?: OrderTableInfo | null,
): Promise<CreateOrderResult> {
  const sync: Record<string, unknown> = {
    ...(syncMetadata ?? {}),
    origin,
  };

  // Inject table info into sync_metadata — RPC extracts table_id/table_number from here
  if (tableInfo) {
    sync.table_id = tableInfo.tableId;
    sync.table_number = tableInfo.tableNumber;
  }

  const params = {
    p_restaurant_id: restaurantId,
    p_items: items.map((i) => ({
      product_id: i.product_id,
      name: i.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    p_payment_method: paymentMethod,
    p_sync_metadata: sync,
  };
  const { data, error } = await createOrderAtomic(params);
  if (error) throw new Error(error.message ?? "Falha ao criar pedido");
  if (!data?.id) throw new Error("Core não devolveu id do pedido");

  // Auto-occupy table (fire-and-forget, non-blocking)
  if (tableInfo) {
    occupyTableForOrder(tableInfo.tableId, restaurantId).catch(() => {});
  }

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
