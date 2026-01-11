import { supabase } from '../supabase';

export interface FinanceSnapshot {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    paymentMethods: Record<string, number>;
    hourlySales: Record<number, number>;
}

export const FinanceEngine = {
    /**
     * Get a snapshot of finances for a specific date range (default: today).
     */
    async getDailySnapshot(tenantId: string, startDate?: Date, endDate?: Date): Promise<FinanceSnapshot> {
        const start = startDate || new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate || new Date();
        end.setHours(23, 59, 59, 999);

        // Fetch Payments (Source of Truth for Revenue)
        const { data: payments, error: paymentError } = await supabase
            .from('gm_payments')
            .select('amount_cents, method, created_at')
            .eq('restaurant_id', tenantId)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (paymentError) throw paymentError;

        // Fetch Orders (Source of Truth for Volume)
        const { data: orders, error: orderError } = await supabase
            .from('gm_orders') // Assuming orders table
            .select('id, created_at')
            .eq('restaurant_id', tenantId)
            .neq('status', 'CANCELLED') // Exclude cancelled
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (orderError) throw orderError;

        // Aggregations
        const totalRevenueCents = payments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;
        const totalOrders = orders?.length || 0;
        const averageTicketCents = totalOrders > 0 ? totalRevenueCents / totalOrders : 0;

        // Payment Methods Breakdown
        const paymentMethods: Record<string, number> = {};
        payments?.forEach(p => {
            paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount_cents;
        });

        // Hourly Sales
        const hourlySales: Record<number, number> = {};
        payments?.forEach(p => {
            const hour = new Date(p.created_at).getHours();
            hourlySales[hour] = (hourlySales[hour] || 0) + p.amount_cents;
        });

        return {
            date: start.toISOString().split('T')[0],
            totalRevenue: totalRevenueCents / 100, // Convert to float for UI convenience? Or keep cents? Let's use currency formatted in UI.
            totalOrders,
            averageTicket: averageTicketCents / 100,
            paymentMethods, // In cents
            hourlySales, // In cents
        };
    }
};
