/**
 * ShoppingListReader — Lista de compras baseada em estoque abaixo do mínimo.
 */
// @ts-nocheck


import { readStockAlerts } from "./InventoryStockReader";

export interface ShoppingListItem {
  ingredient_id: string;
  location_id: string;
  ingredient_name?: string;
  location_name?: string;
  qty: number;
  min_qty: number;
  suggested_qty?: number;
  unit?: string;
  current_qty?: number;
  deficit?: number;
  urgency?: "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";
}

export async function generateShoppingList(
  restaurantId: string,
): Promise<ShoppingListItem[]> {
  const alerts = await readStockAlerts(restaurantId);
  return alerts.map((a) => ({
    ingredient_id: a.ingredient_id,
    location_id: a.location_id,
    ingredient_name: a.ingredient_name,
    location_name: a.location_name,
    qty: Number(a.qty),
    min_qty: Number(a.min_qty),
    current_qty: Number(a.qty),
    deficit: Math.max(0, Number(a.min_qty) - Number(a.qty)),
    suggested_qty: Math.max(0, Number(a.min_qty) - Number(a.qty)),
    urgency: (() => {
      const deficit = Math.max(0, Number(a.min_qty) - Number(a.qty));
      if (deficit >= Number(a.min_qty)) return "CRITICAL";
      if (deficit > Number(a.min_qty) * 0.5) return "HIGH";
      if (deficit > 0) return "MEDIUM";
      return "NORMAL";
    })(),
  }));
}
