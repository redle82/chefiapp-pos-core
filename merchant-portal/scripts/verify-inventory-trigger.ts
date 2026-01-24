
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function verifyInventoryTrigger() {
    console.log('🧪 Verifying Inventory Trigger Logic...');

    // 1. Setup Context (Restaurant)
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    if (!restaurants || restaurants.length === 0) throw new Error('No restaurants found');
    const restaurantId = restaurants[0].id;
    console.log(`   🔸 Using Restaurant: ${restaurantId}`);

    // 2. Create Test Ingredient
    const stamp = Date.now();
    const ingName = `Ingredient ${stamp}`;
    const { data: ingredient, error: ingError } = await supabase.from('gm_inventory_items').insert({
        restaurant_id: restaurantId,
        name: ingName,
        stock_quantity: 100,
        unit: 'unit',
        cost_per_unit: 100
    }).select().single();
    if (ingError) throw ingError;
    console.log(`   🔸 Created Ingredient: ${ingName} (ID: ${ingredient.id}) (Stock: 100)`);

    // 3. Create Test Product
    const prodName = `Product ${stamp}`;
    const { data: product, error: prodError } = await supabase.from('gm_products').insert({
        restaurant_id: restaurantId,
        name: prodName,
        price_cents: 1000,
        available: true
    }).select().single();
    if (prodError) throw prodError;
    console.log(`   🔸 Created Product: ${prodName} (ID: ${product.id})`);

    // 4. Create Recipe (1 Product = 5 Ingredients)
    const qtyRequired = 5;
    const { error: recipeError } = await supabase.from('gm_recipes').insert({
        restaurant_id: restaurantId,
        menu_item_id: product.id,
        inventory_item_id: ingredient.id,
        quantity: qtyRequired
    });
    if (recipeError) throw recipeError;
    console.log(`   🔸 Created Recipe: 1 ${prodName} uses ${qtyRequired} ${ingName}`);

    // 5. Create Order
    const { data: order, error: orderError } = await supabase.from('gm_orders').insert({
        restaurant_id: restaurantId,
        status: 'pending',
        total_amount: 1000,
        customer_name: 'Inventory Tester',
        origin: 'TEST'
    }).select().single();
    if (orderError) throw orderError;
    console.log(`   🔸 Created Order: ${order.id} (Status: pending)`);

    // 6. Add Order Item
    const { error: itemError } = await supabase.from('gm_order_items').insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: 2, // Ordering 2 items, so expecting 2 * 5 = 10 deduction
        unit_price: 1000,
        total_price: 2000
    });
    if (itemError) throw itemError;
    console.log(`   🔸 Added 2x ${product.name} to Order`);

    // 7. Trigger Payment (Update status to 'paid')
    console.log('   🔥 Setting Order Status to PAID...');
    const { error: updateError } = await supabase.from('gm_orders').update({
        status: 'paid'
    }).eq('id', order.id);
    if (updateError) throw updateError;

    // Wait a moment for trigger (it's synchronous usually, but good to be safe)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 8. Verify Stock Movement
    const { data: movements, error: moveError } = await supabase
        .from('gm_stock_movements')
        .select('*')
        .eq('inventory_item_id', ingredient.id)
        .eq('type', 'SALE');

    if (moveError) throw moveError;

    if (!movements || movements.length === 0) {
        throw new Error('❌ No stock movements found! Trigger failed.');
    }

    const totalDeducted = movements.reduce((acc, m) => acc + Number(m.quantity), 0);
    console.log(`   ✅ Found Stock Movements: Total Deducted = ${totalDeducted}`);

    if (totalDeducted !== 10) {
        throw new Error(`❌ Expected deduction of 10, but got ${totalDeducted}`);
    }

    // 9. Verify Final Stock
    const { data: finalIng } = await supabase
        .from('gm_inventory_items')
        .select('stock_quantity')
        .eq('id', ingredient.id)
        .single();

    console.log(`   ✅ Final Stock: ${finalIng?.stock_quantity} (Expected: 90)`);
    if (Number(finalIng?.stock_quantity) !== 90) {
        throw new Error(`❌ Final stock incorrect! Expected 90, got ${finalIng?.stock_quantity}`);
    }

    console.log('\n🎉 INVENTORY TRIGGER VERIFIED SUCCESSFULLY!');
}

verifyInventoryTrigger().catch((err) => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
});
