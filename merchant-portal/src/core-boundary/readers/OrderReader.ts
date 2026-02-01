/**
 * ORDER READER — Adaptador de Leitura do Core (Read-Only)
 *
 * FASE 1: Contrato do Core (Leitura)
 *
 * REGRAS:
 * - Apenas leitura (read-only)
 * - Não cria nada
 * - Não altera estado
 * - Usa core-boundary/docker-core/connection.ts
 */

import { dockerCoreClient } from "../docker-core/connection";
import type { CoreOrder, CoreOrderItem } from "../docker-core/types";

/**
 * Lê pedidos ativos de um restaurante.
 *
 * @param restaurantId ID do restaurante
 * @returns Lista de pedidos com status OPEN, IN_PREP ou READY
 */
export async function readActiveOrders(
  restaurantId: string,
): Promise<CoreOrder[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read orders: ${error.message}`);
  }

  const rows = (data || []) as CoreOrder[];
  // Filtro em memória para status ativos, já que o cliente PostgREST simplificado
  // ainda não suporta `.in(...)` diretamente.
  const ACTIVE_STATUSES: Array<CoreOrder["status"]> = [
    "OPEN",
    "IN_PREP",
    "READY",
  ];
  return rows.filter((o) => ACTIVE_STATUSES.includes(o.status));
}

/**
 * Lê um pedido específico por ID.
 *
 * @param orderId ID do pedido
 * @returns Pedido ou null se não encontrado
 */
export async function readOrderById(
  orderId: string,
): Promise<CoreOrder | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw new Error(`Failed to read order: ${error.message}`);
  }

  return data as CoreOrder;
}

/**
 * Lê itens de um pedido.
 *
 * @param orderId ID do pedido
 * @returns Lista de itens do pedido
 */
export async function readOrderItems(
  orderId: string,
): Promise<CoreOrderItem[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to read order items: ${error.message}`);
  }

  return (data || []) as CoreOrderItem[];
}

const ANALYTICS_ORDERS_LIMIT = 1000;

/**
 * Lê pedidos recentes para métricas/analytics (sem filtro de status).
 * Usado por useRealtimeMetrics para calcular receita, totais e comparação com ontem.
 *
 * @param restaurantId ID do restaurante
 * @param limit Máximo de pedidos (default 1000)
 * @returns Lista de pedidos ordenados por created_at desc
 */
export async function readOrdersForAnalytics(
  restaurantId: string,
  limit: number = ANALYTICS_ORDERS_LIMIT,
): Promise<CoreOrder[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to read orders for analytics: ${error.message}`);
  }

  return (data || []) as CoreOrder[];
}

/**
 * Lê pedido completo (pedido + itens).
 *
 * @param orderId ID do pedido
 * @returns Pedido com itens ou null se não encontrado
 */
export async function readOrderWithItems(
  orderId: string,
): Promise<(CoreOrder & { items: CoreOrderItem[] }) | null> {
  const order = await readOrderById(orderId);
  if (!order) {
    return null;
  }

  const items = await readOrderItems(orderId);

  return {
    ...order,
    items,
  };
}
