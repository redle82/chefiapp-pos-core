import { getTableClient } from '../infra/coreOrSupabaseRpc';
import type { InventoryItem, Recipe } from '../../pages/Inventory/context/InventoryTypes';
import type { Order } from '../contracts';

export class InventoryEngine {

    /**
     * Deducts stock based on the recipes of items in a completed order.
     * @param order The completed order
     */
    static async processOrder(order: Order): Promise<void> {
        if (!order.items || order.items.length === 0) return;

        // 1. Get all menu_item_ids from the order
        const menuItemIds = order.items.map(i => i.productId).filter(Boolean) as string[];

        if (menuItemIds.length === 0) return;

        // 2. Fetch recipes for these items (Core quando Docker — Fase 4)
        const client = await getTableClient();
        const { data: recipes, error } = await client
            .from('gm_recipes')
            .select('*')
            .in('menu_item_id', menuItemIds);

        if (error) {
            console.error('InventoryEngine: Failed to fetch recipes', error);
            return;
        }

        if (!recipes || recipes.length === 0) return;

        // 3. Calculate total deduction per inventory item
        const deductions: Record<string, number> = {};

        order.items.forEach(orderItem => {
            const itemRecipes = recipes.filter((r: any) => r.menu_item_id === orderItem.productId);

            itemRecipes.forEach((recipe: any) => {
                const totalQty = recipe.quantity_required * orderItem.quantity;
                if (!deductions[recipe.inventory_item_id]) {
                    deductions[recipe.inventory_item_id] = 0;
                }
                deductions[recipe.inventory_item_id] += totalQty;
            });
        });

        // 4. Update Inventory & create movements (Sequentially or Batch RPC)
        // For simplicity/safety, we'll loop. An RPC 'batch_deduct' would be better for atomicity.
        for (const [inventoryId, qty] of Object.entries(deductions)) {
            await InventoryEngine.updateStock(inventoryId, qty * -1, 'SALE', `Order #${order.tableNumber || order.id.slice(0, 4)}`);
        }
    }

    /**
     * Updates stock level and records a movement.
     */
    static async updateStock(
        itemId: string,
        delta: number,
        type: 'IN' | 'OUT' | 'WASTE' | 'SALE',
        reason?: string
    ): Promise<void> {
        // 1. Get current stock (Optional, for safety, or we just increment)
        // We will simple increment the column atomically using Supabase rpc if possible, 
        // or just read-write for now (optimistic locking not critical for MVP Inventory).

        // Fetch current (Core quando Docker — Fase 4)
        const fetchClient = await getTableClient();
        const { data: item, error: fetchError } = await fetchClient
            .from('gm_inventory_items')
            .select('stock_quantity')
            .eq('id', itemId)
            .single();

        if (fetchError || !item) throw new Error('Item not found');

        const newStock = Number(item.stock_quantity) + delta;

        // 2. Update Item
        const { error: updateError } = await fetchClient
            .from('gm_inventory_items')
            .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
            .eq('id', itemId);

        if (updateError) throw updateError;

        // 3. Log Movement
        const { error: moveError } = await fetchClient
            .from('gm_stock_movements')
            .insert({
                inventory_item_id: itemId,
                type,
                quantity: Math.abs(delta), // Store absolute magnitude
                reason,
                created_at: new Date().toISOString()
            });

        if (moveError) console.error('InventoryEngine: Failed to log movement', moveError);
    }

    static async getItems(restaurantId: string): Promise<InventoryItem[]> {
        const client = await getTableClient();
        const { data, error } = await client
            .from('gm_inventory_items')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data as InventoryItem[];
    }

    /**
     * Gets all recipes for a restaurant, grouped by menu_item_id or flat.
     */
    static async getRecipes(restaurantId: string): Promise<Recipe[]> {
        // We first get menu items to filter recipes by restaurant
        // Or we use the RLS which already filters by restaurant membership.
        // However, RLS works on 'auth.uid()', so just select * from recipes should return only allowed ones.
        // But to be explicit and safe and ensure we only get recipes for valid products:
        const recipesClient = await getTableClient();
        const { data, error } = await recipesClient
            .from('gm_recipes')
            .select(`
                *,
                inventory_item:gm_inventory_items(*)
            `)
            .eq('restaurant_id', restaurantId);

        if (error) throw error;

        return (data || []) as Recipe[];
    }

    /**
     * Updates the recipe for a single menu item (Full Replace).
     */
    static async updateRecipe(
        menuItemId: string,
        ingredients: { inventoryItemId: string; quantity: number }[]
    ): Promise<void> {
        // 1. Delete existing recipes for this menu item
        const updateClient = await getTableClient();
        const { error: deleteError } = await updateClient
            .from('gm_recipes')
            .delete()
            .eq('menu_item_id', menuItemId);

        if (deleteError) throw deleteError;

        if (ingredients.length === 0) return;

        // 2. Insert new recipes
        const rows = ingredients.map(i => ({
            menu_item_id: menuItemId,
            inventory_item_id: i.inventoryItemId,
            quantity: i.quantity // DB column is 'quantity'
        }));

        // Strategy: We need restaurant_id.
        const { data: product } = await updateClient.from('gm_products').select('restaurant_id').eq('id', menuItemId).single();
        if (!product) throw new Error('Product not found');

        const rowsWithRestaurant = rows.map(r => ({
            ...r,
            restaurant_id: product.restaurant_id
        }));

        const { error: insertError } = await updateClient
            .from('gm_recipes')
            .insert(rowsWithRestaurant);

        if (insertError) throw insertError;
    }

    /**
     * Calculates the total cost of ingredients for a given order.
     */
    static async calculateOrderCost(order: Order): Promise<number> {
        if (!order.items || order.items.length === 0) return 0;

        const menuItemIds = order.items.map(i => i.productId).filter(Boolean) as string[];
        if (menuItemIds.length === 0) return 0;

        // Fetch recipes with ingredient costs (Core quando Docker — Fase 4)
        const costClient = await getTableClient();
        const { data: recipes, error } = await costClient
            .from('gm_recipes')
            .select(`
                *,
                inventory_item:gm_inventory_items(cost_per_unit)
            `)
            .in('menu_item_id', menuItemIds);

        if (error) {
            console.error('InventoryEngine: Failed to fetch recipes for cost calc', error);
            return 0;
        }

        if (!recipes || recipes.length === 0) return 0;

        let totalCost = 0;

        order.items.forEach(orderItem => {
            const itemRecipes = recipes.filter((r: any) => r.menu_item_id === orderItem.productId);
            // Sum of (Quantity Required * Cost Per Unit)
            const itemUnitCost = itemRecipes.reduce((sum: number, r: any) => {
                const cost = r.inventory_item?.cost_per_unit || 0;
                // Use 'quantity' from DB
                return sum + (r.quantity * cost);
            }, 0);

            totalCost += (itemUnitCost * orderItem.quantity);
        });

        return Math.round(totalCost);
    }
}
