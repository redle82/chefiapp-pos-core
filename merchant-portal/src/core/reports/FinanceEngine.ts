import { supabase } from '../supabase';

export interface FinanceSnapshot {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    paymentMethods: Record<string, number>;
    hourlySales: Record<string, number>;
    totalCost: number; // New
    grossMargin: number; // New
}

export const FinanceEngine = {
    /**
     * Get a snapshot of finances for a specific date range (default: today).
     */
    async getDailySnapshot(tenantId: string, startDate?: Date, endDate?: Date): Promise<FinanceSnapshot> {
        if (tenantId === 'mock-tenant-id' || tenantId === 'demo-id') {
            return {
                date: new Date().toISOString().split('T')[0],
                totalRevenue: 15450,
                totalOrders: 42,
                averageTicket: 36.78,
                paymentMethods: { 'credit': 10000, 'cash': 5450 },
                hourlySales: { '12': 5000, '13': 8000, '20': 2450 },
                totalCost: 4500,
                grossMargin: 10950
            };
        }

        const start = startDate || new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate || new Date();
        end.setHours(23, 59, 59, 999);

        // Call RPC for server-side aggregation
        const { data, error } = await supabase.rpc('get_sales_analytics', {
            p_restaurant_id: tenantId,
            p_start_date: start.toISOString(),
            p_end_date: end.toISOString()
        });

        if (error) {
            console.error('FinanceEngine: Failed to fetch sales analytics', error);
            throw error;
        }

        return {
            date: start.toISOString().split('T')[0],
            totalRevenue: (data.totalRevenue || 0) / 100,
            totalOrders: data.totalOrders || 0,
            averageTicket: (data.averageTicket || 0) / 100,
            paymentMethods: data.paymentMethods || {},
            hourlySales: data.hourlySales || {},
            totalCost: (data.totalCost || 0) / 100,
            grossMargin: (data.grossMargin || 0) / 100
        };
    },

    /**
     * Get Stripe Financials (Balance & Payouts) via Edge Function
     */
    async getStripeFinancials(tenantId: string): Promise<{ balance: any, payouts: any[] }> {
        if (tenantId === 'mock-tenant-id' || tenantId === 'demo-id') {
            return { balance: { available: 500000, pending: 15000, currency: 'eur' }, payouts: [] };
        }

        const { data, error } = await supabase.functions.invoke('stripe-reports', {
            body: {
                action: 'get-financials',
                restaurantId: tenantId
            }
        });

        if (error) {
            console.error('FinanceEngine: Failed to fetch Stripe financials', error);
            // Return empty structure on failure to not break UI
            return { balance: { available: 0, pending: 0, currency: 'eur' }, payouts: [] };
        }

        return data;
    },

    /**
     * Get Sales Forecast from Analytics Engine
     */
    async getSalesForecast(tenantId: string): Promise<{ historical: any[], forecast: any[], model: any }> {
        const { data, error } = await supabase.functions.invoke('analytics-engine', {
            body: {
                action: 'forecast-sales',
                restaurantId: tenantId,
                daysToForecast: 7
            }
        });

        if (error) {
            console.error('FinanceEngine: Failed to fetch forecast', error);
            return { historical: [], forecast: [], model: {} };
        }

        return data;
    },

    /**
     * Get Staff Performance Metrics
     */
    async getStaffPerformance(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
        const start = startDate || new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate || new Date();
        end.setHours(23, 59, 59, 999);

        const { data: orders, error } = await supabase
            .from('gm_orders')
            .select('id, total_amount, operator_id, created_at, status')
            .eq('restaurant_id', tenantId)
            .neq('status', 'CANCELLED')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (error) {
            console.error('FinanceEngine: Failed to fetch staff performance', error);
            return [];
        }

        // Aggregate by Operator
        const staffStats: Record<string, { id: string, name: string, orders: number, revenue: number }> = {};

        orders?.forEach(o => {
            const opId = o.operator_id || 'unknown';
            if (!staffStats[opId]) {
                staffStats[opId] = {
                    id: opId,
                    name: opId === 'unknown' ? 'Não Atribuído' : `Staff ${opId.substring(0, 4)}...`, // Placeholder until we have name lookup
                    orders: 0,
                    revenue: 0
                };
            }
            staffStats[opId].orders += 1;
            staffStats[opId].revenue += (o.total_amount || 0);
        });

        // Try to fetch real names if we have a table for it (Simulated for now)
        // In "The Empire", we would join with gm_worker_profiles

        return Object.values(staffStats).sort((a, b) => b.revenue - a.revenue);
    },

    /**
     * Close the Day (Z-Report)
     * Atomically calculates totals, closes turns, and creates a snapshot.
     */
    async closeDay(tenantId: string, countedCash: number, notes?: string): Promise<{ id: string, gross: number, cash_diff: number }> {
        const { data, error } = await supabase.rpc('close_day', {
            p_restaurant_id: tenantId,
            p_counted_cash: countedCash,
            p_notes: notes || null
        });

        if (error) {
            console.error('FinanceEngine: Failed to close day', error);
            throw error;
        }

        return data; // { id, gross, cash_diff }
    },

    /**
     * Get Z-Report details by ID
     */
    async getZReport(id: string): Promise<any> {
        const { data, error } = await supabase
            .from('gm_daily_closings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
};
