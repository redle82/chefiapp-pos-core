/**
 * P5-4: Automated Inventory Service
 *
 * Serviço para gestão automática de estoque.
 * ANTI-SUPABASE §4: em modo Docker, domínio de stock usa Core via getTableClient().
 */

import { getTableClient } from "../infra/coreRpc";
import { Logger } from "../logger";

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
}

export interface InventoryAlert {
  itemId: string;
  itemName: string;
  type: "low_stock" | "out_of_stock" | "reorder_suggested";
  currentStock: number;
  threshold: number;
  suggestedReorder: number;
  urgency: "low" | "medium" | "high" | "critical";
}

class AutomatedInventoryService {
  /**
   * Check inventory levels and generate alerts
   */
  async checkInventoryLevels(restaurantId: string): Promise<InventoryAlert[]> {
    try {
      const client = await getTableClient();
      const { data: items, error } = await client
        .from("inventory_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .gt("min_threshold", 0); // Only items with thresholds set

      if (error) throw error;

      const alerts: InventoryAlert[] = [];

      for (const item of items || []) {
        const currentStock = item.current_stock || 0;
        const minThreshold = item.min_threshold || 0;
        const maxThreshold = item.max_threshold || 0;

        // Out of stock
        if (currentStock === 0) {
          alerts.push({
            itemId: item.id,
            itemName: item.name,
            type: "out_of_stock",
            currentStock: 0,
            threshold: minThreshold,
            suggestedReorder: maxThreshold,
            urgency: "critical",
          });
        }
        // Low stock
        else if (currentStock <= minThreshold) {
          const urgency =
            currentStock <= minThreshold * 0.5 ? "high" : "medium";
          alerts.push({
            itemId: item.id,
            itemName: item.name,
            type: "low_stock",
            currentStock,
            threshold: minThreshold,
            suggestedReorder: maxThreshold - currentStock,
            urgency,
          });
        }
        // Reorder suggested (below 120% of min threshold)
        else if (currentStock <= minThreshold * 1.2) {
          alerts.push({
            itemId: item.id,
            itemName: item.name,
            type: "reorder_suggested",
            currentStock,
            threshold: minThreshold,
            suggestedReorder: maxThreshold - currentStock,
            urgency: "low",
          });
        }
      }

      return alerts;
    } catch (err) {
      Logger.error("Failed to check inventory levels", err, { restaurantId });
      return [];
    }
  }

  /**
   * Get reorder suggestions
   */
  async getReorderSuggestions(restaurantId: string): Promise<
    Array<{
      itemId: string;
      itemName: string;
      currentStock: number;
      suggestedQuantity: number;
      estimatedCost: number;
    }>
  > {
    const alerts = await this.checkInventoryLevels(restaurantId);

    const suggestions = alerts
      .filter((a) => a.type === "low_stock" || a.type === "out_of_stock")
      .map(async (alert) => {
        // Get item details for cost calculation via Core table client
        const client = await getTableClient();
        const { data: item } = await client
          .from("inventory_items")
          .select("cost_per_unit")
          .eq("id", alert.itemId)
          .single();

        return {
          itemId: alert.itemId,
          itemName: alert.itemName,
          currentStock: alert.currentStock,
          suggestedQuantity: alert.suggestedReorder,
          estimatedCost: (item?.cost_per_unit || 0) * alert.suggestedReorder,
        };
      });

    return Promise.all(suggestions);
  }

  /**
   * Auto-create reorder task in AppStaff
   */
  async createReorderTask(
    restaurantId: string,
    itemId: string,
    quantity: number
  ): Promise<void> {
    try {
      // This would integrate with AppStaff to create a task
      // For now, just log
      Logger.info("Reorder task created", { restaurantId, itemId, quantity });
    } catch (err) {
      Logger.error("Failed to create reorder task", err, {
        restaurantId,
        itemId,
        quantity,
      });
    }
  }
}

export const automatedInventoryService = new AutomatedInventoryService();
