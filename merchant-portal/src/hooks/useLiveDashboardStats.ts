/**
 * useLiveDashboardStats — Dados ao vivo para o Manager Dashboard
 *
 * Combina:
 *  - useRealtimeMetrics: pedidos abertos, receita e ordens de hoje (polling 30s via OrderReader)
 *  - useDailyMetrics: agregados via RPC get_daily_metrics (totais do dia, ticket médio)
 *
 * Arquitetura seguida: "Core is Sovereign" — Docker Core medeia todos os acessos.
 * Fallback gracioso se backend indisponível: retorna shape vazio sem erro fatal.
 */

import { useMemo } from "react";
import type { SystemState } from "../core/lifecycle/LifecycleState";
import { useDailyMetrics } from "./useDailyMetrics";
import { useRealtimeMetrics } from "./useRealtimeMetrics";

export interface DashboardStats {
  /** Receita total do dia em euros */
  totalRevenueTodayEur: number;
  /** Número de pedidos fechados hoje */
  totalOrdersToday: number;
  /** Ticket médio em euros */
  averageTicketEur: number;
  /** Pedidos ativos agora (OPEN, PREPARING, READY) */
  openOrders: number;
  /** Pedidos por hora (média hoje) */
  ordersPerHour: number;
  /** Variação vs. ontem em % (receita) */
  vsYesterdayRevenuePct: number;
  /** Variação vs. ontem em % (pedidos) */
  vsYesterdayOrdersPct: number;
  /** Status operacional geral */
  operationalStatus: "healthy" | "warning" | "critical";
  /** Se o sistema está recebendo dados em tempo real */
  isLive: boolean;
  /** Última atualização */
  lastUpdated: Date;
}

function deriveOperationalStatus(
  openOrders: number,
): "healthy" | "warning" | "critical" {
  if (openOrders >= 15) return "critical";
  if (openOrders >= 8) return "warning";
  return "healthy";
}

export function useLiveDashboardStats(
  restaurantId: string | null,
  systemState: SystemState = "SETUP",
) {
  const {
    metrics,
    loading: loadingRealtime,
    error: errorRealtime,
    refresh: refreshRealtime,
  } = useRealtimeMetrics();

  const {
    data: rpcData,
    loading: loadingRpc,
    error: errorRpc,
    refresh: refreshRpc,
  } = useDailyMetrics(restaurantId, systemState);

  const stats: DashboardStats = useMemo(() => {
    // Prefere dados do RPC (mais autoritativo: agrega CLOSED) quando disponíveis,
    // com fallback para os dados calculados localmente pelo OrderReader.
    const totalRevenue =
      rpcData != null ? rpcData.total_sales_cents / 100 : metrics.totalRevenue;

    const totalOrders =
      rpcData != null ? rpcData.total_orders : metrics.totalOrders;

    const avgTicket =
      rpcData != null ? rpcData.avg_ticket_cents / 100 : metrics.averageTicket;

    return {
      totalRevenueTodayEur: totalRevenue,
      totalOrdersToday: totalOrders,
      averageTicketEur: avgTicket,
      openOrders: metrics.openOrders,
      ordersPerHour: metrics.ordersPerHour,
      vsYesterdayRevenuePct: metrics.vsYesterdayRevenue,
      vsYesterdayOrdersPct: metrics.vsYesterdayOrders,
      operationalStatus: deriveOperationalStatus(metrics.openOrders),
      isLive: metrics.isLive,
      lastUpdated: metrics.lastUpdated,
    };
  }, [metrics, rpcData]);

  const loading = loadingRealtime || loadingRpc;
  const error = errorRealtime || errorRpc;

  function refresh() {
    refreshRealtime();
    refreshRpc();
  }

  return { stats, loading, error, refresh };
}
