
import { supabase } from './supabase';
import { Order } from '@/context/OrderContext';

export class InventoryService {

    /**
     * Deducts stock based on the recipes of items in a completed order.
     * @param order The completed order
     */
    static async deductStockForOrder(order: Order): Promise<void> {
        if (!order.items || order.items.length === 0) return;

        // console.log(`[InventoryService] Processing stock deduction for Order #${order.id}`);

        // 1. Get all menu_item_ids from the order
        const menuItemIds = order.items.map(i => i.productId).filter(Boolean) as string[];

        if (menuItemIds.length === 0) {
            // console.log('[InventoryService] No valid product IDs in order.');
            return;
        }

        // 2. Fetch recipes for these items
        const { data: recipes, error } = await supabase
            .from('gm_recipes')
            .select('*')
            .in('menu_item_id', menuItemIds);

        if (error) {
            console.error('[InventoryService] Failed to fetch recipes', error);
            // Critical: Should we throw or just log? For MVP, log. 
            // In strict mode, this might block payment, but let's be safe.
            return;
        }

        if (!recipes || recipes.length === 0) {
            // console.log('[InventoryService] No recipes found for items in this order.');
            return;
        }

        // 3. Calculate total deduction per inventory item
        const deductions: Record<string, number> = {};

        order.items.forEach(orderItem => {
            const itemRecipes = recipes.filter((r: any) => r.menu_item_id === orderItem.productId);

            itemRecipes.forEach((recipe: any) => {
                // column name confirmed: quantity_required
                const qtyRequired = Number(recipe.quantity_required) || 0;
                const totalQty = qtyRequired * orderItem.quantity;

                if (!deductions[recipe.inventory_item_id]) {
                    deductions[recipe.inventory_item_id] = 0;
                }
                deductions[recipe.inventory_item_id] += totalQty;
            });
        });

        const deductionEntries = Object.entries(deductions);
        if (deductionEntries.length === 0) return;

        // console.log(`[InventoryService] Deducting stock for ${deductionEntries.length} items.`);

        // 4. Update Inventory & create movements
        // Sequential loop for safety (Supabase RPC would be better for atomicity)
        for (const [inventoryId, qty] of deductionEntries) {
            await InventoryService.updateStock(inventoryId, qty * -1, 'SALE', `Order #${order.table || order.id.slice(0, 4)}`);
        }
    }

    /**
     * Updates stock level and records a movement.
     */
    private static async updateStock(
        itemId: string,
        delta: number,
        type: 'IN' | 'OUT' | 'WASTE' | 'SALE',
        reason?: string
    ): Promise<void> {
        try {
            // 1. Get current stock
            const { data: item, error: fetchError } = await supabase
                .from('gm_inventory_items')
                .select('stock_quantity')
                .eq('id', itemId)
                .single();

            if (fetchError || !item) {
                console.error(`[InventoryService] Item ${itemId} not found for deduction.`);
                return;
            }

            const currentStock = Number(item.stock_quantity) || 0;
            const newStock = currentStock + delta;

            // 2. Update Item
            const { error: updateError } = await supabase
                .from('gm_inventory_items')
                .update({
                    stock_quantity: newStock,
                    updated_at: new Date().toISOString()
                })
                .eq('id', itemId);

            if (updateError) throw updateError;

            // 3. Log Movement
            const { error: moveError } = await supabase
                .from('gm_stock_movements')
                .insert({
                    inventory_item_id: itemId,
                    type,
                    quantity: Math.abs(delta), // Store absolute magnitude
                    reason,
                    created_at: new Date().toISOString()
                    // created_by: handled by Supabase default or trigger if set? 
                    // Migration has: created_by UUID REFERENCES auth.users(id)
                    // If RLS is on, Supabase might not auto-set created_by unless implicit default or trigger.
                    // We can rely on RLS/Postgres to capture user or leave null if not critical.
                });

            if (moveError) console.error('[InventoryService] Failed to log movement', moveError);

        } catch (e) {
            console.error('[InventoryService] Update Stock Error', e);
        }
    }
}
