/**
 * InventoryService — Gen 2 (Core RPCs)
 *
 * Stock deduction is now handled atomically via the Core BOM engine
 * (stock_bom_deduction_idempotent) which is triggered by create_order_atomic.
 *
 * This service now only exposes helpers for manual stock operations
 * via the apply_stock_movement RPC.
 *
 * @deprecated The old Gen 1 tables (gm_inventory_items, gm_stock_movements,
 * gm_recipes) are no longer used. All stock data lives in gm_stock_levels,
 * gm_stock_ledger, gm_product_bom, and gm_ingredients (Core).
 */

import { supabase } from "./supabase";

export class InventoryService {
  /**
   * @deprecated Automatic BOM deduction now happens inside create_order_atomic.
   * This method is a NO-OP kept for backwards compatibility during migration.
   */
  static async deductStockForOrder(_order: unknown): Promise<void> {
    console.warn(
      "[InventoryService] deductStockForOrder is deprecated — BOM deduction is now handled by Core.",
    );
    // No-op: Core handles this atomically via stock_bom_deduction_idempotent
  }

  /**
   * Apply a manual stock movement via the Core RPC.
   */
  static async applyMovement(params: {
    restaurantId: string;
    action: "IN" | "OUT" | "ADJUST" | "TRANSFER";
    ingredientId: string;
    locationId: string;
    qty: number;
    reason?: string;
    targetLocationId?: string;
    unitCost?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc("apply_stock_movement", {
        p_restaurant_id: params.restaurantId,
        p_action: params.action,
        p_ingredient_id: params.ingredientId,
        p_location_id: params.locationId,
        p_qty: params.qty,
        p_reason: params.reason ?? null,
        p_target_location_id: params.targetLocationId ?? null,
        p_unit_cost: params.unitCost ?? null,
      });

      if (error) {
        console.error("[InventoryService] applyMovement error", error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("[InventoryService] applyMovement exception", msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Lookup an ingredient by barcode via the Core RPC.
   */
  static async lookupBarcode(
    restaurantId: string,
    barcode: string,
  ): Promise<{
    found: boolean;
    ingredient_id?: string;
    name?: string;
    unit?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc(
        "lookup_ingredient_by_barcode",
        { p_restaurant_id: restaurantId, p_barcode: barcode },
      );
      if (error) return { found: false };
      return (data as any) ?? { found: false };
    } catch {
      return { found: false };
    }
  }
}
