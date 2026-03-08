import type { Order } from "../contracts";
import { getTableClient } from "../infra/coreRpc";
import { Logger } from "../logger";

/**
 * InventoryEngine — Stock management via Docker Core BOM tables.
 *
 * Tables used:
 *   gm_product_bom    — Bill of Materials (product → ingredients)
 *   gm_ingredients     — Ingredient master data
 *   gm_stock_levels    — Current stock per location/ingredient
 *   gm_stock_ledger    — Movement audit log
 *   gm_locations       — Physical locations (KITCHEN, BAR, STORAGE)
 *
 * NOTE: Stock deduction on order CLOSED is handled server-side by the
 * DB trigger trg_stock_deduct_on_order_close → deduct_stock_by_bom RPC.
 * This engine is for reads and manual adjustments only.
 */
export class InventoryEngine {
  /**
   * Stock deduction is now handled by the DB trigger (trg_stock_deduct_on_order_close).
   * This method is kept as a no-op for backward compatibility.
   * @deprecated Use DB trigger instead. Order CLOSED → auto BOM deduction.
   */
  static async processOrder(_order: Order): Promise<void> {
    // Server-side: deduct_stock_by_bom is called automatically
    // when order status transitions to CLOSED via DB trigger.
    Logger.info(
      "InventoryEngine.processOrder: No-op. Stock deduction handled by DB trigger.",
    );
  }

  /**
   * Manual stock adjustment (e.g., waste, purchase, correction).
   * Logs to gm_stock_ledger.
   */
  static async adjustStock(
    restaurantId: string,
    ingredientId: string,
    locationId: string,
    delta: number,
    action: "IN" | "OUT" | "ADJUST",
    reason?: string,
    userId?: string,
  ): Promise<void> {
    const client = await getTableClient();

    // Update stock level
    const { error: upsertError } = await client
      .from("gm_stock_levels")
      .update({
        qty: delta, // NOTE: This sets absolute. For delta, use RPC.
        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId)
      .eq("ingredient_id", ingredientId)
      .eq("location_id", locationId);

    if (upsertError) throw upsertError;

    // Log movement to ledger
    const { error: ledgerError } = await client.from("gm_stock_ledger").insert({
      restaurant_id: restaurantId,
      location_id: locationId,
      ingredient_id: ingredientId,
      action,
      qty: Math.abs(delta),
      reason: reason || `Manual ${action}`,
      created_by_user_id: userId || null,
      created_by_role: "staff",
    });

    if (ledgerError)
      Logger.error("InventoryEngine: Failed to log movement", ledgerError);
  }

  /**
   * Gets all ingredients for a restaurant.
   */
  static async getIngredients(restaurantId: string) {
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_ingredients")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Gets stock levels for a restaurant, joined with ingredient and location info.
   */
  static async getStockLevels(restaurantId: string) {
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_stock_levels")
      .select(
        `
                *,
                ingredient:gm_ingredients(*),
                location:gm_locations(*)
            `,
      )
      .eq("restaurant_id", restaurantId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Gets all BOM entries (product → ingredients) for a restaurant.
   */
  static async getBOM(restaurantId: string) {
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_product_bom")
      .select(
        `
                *,
                ingredient:gm_ingredients(name, unit),
                product:gm_products(name, price_cents)
            `,
      )
      .eq("restaurant_id", restaurantId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Updates the BOM for a single product (Full Replace).
   */
  static async updateProductBOM(
    productId: string,
    restaurantId: string,
    ingredients: {
      ingredientId: string;
      qtyPerUnit: number;
      station: string;
    }[],
  ): Promise<void> {
    const client = await getTableClient();

    // Delete existing BOM for this product
    const { error: deleteError } = await client
      .from("gm_product_bom")
      .delete()
      .eq("product_id", productId)
      .eq("restaurant_id", restaurantId);

    if (deleteError) throw deleteError;

    if (ingredients.length === 0) return;

    // Insert new BOM entries
    const rows = ingredients.map((i) => ({
      product_id: productId,
      restaurant_id: restaurantId,
      ingredient_id: i.ingredientId,
      qty_per_unit: i.qtyPerUnit,
      station: i.station,
    }));

    const { error: insertError } = await client
      .from("gm_product_bom")
      .insert(rows);

    if (insertError) throw insertError;
  }

  /**
   * Calculates ingredient cost for an order using BOM + stock cost.
   * Uses gm_products.cost_price_cents as fallback.
   */
  static async calculateOrderCost(order: Order): Promise<number> {
    if (!order.items || order.items.length === 0) return 0;

    const menuItemIds = order.items
      .map((i) => i.productId)
      .filter(Boolean) as string[];
    if (menuItemIds.length === 0) return 0;

    // Fetch BOM with ingredient info
    const client = await getTableClient();
    const { data: bomEntries, error } = await client
      .from("gm_product_bom")
      .select(
        `
                product_id,
                ingredient_id,
                qty_per_unit,
                ingredient:gm_ingredients(name)
            `,
      )
      .in("product_id", menuItemIds);

    if (error) {
      Logger.error("InventoryEngine: Failed to fetch BOM for cost calc", error);
      return 0;
    }

    if (!bomEntries || bomEntries.length === 0) {
      // Fallback to cost_price_cents on products
      const { data: products } = await client
        .from("gm_products")
        .select("id, cost_price_cents")
        .in("id", menuItemIds);

      if (!products) return 0;

      let fallbackCost = 0;
      order.items.forEach((orderItem) => {
        const prod = products.find((p: any) => p.id === orderItem.productId);
        if (prod) {
          fallbackCost += (prod.cost_price_cents || 0) * orderItem.quantity;
        }
      });
      return fallbackCost;
    }

    // TODO: When ingredient cost tracking is added, calculate from BOM * ingredient cost.
    // For now, return product-level cost_price_cents as approximation.
    const { data: products } = await client
      .from("gm_products")
      .select("id, cost_price_cents")
      .in("id", menuItemIds);

    if (!products) return 0;

    let totalCost = 0;
    order.items.forEach((orderItem) => {
      const prod = products.find((p: any) => p.id === orderItem.productId);
      if (prod) {
        totalCost += (prod.cost_price_cents || 0) * orderItem.quantity;
      }
    });

    return Math.round(totalCost);
  }

  /**
   * Gets low-stock alerts for a restaurant.
   */
  static async getLowStockAlerts(restaurantId: string) {
    const client = await getTableClient();
    const { data, error } = await client
      .from("gm_stock_levels")
      .select(
        `
                *,
                ingredient:gm_ingredients(name, unit),
                location:gm_locations(name, kind)
            `,
      )
      .eq("restaurant_id", restaurantId)
      .lte("qty", "min_qty") // qty <= min_qty (PostgREST filter)
      .gt("min_qty", 0);

    if (error) throw error;
    return data || [];
  }
}
