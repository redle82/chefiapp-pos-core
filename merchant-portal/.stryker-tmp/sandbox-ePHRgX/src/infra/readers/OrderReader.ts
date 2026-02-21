/**
 * OrderReader — Leituras de pedidos e itens do Core (gm_orders, gm_order_items).
 * Usa dockerCoreClient (Core Docker) como fonte de verdade.
 */
// @ts-nocheck


import { dockerCoreClient } from "../docker-core/connection";
import type { CoreOrder, CoreOrderItem } from "../docker-core/types";

/** Linha de pedido ativo (gm_orders). ActiveOrderRow = CoreOrder para compatibilidade. */
export type ActiveOrderRow = CoreOrder;

/**
 * Pedidos ativos do restaurante (exclui PAID/CANCELLED/CLOSED; status OPEN, IN_PREP, READY).
 */
export async function readActiveOrders(
  restaurantId: string,
): Promise<ActiveOrderRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .not("status", "in", "(PAID,CANCELLED,CLOSED)")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ActiveOrderRow[];
}

/**
 * Itens de um pedido (gm_order_items).
 * Station: usa o snapshot do item; se null, usa station do produto (para pedidos antigos ou produtos BAR).
 * Anti-regressão: docs/contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md §4 — não remover join gm_products nem fallback.
 */
export async function readOrderItems(
  orderId: string,
): Promise<CoreOrderItem[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_order_items")
    .select("*, gm_products(station)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) return [];
  const rows = (data ?? []) as (CoreOrderItem & {
    gm_products?: { station?: string | null } | null;
  })[];
  return rows.map((row) => {
    const { gm_products: product, ...item } = row;
    const raw = (item.station ?? product?.station ?? "KITCHEN")
      ?.toString()
      .toUpperCase();
    const station = raw === "BAR" ? "BAR" : "KITCHEN";
    return { ...item, station } as CoreOrderItem;
  });
}

/**
 * Data de criação do último pedido do restaurante (para sensor de ociosidade).
 */
export async function getLastOrderCreatedAt(
  restaurantId: string,
): Promise<string | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { created_at: string }).created_at ?? null;
}

/**
 * Pedido por ID.
 */
export async function readOrderById(
  orderId: string,
): Promise<CoreOrder | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CoreOrder;
}

/**
 * Pedidos em estado READY (prontos para entrega).
 */
export async function readReadyOrders(
  restaurantId: string,
): Promise<ActiveOrderRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "READY")
    .order("ready_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ActiveOrderRow[];
}

/**
 * Pedidos para analytics (período implícito; limit para performance).
 */
export async function readOrdersForAnalytics(
  restaurantId: string,
  limit: number = 1000,
): Promise<CoreOrder[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as CoreOrder[];
}
