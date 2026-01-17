/**
 * P5-2: Predictive Analytics Service
 * 
 * Serviço para analytics preditivo e previsões
 */

import { supabase } from '../supabase';
import { Logger } from '../logger';

export interface DemandForecast {
    date: string;
    predictedOrders: number;
    predictedRevenue: number;
    confidence: number; // 0-100
    factors: string[];
}

export interface InventoryForecast {
    itemId: string;
    itemName: string;
    currentStock: number;
    predictedDaysUntilStockout: number;
    suggestedReorderDate: string;
    suggestedQuantity: number;
}

export interface StaffForecast {
    date: string;
    predictedDemand: 'low' | 'medium' | 'high' | 'very_high';
    suggestedStaffCount: number;
    peakHours: number[];
}

class PredictiveAnalyticsService {
    /**
     * Forecast demand for next N days
     */
    async forecastDemand(restaurantId: string, days: number = 7): Promise<DemandForecast[]> {
        try {
            // Get historical data
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30); // Last 30 days

            const { data: orders, error } = await supabase
                .from('gm_orders')
                .select('created_at, total_cents')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', startDate.toISOString())
                .neq('status', 'cancelled');

            if (error) throw error;

            // Simple moving average forecast
            const forecasts: DemandForecast[] = [];
            const dailyData = new Map<string, { orders: number; revenue: number }>();

            for (const order of orders || []) {
                const date = new Date(order.created_at).toISOString().split('T')[0];
                if (!dailyData.has(date)) {
                    dailyData.set(date, { orders: 0, revenue: 0 });
                }
                const day = dailyData.get(date)!;
                day.orders++;
                day.revenue += order.total_cents;
            }

            // Calculate averages
            const avgOrders = Array.from(dailyData.values()).reduce((sum, d) => sum + d.orders, 0) / dailyData.size;
            const avgRevenue = Array.from(dailyData.values()).reduce((sum, d) => sum + d.revenue, 0) / dailyData.size;

            // Generate forecasts
            for (let i = 1; i <= days; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];

                // Simple forecast with day-of-week adjustment
                const dayOfWeek = date.getDay();
                const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;

                forecasts.push({
                    date: dateStr,
                    predictedOrders: Math.round(avgOrders * weekendMultiplier),
                    predictedRevenue: Math.round(avgRevenue * weekendMultiplier),
                    confidence: 70, // Simple model = lower confidence
                    factors: [
                        `Historical average: ${avgOrders.toFixed(1)} orders/day`,
                        dayOfWeek === 0 || dayOfWeek === 6 ? 'Weekend (higher demand expected)' : 'Weekday',
                    ],
                });
            }

            return forecasts;
        } catch (err) {
            Logger.error('Failed to forecast demand', err, { restaurantId });
            return [];
        }
    }

    /**
     * Forecast inventory needs
     */
    async forecastInventory(restaurantId: string): Promise<InventoryForecast[]> {
        try {
            // Get inventory items and usage
            const { data: items, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (error) throw error;

            // Get usage from last 30 days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            // This would need integration with order items to calculate usage
            // For now, return placeholder forecasts
            const forecasts: InventoryForecast[] = [];

            for (const item of items || []) {
                const currentStock = item.current_stock || 0;
                const dailyUsage = 10; // Placeholder - should calculate from actual usage
                const daysUntilStockout = dailyUsage > 0 ? Math.floor(currentStock / dailyUsage) : 999;

                forecasts.push({
                    itemId: item.id,
                    itemName: item.name,
                    currentStock,
                    predictedDaysUntilStockout: daysUntilStockout,
                    suggestedReorderDate: new Date(Date.now() + (daysUntilStockout - 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    suggestedQuantity: item.max_threshold || currentStock * 2,
                });
            }

            return forecasts;
        } catch (err) {
            Logger.error('Failed to forecast inventory', err, { restaurantId });
            return [];
        }
    }

    /**
     * Forecast staff needs
     */
    async forecastStaff(restaurantId: string, days: number = 7): Promise<StaffForecast[]> {
        const demandForecasts = await this.forecastDemand(restaurantId, days);
        
        return demandForecasts.map(forecast => {
            let predictedDemand: 'low' | 'medium' | 'high' | 'very_high';
            let suggestedStaffCount: number;

            if (forecast.predictedOrders < 20) {
                predictedDemand = 'low';
                suggestedStaffCount = 2;
            } else if (forecast.predictedOrders < 40) {
                predictedDemand = 'medium';
                suggestedStaffCount = 3;
            } else if (forecast.predictedOrders < 60) {
                predictedDemand = 'high';
                suggestedStaffCount = 4;
            } else {
                predictedDemand = 'very_high';
                suggestedStaffCount = 5;
            }

            // Peak hours typically 12-14 and 19-21
            const peakHours = [12, 13, 19, 20, 21];

            return {
                date: forecast.date,
                predictedDemand,
                suggestedStaffCount,
                peakHours,
            };
        });
    }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
