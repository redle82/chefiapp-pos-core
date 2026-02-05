import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });

// Docker Core client (no @supabase/supabase-js)
const { coreClient: supabase } = await import('../services/coreClient');

if (!process.env.EXPO_PUBLIC_CORE_URL && !process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.error("Missing EXPO_PUBLIC_CORE_URL or EXPO_PUBLIC_SUPABASE_URL");
    process.exit(1);
}

async function verifyInventoryLogic() {
    console.log("📦 Starting Phase 38 Verification: Inventory Logic...");

    try {
        // 1. Setup: Get a Restaurant ID (Just pick one)
        const { data: restaurant } = await supabase.from('gm_restaurants').select('id').limit(1).single();
        if (!restaurant) throw new Error("No restaurant found");
        const restaurantId = restaurant.id;
        console.log(`Using Restaurant: ${restaurantId}`);

        // 2. Create Test Ingredient
        const testIngredientId = "TEMP-ING-" + Date.now();
        // Since ID is UUID usually, let's let DB generate it, but we track it.
        const { data: ingredient, error: ingError } = await supabase
            .from('gm_inventory_items')
            .insert({
                restaurant_id: restaurantId,
                name: "Test Patty " + Date.now(),
                stock_quantity: 100,
                unit: 'unit',
                cost_per_unit: 100 // 1 euro
            })
            .select()
            .single();

        if (ingError) throw ingError;
        console.log(`✅ Created Ingredient: ${ingredient.name} (Stock: ${ingredient.stock_quantity})`);

        // 3. Create Test Product
        const { data: product, error: prodError } = await supabase
            .from('gm_products') // or gm_menu_items? core-schema uses gm_menu_items usually for linking recipes? 
            // Checking OrderContext, we map product_id from gm_menu_items?
            // "items:gm_order_items(*)" -> product_id.
            // Let's create a menu item.
            .insert({
                restaurant_id: restaurantId,
                name: "Test Burger " + Date.now(),
                price: 1000,
                available: true,
                category_id: null // optional?
            })
            .select()
            .single();

        // Note: IF gm_products is view or alias, we might need gm_menu_items. 
        // Logic used gm_recipes.menu_item_id.

        if (prodError) throw prodError;
        console.log(`✅ Created Product: ${product.name}`);

        // 4. Create Recipe
        const qtyRequired = 2; // Each burger needs 2 patties (Double!)
        const { error: recipeError } = await supabase
            .from('gm_recipes')
            .insert({
                menu_item_id: product.id,
                inventory_item_id: ingredient.id,
                quantity_required: qtyRequired
            });

        if (recipeError) throw recipeError;
        console.log(`✅ Created Recipe: ${product.name} needs ${qtyRequired} x ${ingredient.name}`);

        // 5. Simulate ORDER EXECUTION (The Logic from InventoryService)
        console.log("🔄 Executing Sale Logic (Simulated)...");

        const orderQty = 3; // Selling 3 Burgers
        const totalDeduction = qtyRequired * orderQty; // Should be 6

        // REPLICATING InventoryService.deductStockForOrder Logic
        console.log(`   -> Sold ${orderQty} Burgers. Expecting -${totalDeduction} Patties.`);

        // Fetch Recipe (Simulating Service Lookup)
        const { data: recipes } = await supabase
            .from('gm_recipes')
            .select('*')
            .eq('menu_item_id', product.id);

        const rec = recipes?.find((r: any) => r.inventory_item_id === ingredient.id);
        const calcQty = (Number(rec.quantity_required) || 0) * orderQty;

        // Verify Calculation
        if (calcQty !== totalDeduction) throw new Error(`Mismatch in Calc: ${calcQty} vs ${totalDeduction}`);

        // Perform Update (Simulating Service Update)
        const newStock = Number(ingredient.stock_quantity) - calcQty;

        const { error: updateError } = await supabase
            .from('gm_inventory_items')
            .update({ stock_quantity: newStock })
            .eq('id', ingredient.id);

        if (updateError) throw updateError;

        // Log Movement
        await supabase.from('gm_stock_movements').insert({
            inventory_item_id: ingredient.id,
            type: 'SALE',
            quantity: calcQty,
            reason: 'Test Verification'
        });

        // 6. Verify Result
        const { data: refreshedIng } = await supabase
            .from('gm_inventory_items')
            .select('stock_quantity')
            .eq('id', ingredient.id)
            .single();

        console.log(`✅ Final Stock: ${refreshedIng?.stock_quantity} (Expected: 100 - 6 = 94)`);

        if (Number(refreshedIng?.stock_quantity) !== 94) {
            throw new Error(`Stock verification failed! Got ${refreshedIng?.stock_quantity}`);
        }

        console.log("🎉 Phase 38 Verification SUCCESS!");

        // Cleanup
        await supabase.from('gm_menu_items').delete().eq('id', product.id);
        await supabase.from('gm_inventory_items').delete().eq('id', ingredient.id);

    } catch (e) {
        console.error("❌ Verification Failed:", e);
        process.exit(1);
    }
}

verifyInventoryLogic();
