/**
 * useRealtimeMetrics - Métricas operacionais em tempo real
 *
 * DOCKER MODE: Métricas reais via OrderReader (gm_orders).
 * SUPABASE/OUTROS: Retorna métricas vazias (shape compatível com o dashboard).
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import {
  readActiveOrders,
  readOrdersForAnalytics,
} from "../infra/readers/OrderReader";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";

export interface RealtimeMetrics {
  // KPIs principais
  totalRevenue: number; // Receita total (euros)
  totalOrders: number; // Total de pedidos
  averageTicket: number; // Ticket médio (euros)
  ordersPerHour: number; // Média de pedidos/hora

  // Operacional
  openOrders: number; // Pedidos abertos (não finalizados)
  avgPrepTime: number; // Tempo médio de preparo (minutos)

  // Por hora (últimas 12h)
  hourlyOrders: Record<number, number>;
  hourlyRevenue: Record<number, number>;

  // Comparação
  vsYesterdayRevenue: number; // % comparado com ontem
  vsYesterdayOrders: number; // % comparado com ontem

  // Meta
  lastUpdated: Date;
  isLive: boolean;
}

const INITIAL_METRICS: RealtimeMetrics = {
  totalRevenue: 0,
  totalOrders: 0,
  averageTicket: 0,
  ordersPerHour: 0,
  openOrders: 0,
  avgPrepTime: 0,
  hourlyOrders: {},
  hourlyRevenue: {},
  vsYesterdayRevenue: 0,
  vsYesterdayOrders: 0,
  lastUpdated: new Date(),
  isLive: false,
};

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>(INITIAL_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcula métricas a partir dos pedidos
  const calculateMetrics = useCallback(async () => {
    try {
      const restaurantId = getTabIsolated("chefiapp_restaurant_id");
      if (!restaurantId) {
        setError("Restaurant ID not found");
        setLoading(false);
        return;
      }

      if (getBackendType() !== BackendType.docker) {
        setMetrics((prev) => ({
          ...INITIAL_METRICS,
          lastUpdated: new Date(),
          isLive: false,
        }));
        setLoading(false);
        setError(null);
        return;
      }

      const [orders, activeOrders] = await Promise.all([
        readOrdersForAnalytics(restaurantId),
        readActiveOrders(restaurantId),
      ]);

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const todayPaid = orders.filter(
        (o) =>
          new Date(o.created_at) >= startOfToday &&
          (o.status === "CLOSED" ||
            o.status === "READY" ||
            o.payment_status === "PAID"),
      );
      const yesterdayPaid = orders.filter((o) => {
        const created = new Date(o.created_at);
        return (
          created >= startOfYesterday &&
          created < startOfToday &&
          (o.status === "CLOSED" ||
            o.status === "READY" ||
            o.payment_status === "PAID")
        );
      });

      const totalRevenueToday =
        todayPaid.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
      const totalOrdersToday = todayPaid.length;
      const totalRevenueYesterday =
        yesterdayPaid.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
      const totalOrdersYesterday = yesterdayPaid.length;

      const hoursSinceStartOfDay =
        (now.getTime() - startOfToday.getTime()) / (1000 * 60 * 60);
      const ordersPerHour =
        hoursSinceStartOfDay > 0
          ? totalOrdersToday / Math.max(0.25, hoursSinceStartOfDay)
          : 0;

      const hourlyOrders: Record<number, number> = {};
      const hourlyRevenue: Record<number, number> = {};
      for (let h = 0; h < 12; h++) {
        const hourStart = new Date(now);
        hourStart.setHours(hourStart.getHours() - (11 - h), 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1, 0, 0, 0);
        const inHour = todayPaid.filter((o) => {
          const created = new Date(o.created_at).getTime();
          return created >= hourStart.getTime() && created < hourEnd.getTime();
        });
        hourlyOrders[h] = inHour.length;
        hourlyRevenue[h] =
          inHour.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
      }

      const vsYesterdayRevenue =
        totalRevenueYesterday > 0
          ? ((totalRevenueToday - totalRevenueYesterday) /
              totalRevenueYesterday) *
            100
          : 0;
      const vsYesterdayOrders =
        totalOrdersYesterday > 0
          ? ((totalOrdersToday - totalOrdersYesterday) / totalOrdersYesterday) *
            100
          : 0;

      setMetrics({
        totalRevenue: totalRevenueToday,
        totalOrders: totalOrdersToday,
        averageTicket:
          totalOrdersToday > 0 ? totalRevenueToday / totalOrdersToday : 0,
        ordersPerHour,
        openOrders: activeOrders.length,
        avgPrepTime: 0,
        hourlyOrders,
        hourlyRevenue,
        vsYesterdayRevenue,
        vsYesterdayOrders,
        lastUpdated: now,
        isLive: true,
      });
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error("[useRealtimeMetrics] Error:", err);
      setError(err.message || "Failed to fetch metrics");
      setLoading(false);
    }
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    const restaurantId = getTabIsolated("chefiapp_restaurant_id");
    if (!restaurantId) return;

    // Initial fetch
    calculateMetrics();

    // Polling (every 30s) enquanto não há Realtime ligado ao Core.
    const interval = setInterval(calculateMetrics, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [calculateMetrics]);

  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    calculateMetrics();
  }, [calculateMetrics]);

  return { metrics, loading, error, refresh };
}
