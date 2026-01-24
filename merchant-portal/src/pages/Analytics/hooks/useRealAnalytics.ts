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
    totalCost: number; // em euros (COGS)
    grossMargin: number; // em euros
    totalOrders: number;
    averageTicket: number; // em euros
    topProducts: Array<{
        product_id: string;
        name: string;
        quantity: number;
        revenue: number; // em euros
        cost: number; // em euros
    }>;
    peakHours: Record<number, number>; // hora -> quantidade de pedidos
    paymentMethods: Record<string, number>; // método -> total em euros
}

export interface ProductPerformance {
    id: string;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
}

export function useRealAnalytics(startDate: Date, endDate: Date) {
    const [data, setData] = useState<DailyAnalytics[]>([]);
    const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
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

                // 1. Buscar pedidos no período
                const { data: orders, error: ordersError } = await supabase
                    .from('gm_orders')
                    .select(`
                        id,
                        total_amount,
                        created_at,
                        status,
                        payment_status,
                        payment_method,
                        items:gm_order_items(
                            product_id,
                            product_name,
                            quantity,
                            total_price
                        )
                    `)
                    .eq('restaurant_id', restaurantId)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString())
                    .neq('status', 'cancelled')
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;

                // 2. Coletar Product IDs unicos para buscar receitas
                const productIds = new Set<string>();
                orders?.forEach(o => o.items?.forEach((i: any) => i.product_id && productIds.add(i.product_id)));

                // 3. Buscar Receitas + Custos (somente dos produtos vendidos)
                let productCosts: Record<string, number> = {};
                if (productIds.size > 0) {
                    const { data: recipes } = await supabase
                        .from('gm_recipes')
                        .select(`
                            menu_item_id,
                            quantity,
                            inventory_item:gm_inventory_items(cost_per_unit)
                        `)
                        .in('menu_item_id', Array.from(productIds));

                    if (recipes) {
                        recipes.forEach((r: any) => {
                            if (!productCosts[r.menu_item_id]) productCosts[r.menu_item_id] = 0;
                            // Cost = Quantity * CostPerUnit (cents)
                            const cost = (r.quantity || 0) * (r.inventory_item?.cost_per_unit || 0);
                            productCosts[r.menu_item_id] += cost;
                        });
                    }
                }

                // 4. Agrupar por dia E por Produto (Global)
                const dailyMap = new Map<string, DailyAnalytics>();
                const productMap = new Map<string, ProductPerformance>();

                for (const order of orders || []) {
                    const orderDate = new Date(order.created_at).toISOString().split('T')[0];

                    if (!dailyMap.has(orderDate)) {
                        dailyMap.set(orderDate, {
                            date: orderDate,
                            totalRevenue: 0,
                            totalCost: 0,
                            grossMargin: 0,
                            totalOrders: 0,
                            averageTicket: 0,
                            topProducts: [],
                            peakHours: {},
                            paymentMethods: {},
                        });
                    }

                    const day = dailyMap.get(orderDate)!;
                    const orderTotal = (order.total_amount || 0) / 100;
                    day.totalRevenue += orderTotal;
                    day.totalOrders += 1;

                    // Peak hours
                    const hour = new Date(order.created_at).getHours();
                    day.peakHours[hour] = (day.peakHours[hour] || 0) + 1;

                    // Payment methods (fallback to cash)
                    const method = (order as any).payment_method || 'cash';
                    day.paymentMethods[method] = (day.paymentMethods[method] || 0) + orderTotal;

                    // Process Items for COGS, Top Products (Daily) and Product Performance (Global)
                    if (order.items && Array.isArray(order.items)) {
                        for (const item of order.items) {
                            const qty = item.quantity || 1;
                            const revenue = (item.total_price || 0) / 100;
                            const costCents = (productCosts[item.product_id] || 0) * qty;
                            const cost = costCents / 100;

                            // Daily Tracking
                            day.totalCost += cost;

                            const existingDaily = day.topProducts.find(p => p.product_id === item.product_id);
                            if (existingDaily) {
                                existingDaily.quantity += qty;
                                existingDaily.revenue += revenue;
                                existingDaily.cost += cost;
                            } else {
                                day.topProducts.push({
                                    product_id: item.product_id || 'unknown',
                                    name: item.product_name || 'Item',
                                    quantity: qty,
                                    revenue: revenue,
                                    cost: cost
                                });
                            }

                            // Global Product Tracking (Menu Engineering)
                            const pId = item.product_id || 'unknown';
                            if (!productMap.has(pId)) {
                                productMap.set(pId, {
                                    id: pId,
                                    name: item.product_name || 'Item',
                                    totalQuantity: 0,
                                    totalRevenue: 0,
                                    totalCost: 0,
                                    grossMargin: 0
                                });
                            }
                            const pPerf = productMap.get(pId)!;
                            pPerf.totalQuantity += qty;
                            pPerf.totalRevenue += revenue;
                            pPerf.totalCost += cost;
                            pPerf.grossMargin = pPerf.totalRevenue - pPerf.totalCost;
                        }
                    }
                }

                // Final calculations (Ticket, Margins, Sort)
                for (const day of dailyMap.values()) {
                    day.averageTicket = day.totalOrders > 0 ? day.totalRevenue / day.totalOrders : 0;
                    day.grossMargin = day.totalRevenue - day.totalCost;

                    day.topProducts.sort((a, b) => b.quantity - a.quantity);
                    day.topProducts = day.topProducts.slice(0, 10); // Top 10
                }

                const analyticsArray = Array.from(dailyMap.values()).sort(
                    (a, b) => a.date.localeCompare(b.date)
                );

                const performanceArray = Array.from(productMap.values()).sort(
                    (a, b) => b.totalRevenue - a.totalRevenue
                );

                setData(analyticsArray);
                setProductPerformance(performanceArray);

            } catch (err: any) {
                console.error('[useRealAnalytics] Error:', err);
                setError(err.message || 'Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [startDate, endDate]);

    return { data, productPerformance, loading, error };
}
