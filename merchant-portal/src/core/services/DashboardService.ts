
import { supabase } from '../supabase';

export interface DailyMetrics {
    totalSalesCents: number;
    totalOrders: number;
    avgTicketCents: number;
    totalCostCents: number; // NEW
    salesByHour: { hour: number; totalCents: number }[];
}

// ... (interfaces)
export interface LowStockItem {
    id: string;
    name: string;
    stockLevel: number;
    minStockLevel: number;
}

export class DashboardService {
    /**
     * Get Daily Metrics for Dashboard
     * 
     * Calls RPC `get_daily_metrics` which aggregates data at SQL level.
     */
    static async getDailyMetrics(restaurantId: string): Promise<DailyMetrics> {
        // DEMO MODE MOCK
        if (restaurantId === 'mock-tenant-id' || restaurantId === 'demo-id') {
            return {
                totalSalesCents: 1545000, // 15,450.00
                totalOrders: 42,
                avgTicketCents: 3678, // 36.78
                totalCostCents: 450000,
                salesByHour: [
                    { hour: 11, totalCents: 120000 },
                    { hour: 12, totalCents: 450000 },
                    { hour: 13, totalCents: 890000 },
                ]
            };
        }

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
            totalCostCents: data.total_cost_cents || 0,
            salesByHour: (data.sales_by_hour || []).map((item: any) => ({
                hour: item.hour,
                totalCents: item.total_cents
            })),
        };
    }

    /**
     * Get Low Stock Items
     * Calls RPC `get_low_stock_items`
     */
    static async getLowStockItems(restaurantId: string): Promise<LowStockItem[]> {
        // DEMO MODE MOCK
        if (restaurantId === 'demo-id') {
            return [
                { id: '1', name: 'Leite Integral', stockLevel: 2, minStockLevel: 10 },
                { id: '2', name: 'Limão Siciliano', stockLevel: 0, minStockLevel: 5 },
                { id: '3', name: 'Whisky Black Label', stockLevel: 1, minStockLevel: 3 },
            ];
        }

        const { data, error } = await supabase.rpc('get_low_stock_items', {
            p_restaurant_id: restaurantId,
        });

        if (error) {
            console.error('[DashboardService] Failed to fetch low stock items:', error);
            throw error; // Or return []
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            stockLevel: item.stock_level,
            minStockLevel: item.min_stock_level
        }));
    }

    /**
     * Restock Item
     * Calls RPC `restock_item`
     */
    static async restockItem(itemId: string, quantity: number): Promise<boolean> {
        const { data, error } = await supabase.rpc('restock_item', {
            p_item_id: itemId,
            p_quantity: quantity
        });

        if (error) {
            console.error('[DashboardService] Failed to restock item:', error);
            throw error;
        }

        return data;
    }
    /**
     * Get Shift Forecast (AI Simulation)
     * Returns hourly predicted sales vs actual sales.
     */
    static async getShiftForecast(restaurantId: string): Promise<{ hour: number; expected: number; actual: number }[]> {
        // AI ENGINE MOCK (Simulating a Bell Curve for Lunch 12-14 and Dinner 19-21)
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return hours.map(hour => {
            let expected = 1000; // Base baseline (10 EUR)

            // Lunch Rush Simulation (Peak @ 13h)
            if (hour >= 11 && hour <= 15) {
                expected += 5000 * Math.exp(-Math.pow(hour - 13, 2) / 2);
            }

            // Dinner Rush Simulation (Peak @ 20h)
            if (hour >= 18 && hour <= 23) {
                expected += 12000 * Math.exp(-Math.pow(hour - 20, 2) / 3);
            }

            // Add some randomness noise
            expected = Math.floor(expected + (Math.random() * 1000));

            return {
                hour,
                expected,
                actual: 0 // Will be merged with real metrics in the UI or Service
            };
        });
    }
}
