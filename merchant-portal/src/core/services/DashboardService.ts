
import { supabase } from '../supabase';

export interface DailyMetrics {
    totalSalesCents: number;
    totalOrders: number;
    avgTicketCents: number;
    salesByHour: { hour: number; totalCents: number }[];
}

export class DashboardService {
    /**
     * Get Daily Metrics for Dashboard
     * 
     * Calls RPC `get_daily_metrics` which aggregates data at SQL level.
     */
    static async getDailyMetrics(restaurantId: string): Promise<DailyMetrics> {
        const { data, error } = await supabase.rpc('get_daily_metrics', {
            p_restaurant_id: restaurantId,
        });

        if (error) {
            console.error('[DashboardService] Failed to fetch metrics:', error);
            throw new Error(`Failed to fetch metrics: ${error.message}`);
        }

        // Map snake_case from RPC to camelCase
        return {
            totalSalesCents: data.total_sales_cents || 0,
            totalOrders: data.total_orders || 0,
            avgTicketCents: data.avg_ticket_cents || 0,
            salesByHour: (data.sales_by_hour || []).map((item: any) => ({
                hour: item.hour,
                totalCents: item.total_cents
            })),
        };
    }
}
