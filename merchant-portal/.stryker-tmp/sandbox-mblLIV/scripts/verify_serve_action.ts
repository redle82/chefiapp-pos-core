
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
console.log('📂 Loading .env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use Anon Key + Login

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials (URL or ANON_KEY)');
    console.log('URL:', supabaseUrl);
    console.log('Key Present:', !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@goldmonkey.com';
const ADMIN_PASS = 'admin123';

async function verifyServeAction() {
    console.log('🧪 Verifying Serve Action (RLS Check)...');

    // 1. Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS
    });
    if (authError || !authData.user) {
        throw new Error(`Login failed: ${authError?.message}`);
    }
    console.log('✅ Logged in as:', authData.user.email);

    // 2. Create a Test Order (Status: READY)
    // We need a valid restaurant ID. Let's pick one.
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    if (!restaurants || restaurants.length === 0) throw new Error('No restaurants found');
    const restaurantId = restaurants[0].id;

    const { data: order, error: createError } = await supabase
        .from('gm_orders')
        .insert({
            restaurant_id: restaurantId,
            table_number: '99',
            status: 'ready',
            total_cents: 1000,
            origin: 'tablet',
            ready_at: new Date().toISOString()
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Failed to create order:', createError);
        process.exit(1);
    }
    console.log('✅ Created Order (READY):', order.id);

    // 3. Simulate Serve Action
    console.log('🔄 Simulating Serve Action...');
    const nowServed = new Date().toISOString();
    const { error: updateError } = await supabase.from('gm_orders').update({
        status: 'served',
        served_at: nowServed
    }).eq('id', order.id);

    if (updateError) {
        console.error('❌ Serve update failed (likely RLS):', updateError);
        process.exit(1);
    }

    // 4. Verify Final State
    const { data: finalOrder } = await supabase
        .from('gm_orders')
        .select('status, served_at')
        .eq('id', order.id)
        .single();

    console.log('🔍 Final State:', finalOrder);

    if (finalOrder.status === 'served' && finalOrder.served_at) {
        console.log('✅ SUCCESS: Order served and timestamped.');
    } else {
        console.error('❌ FAILURE: Order state mismatch.');
        process.exit(1);
    }
}

verifyServeAction().catch(e => {
    console.error(e);
    process.exit(1);
});
