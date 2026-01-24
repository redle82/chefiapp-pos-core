/**
 * useRealtimeMetrics - Métricas operacionais em tempo real
 * 
 * Atualiza automaticamente via Supabase Realtime quando pedidos mudam.
 * Ideal para Dashboard com métricas do turno/dia atual.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../core/supabase';
import { getTabIsolated } from '../core/storage/TabIsolatedStorage';

export interface RealtimeMetrics {
  // KPIs principais
  totalRevenue: number;        // Receita total (euros)
  totalOrders: number;         // Total de pedidos
  averageTicket: number;       // Ticket médio (euros)
  ordersPerHour: number;       // Média de pedidos/hora
  
  // Operacional
  openOrders: number;          // Pedidos abertos (não finalizados)
  avgPrepTime: number;         // Tempo médio de preparo (minutos)
  
  // Por hora (últimas 12h)
  hourlyOrders: Record<number, number>;
  hourlyRevenue: Record<number, number>;
  
  // Comparação
  vsYesterdayRevenue: number;  // % comparado com ontem
  vsYesterdayOrders: number;   // % comparado com ontem
  
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
  const channelRef = useRef<any>(null);

  // Calcula métricas a partir dos pedidos
  const calculateMetrics = useCallback(async () => {
    try {
      const restaurantId = getTabIsolated('chefiapp_restaurant_id');
      if (!restaurantId) {
        setError('Restaurant ID not found');
        setLoading(false);
        return;
      }

      // Definir período (hoje desde 00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // 1. Buscar pedidos de HOJE
      const { data: todayOrders, error: todayError } = await supabase
        .from('gm_orders')
        .select('id, total_amount, created_at, status, payment_status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .neq('status', 'cancelled');

      if (todayError) throw todayError;

      // 2. Buscar pedidos de ONTEM (para comparação)
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from('gm_orders')
        .select('id, total_amount')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())
        .neq('status', 'cancelled');

      if (yesterdayError) throw yesterdayError;

      // 3. Calcular métricas
      const orders = todayOrders || [];
      const yOrders = yesterdayOrders || [];

      // Revenue & Orders
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;
      const totalOrders = orders.length;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Open orders (not PAID, DELIVERED, or CANCELLED)
      const openOrders = orders.filter(o => 
        !['PAID', 'DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status?.toUpperCase() || '')
      ).length;

      // Orders per hour (média desde abertura)
      const now = new Date();
      const hoursOpen = Math.max(1, (now.getTime() - today.getTime()) / (1000 * 60 * 60));
      const ordersPerHour = totalOrders / hoursOpen;

      // Hourly breakdown
      const hourlyOrders: Record<number, number> = {};
      const hourlyRevenue: Record<number, number> = {};
      
      orders.forEach(o => {
        const hour = new Date(o.created_at).getHours();
        hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
        hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + ((o.total_amount || 0) / 100);
      });

      // Comparação com ontem
      const yRevenue = yOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;
      const yOrderCount = yOrders.length;

      const vsYesterdayRevenue = yRevenue > 0 
        ? ((totalRevenue - yRevenue) / yRevenue) * 100 
        : (totalRevenue > 0 ? 100 : 0);
      
      const vsYesterdayOrders = yOrderCount > 0 
        ? ((totalOrders - yOrderCount) / yOrderCount) * 100 
        : (totalOrders > 0 ? 100 : 0);

      // TODO: Calcular avgPrepTime quando tivermos timestamps de preparo
      const avgPrepTime = 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        averageTicket,
        ordersPerHour: Math.round(ordersPerHour * 10) / 10,
        openOrders,
        avgPrepTime,
        hourlyOrders,
        hourlyRevenue,
        vsYesterdayRevenue: Math.round(vsYesterdayRevenue),
        vsYesterdayOrders: Math.round(vsYesterdayOrders),
        lastUpdated: new Date(),
        isLive: true,
      });

      setLoading(false);
      setError(null);

    } catch (err: any) {
      console.error('[useRealtimeMetrics] Error:', err);
      setError(err.message || 'Failed to fetch metrics');
      setLoading(false);
    }
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    const restaurantId = getTabIsolated('chefiapp_restaurant_id');
    if (!restaurantId) return;

    // Initial fetch
    calculateMetrics();

    // Subscribe to order changes
    channelRef.current = supabase
      .channel('realtime_metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gm_orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => {
        // Recalculate on any order change
        calculateMetrics();
      })
      .subscribe();

    // Polling fallback (every 30s) for reliability
    const interval = setInterval(calculateMetrics, 30000);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
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
