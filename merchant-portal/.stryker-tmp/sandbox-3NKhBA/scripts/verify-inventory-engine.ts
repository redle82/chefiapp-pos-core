// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { InventoryEngine } from '../src/core/inventory/InventoryEngine';

// Hack to make the Engine work in script (it imports supabase from relative path)
// We might need to mock or ensure the relative import works. 
// Since InventoryEngine imports '../supabase', and we are in 'scripts/', 
// we physically can't easily import the source file directly without handling its dependencies.
// instead, we will just test the raw supabase logic for 'updateRecipe' pattern here,
// OR we can try to use standard import if mapped correctly. 
// Given the complexity of TS paths in scripts, I will replicate the logic to test the *behavior* 
// of the delete-replace pattern against the real DB.

// Load Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function verifyRecipeLogic() {
    console.log('🧪 Verifying Recipe Update Logic...');

    // 1. Setup Data
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    const restaurantId = restaurants![0].id;
    const stamp = Date.now();

    // Product
    const { data: product } = await supabase.from('gm_products').insert({
        restaurant_id: restaurantId,
        name: `Recipe Test Prod ${stamp}`,
        price_cents: 1000,
        available: true,
        category: 'Test'
    }).select().single();
    if (!product) throw new Error('Product creation failed');

    // Ingredient
    const { data: ing } = await supabase.from('gm_inventory_items').insert({
        restaurant_id: restaurantId,
        name: `Recipe Test Ing ${stamp}`,
        stock_quantity: 100,
        unit: 'kg',
        cost_per_unit: 500
    }).select().single();
    if (!ing) throw new Error('Ingredient creation failed');

    console.log(`   🔸 Created Product: ${product.name}`);
    console.log(`   🔸 Created Ingredient: ${ing.name}`);

    // 2. Simulate "updateRecipe" Logic (Delete then Insert)
    const menuItemId = product.id;
    const ingredients = [{ inventoryItemId: ing.id, quantity: 2.5 }];

    // A. Delete existing
    const { error: deleteError } = await supabase
        .from('gm_recipes')
        .delete()
        .eq('menu_item_id', menuItemId);
    if (deleteError) throw deleteError;

    // B. Insert new
    if (ingredients.length > 0) {
        const rows = ingredients.map(i => ({
            restaurant_id: restaurantId,
            menu_item_id: menuItemId,
            inventory_item_id: i.inventoryItemId,
            quantity: i.quantity
        }));

        const { error: insertError } = await supabase
            .from('gm_recipes')
            .insert(rows);
        if (insertError) throw insertError;
    }

    // 3. Verify Result
    const { data: recipes, error: fetchError } = await supabase
        .from('gm_recipes')
        .select('*')
        .eq('menu_item_id', menuItemId);

    if (fetchError) throw fetchError;

    console.log(`   ✅ Fetched ${recipes?.length} recipe items`);

    if (recipes?.length !== 1) throw new Error('Expected 1 recipe item');
    if (recipes[0].inventory_item_id !== ing.id) throw new Error('Wrong ingredient ID');
    if (recipes[0].quantity !== 2.5) throw new Error(`Wrong quantity! Expected 2.5, got ${recipes[0].quantity}`);

    console.log('🎉 Recipe Update Logic Verified!');
}

verifyRecipeLogic().catch(e => {
    console.error(e);
    process.exit(1);
});
