import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// SUPABASE CONFIG (Local)
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA4MzY2OTU4OX0.4uppKGt2TPPisgqHVr-szTRDntKEGnfBYKnT9aEnA4lRmc7hX17nBg3vw0hYOhDQcNdb0UAvN4PiXRnjLZo-Gg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInventory() {
    console.log('📦 Starting Inventory Logic Test...');

    // Fetch a valid restaurant
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    if (!restaurants || restaurants.length === 0) {
        console.log('⚠️ No restaurant found, creating one...');
        const tenantId = uuidv4();
        await supabase.from('saas_tenants').insert({ id: tenantId, name: 'Test Tenant', slug: 'test-tenant-' + tenantId });
        const newRestId = uuidv4();
        await supabase.from('gm_restaurants').insert({ id: newRestId, tenant_id: tenantId, name: 'Test Rest', slug: 'test-' + newRestId });
        await supabase.from('gm_menu_categories').insert({ id: uuidv4(), restaurant_id: newRestId, name: 'Test Cat' });
        await runTest(newRestId);
    } else {
        await runTest(restaurants[0].id);
    }
}

async function runTest(RESTAURANT_ID: string) {
    console.log(`🏢 Using Restaurant: ${RESTAURANT_ID}`);

    // Fetch category
    const { data: categories } = await supabase.from('gm_menu_categories').select('id').eq('restaurant_id', RESTAURANT_ID).limit(1);

    let realCategoryId;
    if (!categories || categories.length === 0) {
        console.log('⚠️ No category found, creating one...');
        realCategoryId = uuidv4();
        await supabase.from('gm_menu_categories').insert({ id: realCategoryId, restaurant_id: RESTAURANT_ID, name: 'Test Cat' });
    } else {
        realCategoryId = categories[0].id;
    }

    const productId = uuidv4();
    console.log(`Creating product ${productId} with stock=1...`);
    const { error: prodError } = await supabase.from('gm_products').insert({
        id: productId,
        restaurant_id: RESTAURANT_ID,
        category_id: realCategoryId,
        name: 'Test Stock Item',
        price_cents: 100,
        track_stock: true,
        stock_quantity: 1
    });

    if (prodError) throw prodError;

    // 2. Buy 1 (Should Succeed)
    console.log('🛒 Buying 1 Item (Should Succeed)...');
    const { error: buy1Error } = await supabase.rpc('create_order_atomic', {
        p_restaurant_id: RESTAURANT_ID,
        p_items: [{
            product_id: productId,
            name: 'Test Stock Item',
            unit_price: 100,
            quantity: 1
        }],
        p_payment_method: 'cash'
    });

    if (buy1Error) {
        console.error('❌ Buy 1 Failed:', buy1Error);
        process.exit(1);
    }
    console.log('✅ Buy 1 Success');

    // 3. Verify Stock is 0
    const { data: prodData } = await supabase.from('gm_products').select('stock_quantity').eq('id', productId).single();
    if (prodData!.stock_quantity !== 0) {
        console.error('❌ Stock not decremented! Current:', prodData!.stock_quantity);
        process.exit(1);
    }
    console.log('✅ Stock decremented to 0');

    // 4. Buy 1 More (Should Fail)
    console.log('🛒 Buying 1 More (Should Fail)...');
    const { error: buy2Error } = await supabase.rpc('create_order_atomic', {
        p_restaurant_id: RESTAURANT_ID,
        p_items: [{
            product_id: productId,
            name: 'Test Stock Item',
            unit_price: 100,
            quantity: 1
        }],
        p_payment_method: 'cash'
    });

    if (buy2Error && buy2Error.message.includes('INSUFFICIENT_STOCK')) {
        console.log('✅ Blocked correctly: ' + buy2Error.message);
    } else {
        console.error('❌ Did NOT block correctly!', buy2Error || 'No Error');
        process.exit(1);
    }

    // 5. Offline Sync (Should Succeed even with 0 stock)
    console.log('🔄 Offline Sync 1 Item (Should Allow negative)...');
    const { error: syncError } = await supabase.rpc('create_order_atomic', {
        p_restaurant_id: RESTAURANT_ID,
        p_items: [{
            product_id: productId,
            name: 'Test Stock Item',
            unit_price: 100,
            quantity: 1
        }],
        p_payment_method: 'cash',
        p_sync_metadata: { offline_id: '123' }
    });

    if (syncError) {
        console.error('❌ Sync Failed:', syncError);
        process.exit(1);
    }
    console.log('✅ Sync Allowed');

    // 6. Verify Negative Stock
    const { data: prodDataFinal } = await supabase.from('gm_products').select('stock_quantity').eq('id', productId).single();
    if (prodDataFinal!.stock_quantity !== -1) {
        console.error('❌ Stock not -1! Current:', prodDataFinal!.stock_quantity);
    } else {
        console.log('✅ Stock is correctly -1');
    }

    // Cleanup
    await supabase.from('gm_products').delete().eq('id', productId);
    console.log('🧹 Cleanup Done');
}

testInventory().catch(e => {
    console.error(e);
    process.exit(1);
});
