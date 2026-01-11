/**
 * useRealAnalytics - Hook para Analytics com dados reais do Supabase
 * 
 * Substitui mock data por queries reais
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../core/supabase';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';

export interface DailyAnalytics {
    date: string;
    totalRevenue: number; // em euros
    totalOrders: number;
    averageTicket: number; // em euros
    topProducts: Array<{
        product_id: string;
        name: string;
        quantity: number;
        revenue: number; // em euros
    }>;
    peakHours: Record<number, number>; // hora -> quantidade de pedidos
    paymentMethods: Record<string, number>; // método -> total em euros
}

export function useRealAnalytics(startDate: Date, endDate: Date) {
    const [data, setData] = useState<DailyAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);

            try {
                const restaurantId = getTabIsolated('chefiapp_restaurant_id');
                if (!restaurantId) {
                    setError('Restaurant ID not found');
                    setLoading(false);
                    return;
                }

                // Formatar datas
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                // Buscar pedidos no período
                const { data: orders, error: ordersError } = await supabase
                    .from('gm_orders')
                    .select(`
                        id,
                        total_cents,
                        created_at,
                        status,
                        items:gm_order_items(
                            product_id,
                            name_snapshot,
                            quantity,
                            subtotal_cents
                        )
                    `)
                    .eq('restaurant_id', restaurantId)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString())
                    .neq('status', 'cancelled')
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;

                // Agrupar por dia
                const dailyMap = new Map<string, DailyAnalytics>();

                for (const order of orders || []) {
                    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                    
                    if (!dailyMap.has(orderDate)) {
                        dailyMap.set(orderDate, {
                            date: orderDate,
                            totalRevenue: 0,
                            totalOrders: 0,
                            averageTicket: 0,
                            topProducts: [],
                            peakHours: {},
                            paymentMethods: {},
                        });
                    }

                    const day = dailyMap.get(orderDate)!;
                    day.totalRevenue += (order.total_cents || 0) / 100;
                    day.totalOrders += 1;

                    // Peak hours
                    const hour = new Date(order.created_at).getHours();
                    day.peakHours[hour] = (day.peakHours[hour] || 0) + 1;

                    // Payment methods (assumir cash se não especificado)
                    const method = (order as any).payment_method || 'cash';
                    day.paymentMethods[method] = (day.paymentMethods[method] || 0) + (order.total_cents || 0) / 100;

                    // Top products
                    if (order.items && Array.isArray(order.items)) {
                        for (const item of order.items) {
                            const existing = day.topProducts.find(p => p.product_id === item.product_id);
                            if (existing) {
                                existing.quantity += item.quantity || 1;
                                existing.revenue += (item.subtotal_cents || 0) / 100;
                            } else {
                                day.topProducts.push({
                                    product_id: item.product_id || 'unknown',
                                    name: item.name_snapshot || 'Item',
                                    quantity: item.quantity || 1,
                                    revenue: (item.subtotal_cents || 0) / 100,
                                });
                            }
                        }
                    }
                }

                // Calcular ticket médio e ordenar top products
                for (const day of dailyMap.values()) {
                    day.averageTicket = day.totalOrders > 0 ? day.totalRevenue / day.totalOrders : 0;
                    day.topProducts.sort((a, b) => b.quantity - a.quantity);
                    day.topProducts = day.topProducts.slice(0, 10); // Top 10
                }

                // Converter para array e ordenar por data
                const analyticsArray = Array.from(dailyMap.values()).sort(
                    (a, b) => a.date.localeCompare(b.date)
                );

                setData(analyticsArray);
            } catch (err: any) {
                console.error('[useRealAnalytics] Error:', err);
                setError(err.message || 'Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [startDate, endDate]);

    return { data, loading, error };
}
