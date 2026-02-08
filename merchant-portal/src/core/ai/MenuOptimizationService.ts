// LEGACY / LAB — blocked in Docker mode via core/supabase shim
/**
 * P5-1: AI Menu Optimization Service
 *
 * Serviço para otimização de menu usando análise de dados
 */

import { Logger } from "../logger";
import { supabase } from "../supabase";

export interface MenuItemAnalysis {
  itemId: string;
  name: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  popularity: number; // 0-100
  recommendation: "promote" | "maintain" | "review" | "remove";
}

export interface PriceSuggestion {
  itemId: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  expectedImpact: {
    salesChange: number; // percentage
    revenueChange: number; // percentage
  };
}

class MenuOptimizationService {
  /**
   * Analyze menu items for profitability
   */
  async analyzeMenuItems(
    restaurantId: string,
    days: number = 30,
  ): Promise<MenuItemAnalysis[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get order items with sales data
      const { data: orderItems, error } = await supabase
        .from("gm_order_items")
        .select(
          `
                    product_id,
                    product_name,
                    quantity,
                    total_price,
                    order:gm_orders!inner(
                        restaurant_id,
                        created_at
                    )
                `,
        )
        .eq("order.restaurant_id", restaurantId)
        .gte("order.created_at", startDate.toISOString());

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<
        string,
        {
          name: string;
          salesCount: number;
          revenue: number;
        }
      >();

      for (const item of orderItems || []) {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            name: item.product_name || "Unknown",
            salesCount: 0,
            revenue: 0,
          });
        }

        const product = productMap.get(productId)!;
        product.salesCount += item.quantity;
        product.revenue += item.total_price;
      }

      // Get product costs (would need cost data in database)
      const analyses: MenuItemAnalysis[] = [];

      for (const [productId, data] of productMap.entries()) {
        // Estimate cost (20% of revenue as default - should come from actual cost data)
        const estimatedCost = data.revenue * 0.2;
        const profit = data.revenue - estimatedCost;
        const profitMargin =
          data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

        // Calculate popularity (relative to top seller)
        const maxSales = Math.max(
          ...Array.from(productMap.values()).map((p) => p.salesCount),
        );
        const popularity =
          maxSales > 0 ? (data.salesCount / maxSales) * 100 : 0;

        // Generate recommendation
        let recommendation: "promote" | "maintain" | "review" | "remove";
        if (profitMargin > 30 && popularity > 50) {
          recommendation = "promote";
        } else if (profitMargin > 20 && popularity > 30) {
          recommendation = "maintain";
        } else if (profitMargin < 10 || popularity < 10) {
          recommendation = "remove";
        } else {
          recommendation = "review";
        }

        analyses.push({
          itemId: productId,
          name: data.name,
          salesCount: data.salesCount,
          revenue: data.revenue,
          cost: estimatedCost,
          profit,
          profitMargin,
          popularity,
          recommendation,
        });
      }

      return analyses.sort((a, b) => b.profit - a.profit);
    } catch (err) {
      Logger.error("Failed to analyze menu items", err, { restaurantId });
      return [];
    }
  }

  /**
   * Suggest optimal prices based on demand and cost
   */
  async suggestPrices(restaurantId: string): Promise<PriceSuggestion[]> {
    const analyses = await this.analyzeMenuItems(restaurantId);
    const suggestions: PriceSuggestion[] = [];

    for (const analysis of analyses) {
      // Simple pricing logic: adjust based on profit margin and popularity
      let suggestedPrice = analysis.revenue / analysis.salesCount;
      let reason = "";

      if (analysis.profitMargin < 20 && analysis.popularity > 50) {
        // High popularity, low margin - increase price
        suggestedPrice *= 1.1;
        reason =
          "High demand, low margin - increase price to improve profitability";
      } else if (analysis.profitMargin > 40 && analysis.popularity < 30) {
        // Low popularity, high margin - decrease price
        suggestedPrice *= 0.9;
        reason = "Low demand, high margin - decrease price to boost sales";
      } else {
        // Maintain current price
        reason = "Optimal balance - maintain current price";
      }

      suggestions.push({
        itemId: analysis.itemId,
        currentPrice: analysis.revenue / analysis.salesCount,
        suggestedPrice: Math.round(suggestedPrice),
        reason,
        expectedImpact: {
          salesChange: analysis.popularity > 50 ? 5 : -5,
          revenueChange: analysis.profitMargin < 20 ? 10 : -5,
        },
      });
    }

    return suggestions;
  }
}

export const menuOptimizationService = new MenuOptimizationService();
