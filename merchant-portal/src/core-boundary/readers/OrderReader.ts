/**
 * ORDER READER — Adaptador de Leitura do Core (Read-Only)
 *
 * Contrato: ORDER_STATUS_CONTRACT_v1.
 * - ACTIVE: OPEN, PREPARING, IN_PREP, READY (KDS mostra).
 * - TERMINAL: SERVED, CANCELLED, FAILED, ARCHIVED, CLOSED (KDS não mostra).
 * - UNKNOWN: qualquer outro valor; mostrado no KDS com badge e log canónico.
 * UNKNOWN não é ACTIVE; é exibido por segurança operacional; nunca entra em métricas de produção.
 */

import { dockerCoreClient } from "../docker-core/connection";
import type { CoreOrder, CoreOrderItem } from "../docker-core/types";
import { Logger } from "../../core/logger";

/** Status que o KDS deve mostrar (pedido ainda ativo). Ver ORDER_STATUS_CONTRACT_v1. */
export const ACTIVE_ORDER_STATUSES = [
  "OPEN",
  "PREPARING",
  "IN_PREP",
  "READY",
] as const;

/** Status terminais (KDS não mostra). Inclui CLOSED (legacy alias de SERVED). */
const TERMINAL_ORDER_STATUSES = new Set([
  "SERVED",
  "CANCELLED",
  "FAILED",
  "ARCHIVED",
  "CLOSED",
]);

const ACTIVE_SET = new Set(ACTIVE_ORDER_STATUSES.map((s) => s));

/** Throttle canonical log to at most once per 5s per "call" to avoid console spam from polling. */
const ORDER_READER_LOG_INTERVAL_MS = 5000;
let _lastOrderReaderLogTime = 0;

// Relaxed: accepts any UUID-shaped string (including seed UUIDs like 00000000-...).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pedido com flag opcional para status desconhecido (KDS mostra com badge). */
export type ActiveOrderRow = CoreOrder & { _unknownStatus?: boolean };

function normalizeStatus(raw: unknown): string {
  if (raw == null || raw === "") return "";
  return String(raw).toUpperCase().trim();
}

/** Log canónico para status desconhecido (parte do contrato, não opcional). OBSERVABILITY_LOGGING_CONTRACT. */
function logUnknownStatus(
  orderId: string,
  rawStatus: unknown,
  restaurantId: string,
): void {
  const raw = rawStatus != null ? String(rawStatus) : "";
  Logger.warn("[ORDER_STATUS_CONTRACT] status desconhecido", {
    restaurant_id: restaurantId,
    order_id: orderId,
    raw_status: raw,
    normalized_status: "UNKNOWN",
    source: "OrderReader",
  });
}

/**
 * Lê pedidos activos + desconhecidos de um restaurante (para KDS).
 *
 * Inclui ACTIVE e UNKNOWN; exclui TERMINAL e CREATED.
 * UNKNOWN aparece com _unknownStatus: true (KDS mostra badge).
 *
 * @param restaurantId ID do restaurante
 * @returns Lista de pedidos a mostrar no KDS (activos ou desconhecidos)
 */
export async function readActiveOrders(
  restaurantId: string,
): Promise<ActiveOrderRow[]> {
  if (!UUID_REGEX.test(restaurantId)) {
    if (import.meta.env.DEV) {
      console.debug(
        "[OrderReader] Skipped: restaurantId is not a valid UUID:",
        restaurantId,
      );
    }
    return [];
  }
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    const msg = error.message ?? "";
    const isTrialFallback =
      msg.includes("invalid input syntax for type uuid") ||
      (error as { code?: string }).code === "22P02" ||
      msg.includes("Backend indisponível");
    if (isTrialFallback) {
      if (import.meta.env.DEV) {
        console.debug(
          "[OrderReader] gm_orders fallback (trial/local id):",
          msg.slice(0, 80),
        );
      }
      return [];
    }
    throw new Error(`Failed to read orders: ${msg}`);
  }

  const rows = (data || []) as CoreOrder[];
  const result: ActiveOrderRow[] = [];

  for (const o of rows) {
    const raw = o?.status;
    const s = normalizeStatus(raw);

    if (!s) {
      result.push({ ...o, _unknownStatus: true });
      logUnknownStatus(o.id, raw, restaurantId);
      continue;
    }

    if (ACTIVE_SET.has(s as (typeof ACTIVE_ORDER_STATUSES)[number])) {
      result.push({ ...o, status: o.status });
      continue;
    }

    if (TERMINAL_ORDER_STATUSES.has(s) || s === "CREATED") {
      continue;
    }

    result.push({ ...o, _unknownStatus: true });
    logUnknownStatus(o.id, raw, restaurantId);
  }

  if (import.meta.env.DEV && rows.length > 0) {
    const now = Date.now();
    if (now - _lastOrderReaderLogTime >= ORDER_READER_LOG_INTERVAL_MS) {
      _lastOrderReaderLogTime = now;
      const activeCount = result.filter((r) => !r._unknownStatus).length;
      const unknownCount = result.filter((r) => r._unknownStatus).length;
      Logger.debug("[OrderReader] gm_orders summary", {
        restaurant_id: restaurantId,
        rows: rows.length,
        active: activeCount,
        unknown: unknownCount,
      });
    }
  }
  return result;
}

/**
 * Lê pedidos READY (prontos, ainda não SERVED) para a tela "Agora" / Orders Lite.
 * Entrega = marcar SERVED via update_order_status.
 */
export async function readReadyOrders(
  restaurantId: string,
): Promise<ActiveOrderRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "READY")
    .order("created_at", { ascending: false });

  if (error) {
    const msg = error.message ?? "";
    const isTrialFallback =
      msg.includes("invalid input syntax for type uuid") ||
      (error as { code?: string }).code === "22P02" ||
      msg.includes("Backend indisponível");
    if (isTrialFallback) {
      if (import.meta.env.DEV) {
        console.debug(
          "[OrderReader] gm_orders ready fallback (trial/local id):",
          msg.slice(0, 80),
        );
      }
      return [];
    }
    throw new Error(`Failed to read ready orders: ${msg}`);
  }

  const rows = (data || []) as CoreOrder[];
  return rows.map((o) => ({
    ...o,
    _unknownStatus: false,
  })) as ActiveOrderRow[];
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

/**
 * Obtém a data/hora do último pedido criado no restaurante (qualquer status).
 * Usado pelo sensor de ociosidade (CONTRATO_DE_ATIVIDADE_OPERACIONAL) para calcular
 * "tempo desde último pedido".
 *
 * @param restaurantId ID do restaurante
 * @returns Data do último pedido (created_at) ou null se não houver pedidos
 */
export async function getLastOrderCreatedAt(
  restaurantId: string,
): Promise<Date | null> {
  if (!UUID_REGEX.test(restaurantId)) return null;
  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read last order: ${error.message}`);
  }

  if (!data?.created_at) return null;
  return new Date(data.created_at);
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
