import { createClient } from '@supabase/supabase-js';

// HARDCODED CREDENTIALS (Retrieved from merchant-portal/.env)
// This ensures the verification runs without env var usage issues.
const SUPABASE_URL = 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const TARGET_SLUG = 'sofia-gastrobar-beta';
const USER_EMAIL = 'beta.sofia@chefiapp.com';
const USER_PASS = 'password123';

async function runSimulation() {
    console.log(`🚀 Starting Soft Launch Simulation: ${TARGET_SLUG}`);

    // 1. Setup Client
    console.log('   🔑 Logging in as User...');
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {});

    // 2. Login
    const { data: authData, error: loginError } = await userClient.auth.signInWithPassword({
        email: USER_EMAIL,
        password: USER_PASS
    });

    if (loginError) {
        console.error('Login Failed:', loginError.message);
        throw loginError;
    }
    console.log('   ✅ Login successful.');

    const userId = authData.user.id; // Corrected from data.user.id? signIn returns { data: { user, session }, error }
    console.log(`   👤 User ID: ${userId}`);

    // 3. Get Restaurant ID (as User)
    // We can't select * from gm_restaurants if RLS blocks listing all.
    // But we are owner. RLS on restaurants usually allows reading OWN restaurants.
    // Let's rely on gm_restaurant_members or slug query if allowed.
    // Public page can read slug. Owner can read their own.

    console.log('   🏢 Finding Restaurant...');
    const { data: rest, error: restError } = await userClient
        .from('gm_restaurants')
        .select('id')
        .eq('slug', TARGET_SLUG)
        .single();

    if (restError || !rest) {
        throw new Error(`Cannot find restaurant (RLS?): ${restError?.message}`);
    }
    const restId = rest.id;
    console.log(`   ✅ Restaurant Found: ${restId}`);

    // 4. Operational Flow

    // 4.1 Get Products
    console.log('   📦 Fetching Menu...');
    const { data: products } = await userClient.from('gm_products').select('*').eq('restaurant_id', restId);
    if (!products || products.length === 0) throw new Error('No products found');

    const burger = products.find(p => p.name === 'X-Burger');
    const coke = products.find(p => p.name === 'Coca-Cola');

    if (!burger || !coke) throw new Error('Missing products for test');

    // 4.2 Open Table / Create Order
    console.log('   📝 Creating Order...');

    // Manual ID generation for test
    const orderId = crypto.randomUUID();

    // Insert Order
    const { error: orderError } = await userClient.from('gm_orders').insert({
        id: orderId,
        restaurant_id: restId,
        status: 'pending',
        total_amount: (burger.price_cents * 2) + (coke.price_cents * 2),
        short_id: 'SIM-001'
    });

    if (orderError) throw orderError;
    console.log(`   ✅ Order Created: ${orderId}`);

    // 4.3 Add Items
    console.log('   ➕ Adding Items...');
    const items = [
        {
            order_id: orderId,
            product_id: burger.id,
            product_name: burger.name,
            quantity: 2,
            unit_price: burger.price_cents,
            total_price: burger.price_cents * 2
        },
        {
            order_id: orderId,
            product_id: coke.id,
            product_name: coke.name,
            quantity: 2,
            unit_price: coke.price_cents,
            total_price: coke.price_cents * 2
        }
    ];

    const { error: itemsError } = await userClient.from('gm_order_items').insert(items);
    if (itemsError) throw itemsError;
    console.log('   ✅ Items Added.');

    // 4.4 Verify Order Visibility (Read your own order)
    const { data: orderParams } = await userClient.from('gm_orders').select('*').eq('id', orderId).single();
    if (!orderParams) throw new Error('Cannot read created order (RLS?)');
    console.log('   ✅ Order Visible (RLS Passed).');

    // 4.5 Payment (Simulate update status)
    console.log('   💰 Processing Payment (Update Status)...');

    // Valid status: pending, preparing, ready, delivered, canceled.
    // We update to 'preparing' then 'ready' then 'delivered'.

    await userClient.from('gm_orders').update({ status: 'preparing' }).eq('id', orderId);
    await userClient.from('gm_orders').update({ status: 'ready' }).eq('id', orderId);

    const { error: updateError } = await userClient.from('gm_orders').update({
        status: 'delivered'
    }).eq('id', orderId);

    if (updateError) throw updateError;
    console.log('   ✅ Order Delivered (Payment Simulated).');

    console.log('\n✨ AUTOMATED SIMULATION COMPLETE. SUCCESS.');
}

runSimulation().catch((err) => {
    console.error('\n❌ SIMULATION FAILED:', err.message);
    process.exit(1);
});
