/**
 * ORDER READER DIRECT — Leitura direta via fetch (Core PostgREST)
 *
 * ⚠️ LEGADO - DEPRECADO
 *
 * FASE 3.5: Este arquivo foi substituído por OrderReader.ts (usa dockerCoreClient)
 *
 * NÃO USAR EM NOVO CÓDIGO.
 * Use OrderReader.ts em vez disso.
 *
 * Mantido apenas para referência histórica.
 */

import type { CoreOrder, CoreOrderItem } from "../docker-core/types";

import { CONFIG } from "../../config";

const DOCKER_CORE_URL = CONFIG.CORE_URL;
const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;

/**
 * Lê pedidos ativos de um restaurante (versão direta via fetch).
 */
export async function readActiveOrdersDirect(
  restaurantId: string,
): Promise<CoreOrder[]> {
  // PostgREST syntax: status=in.(OPEN,IN_PREP,READY) ou usar múltiplos filtros
  // Usando filtro OR para status
  const url = `${DOCKER_CORE_URL}/gm_orders?select=*&restaurant_id=eq.${restaurantId}&or=(status.eq.OPEN,status.eq.IN_PREP,status.eq.READY)&order=created_at.desc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to read orders: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  return (data || []) as CoreOrder[];
}

/**
 * Lê itens de um pedido (versão direta via fetch).
 */
export async function readOrderItemsDirect(
  orderId: string,
): Promise<CoreOrderItem[]> {
  const url = `${DOCKER_CORE_URL}/gm_order_items?select=*&order_id=eq.${orderId}&order=created_at.asc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to read order items: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  return (data || []) as CoreOrderItem[];
}

/**
 * Lê pedido completo com itens (versão direta via fetch).
 */
export async function readOrderWithItemsDirect(
  orderId: string,
): Promise<(CoreOrder & { items: CoreOrderItem[] }) | null> {
  // Ler pedido
  const orderUrl = `${DOCKER_CORE_URL}/gm_orders?select=*&id=eq.${orderId}`;
  const orderResponse = await fetch(orderUrl, {
    method: "GET",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!orderResponse.ok) {
    throw new Error(
      `Failed to read order: ${orderResponse.status} ${orderResponse.statusText}`,
    );
  }

  const orderData = await orderResponse.json();
  if (!orderData || orderData.length === 0) {
    return null;
  }

  const order = orderData[0] as CoreOrder;
  const items = await readOrderItemsDirect(orderId);

  return {
    ...order,
    items,
  };
}
