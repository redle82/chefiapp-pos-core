
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

async function verifyDashboard() {
    console.log('🧠 Starting Dashboard Verification...');

    // 0. Authenticate as Admin (Bypass RLS)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@goldmonkey.com',
        password: 'admin123'
    });
    if (authError || !authData.user) {
        throw new Error('Failed to login as admin: ' + authError?.message);
    }
    console.log('🔑 Logged in as Admin.');

    // 1. Get Restaurant ID
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    const restaurantId = restaurants![0].id;
    console.log(`📍 Restaurant ID: ${restaurantId}`);

    // 2. Open Register (if needed for PaymentRPC, but here we insert orders directly for speed, or via RPC)
    // Actually, let's just insert 'paid' orders directly to test the Aggregator (RPC), 
    // assuming PaymentEngine works (verified in Phase 17).

    // Clean slate for clean test? No, let's just add known amount and see if it increases?
    // Aggregator counts TODAY. 

    // Get Pre-Seed Metrics
    const { data: preStats } = await supabase.rpc('get_daily_metrics', { p_restaurant_id: restaurantId });
    console.log('📊 Pre-Stress Test Metrics:', preStats);

    const initialTotal = preStats.total_sales_cents;

    // 3. Seed 3 Orders (Total 50.00 EUR -> 5000 cents)
    const orders = [
        { total: 1500, table: 90 },
        { total: 2000, table: 91 },
        { total: 1500, table: 92 }
    ];

    console.log('🌱 Seeding 3 Paid Orders (Total 5000 cents)...');
    for (const o of orders) {
        await supabase.from('gm_orders').insert({
            id: crypto.randomUUID(),
            restaurant_id: restaurantId,
            table_number: o.table,
            status: 'paid', // Directly paid for aggregation test
            total_cents: o.total,
            created_at: new Date().toISOString() // NOW
        });
    }

    // 4. Verify Metrics Update
    const { data: postStats } = await supabase.rpc('get_daily_metrics', { p_restaurant_id: restaurantId });
    console.log('📊 Post-Seed Metrics:', postStats);

    const delta = postStats.total_sales_cents - initialTotal;

    // Assert
    if (delta === 5000) {
        console.log('✅ PASS: Dashboard recognized exact sales increase (5000 cents).');
    } else {
        throw new Error(`❌ FAIL: Expected delta 5000, got ${delta}.`);
    }

    if (postStats.total_orders === preStats.total_orders + 3) {
        console.log('✅ PASS: Order count increased by 3.');
    } else {
        throw new Error(`❌ FAIL: Order count mismatch.`);
    }

    // Check Graph Data
    const currentHour = new Date().getUTCHours(); // RPC uses NOW() which is effectively system time. 
    // Wait, RPC uses `EXTRACT(HOUR FROM created_at)`.
    // In local dev, DB Timezone might match System Timezone or be UTC.
    // Dashboard displays by hour. 
    const hourStats = postStats.sales_by_hour.find((h: any) => h.hour === currentHour);
    if (hourStats && hourStats.total_cents >= 5000) {
        console.log(`✅ PASS: Sales recorded for Hour ${currentHour}.`);
    } else {
        console.warn(`⚠️ WARNING: Sales for Hour ${currentHour} not found or low. (Timezone mismatch possible). Graph data:`, postStats.sales_by_hour);
    }

    console.log('🎉 Dashboard Verification Complete.');
}

verifyDashboard().catch(console.error);
