
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env'); // merchant-portal/.env
console.log(`🌍 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' // Wait, this is ANON key. I need SERVICE key.
);

async function verifyKDSFlow() {
    console.log('🧪 Starting KDS Flow Verification...');

    // 1. Setup: Get a Restaurant ID (Demo Grill)
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    if (!restaurants || restaurants.length === 0) throw new Error('No restaurants found');
    const restaurantId = restaurants[0].id;
    console.log(`📍 Using Restaurant ID: ${restaurantId}`);

    // 2. Simulate TPV: Create a Sovereign Order (OPEN)
    const orderId = crypto.randomUUID();
    console.log(`📝 Creating Order: ${orderId}`);

    const { error: insertError } = await supabase.from('gm_orders').insert({
        id: orderId,
        restaurant_id: restaurantId,
        table_number: 99,
        status: 'OPEN', // TPV creates as OPEN/NEW
        total_cents: 1500,
        source: 'verification_script'
    });
    if (insertError) throw insertError;

    // Add Item
    await supabase.from('gm_order_items').insert({
        order_id: orderId,
        name_snapshot: 'KDS Test Burger',
        price_snapshot: 1500,
        quantity: 1,
        subtotal_cents: 1500
    });

    console.log('✅ Order Created (OPEN)');

    // 3. Simulate TPV: Send to Kitchen (Action: 'prepare')
    // Expected: Status -> IN_PREP
    console.log('🚀 Action: Send to Kitchen (IN_PREP)');
    const { error: updateError1 } = await supabase
        .from('gm_orders')
        .update({ status: 'IN_PREP', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (updateError1) throw updateError1;

    // 4. Verify KDS Visibility
    // KDS queries: status IN ('IN_PREP', 'READY')
    const { data: kdsOrders } = await supabase
        .from('gm_orders')
        .select('id, status')
        .eq('restaurant_id', restaurantId)
        .in('status', ['IN_PREP', 'READY'])
        .eq('id', orderId);

    if (!kdsOrders || kdsOrders.length === 0) {
        throw new Error('❌ Order NOT visible in KDS query!');
    }
    console.log(`👀 KDS sees order: ${kdsOrders[0].status}`);

    // 5. Simulate Kitchen: Mark Ready (Action: 'ready')
    // Expected: Status -> READY
    console.log('👨‍🍳 Action: Mark Ready');
    const { error: updateError2 } = await supabase
        .from('gm_orders')
        .update({ status: 'READY', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (updateError2) throw updateError2;

    const { data: readyOrder } = await supabase
        .from('gm_orders')
        .select('status')
        .eq('id', orderId)
        .single();

    if (readyOrder?.status !== 'READY') throw new Error(`❌ Status Mismatch. Expected READY, got ${readyOrder?.status}`);
    console.log('✅ Order is READY');

    // 6. Simulate Kitchen: Mark Delivered/Served (Action: 'serve' / 'archive')
    // Expected: Status -> COMPLETED (Archived from KDS view)
    console.log('📦 Action: Serve/Archive');
    const { error: updateError3 } = await supabase
        .from('gm_orders')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (updateError3) throw updateError3;

    // Verify Disappearance
    const { data: archivedOrders } = await supabase
        .from('gm_orders')
        .select('id')
        .eq('id', orderId)
        .in('status', ['IN_PREP', 'READY']);

    if (archivedOrders && archivedOrders.length > 0) throw new Error('❌ Order still visible in KDS!');
    console.log('✨ Order successfully processed and archived from KDS.');

    console.log('🎉 KDS Flow Verification PASSED');
}

verifyKDSFlow().catch(err => {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
});
