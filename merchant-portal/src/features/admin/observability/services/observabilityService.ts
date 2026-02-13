/**
 * ObservabilityService — Métricas mínimas para painel interno (admin only)
 *
 * Fase 2 (1000-ready). Query Discipline: todas as queries scoped por restaurant_id.
 */

import { getErrorsLast24hCount as getErrorsLast24hCountFromStore } from "../../../../core/observability/errorsStore";
import { getAverageLatencyMs as getAverageLatencyMsFromStore } from "../../../../core/observability/latencyStore";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getTodayStartEnd(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Conta pedidos criados hoje para o restaurante.
 * Usa query limitada + filtro em JS (fetch client não expõe count exact nem gte/lte).
 * Limite 1000: se houver mais pedidos hoje, o número fica truncado.
 */
export async function getOrdersCreatedTodayCount(
  restaurantId: string,
): Promise<number> {
  if (!UUID_REGEX.test(restaurantId)) return 0;

  const { start: todayStart, end: todayEnd } = getTodayStartEnd();
  const todayStartMs = todayStart.getTime();
  const todayEndMs = todayEnd.getTime();

  const { data, error } = await dockerCoreClient
    .from("gm_orders")
    .select("id,created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || !Array.isArray(data)) return 0;

  const count = (data as { id: string; created_at: string }[]).filter((o) => {
    const t = o?.created_at ? new Date(o.created_at).getTime() : 0;
    return t >= todayStartMs && t < todayEndMs;
  }).length;

  return count;
}

/**
 * Conta erros/avisos nas últimas 24h para o restaurante (in-memory, esta sessão).
 * Síncrono; usado pelo painel de observabilidade.
 */
export function getErrorsLast24hCount(restaurantId: string): number {
  return getErrorsLast24hCountFromStore(restaurantId);
}

/**
 * Média simples de latência (create_order_atomic) para o restaurante (in-memory, última 50 amostras).
 * Síncrono; usado pelo painel de observabilidade.
 */
export function getAverageLatencyMs(
  restaurantId: string,
  operation?: string,
): number {
  return getAverageLatencyMsFromStore(
    restaurantId,
    operation ?? "create_order_atomic",
  );
}
