import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is missing');

// Simulate PUBLIC CLIENT (Anon)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyAirlock() {
    console.log('🛸 AIRLOCK VERIFICATION (Public Client Simulation)');

    // 1. Get Tenant ID (from Public Read)
    const { data: restaurant, error: restError } = await supabase
        .from('gm_restaurants')
        .select('*, tenant_id')
        .eq('slug', 'demo-grill')
        .single();

    if (restError || !restaurant) throw new Error('Failed to find Demo Grill (Public Read failed?)');
    console.log('✅ Public Read OK. Target Tenant:', restaurant.tenant_id);

    // 1.5 Get a Real Product
    const { data: product } = await supabase
        .from('gm_products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .limit(1)
        .single();

    if (!product) throw new Error('No products found in restaurant.');

    // 2. Construct Payload
    const payload = {
        tenant_id: restaurant.tenant_id,
        items: [
            { product_id: product.id, name: product.name, quantity: 2, price_cents: product.price_cents, notes: 'Script Test' }
        ],
        total_cents: 2000,
        payment_method: 'CASH',
        status: 'PENDING',
        request_source: 'SCRIPT_VERIFICATION',
        customer_contact: {
            name: 'Verification Bot',
            phone: '000000000'
        }
    };

    console.log('📤 Sending Request to Airlock...');

    // 3. Insert (Blind or confirmed?)
    const { data, error } = await supabase
        .from('gm_order_requests')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('💥 Airlock REJECTED payload:', error);
        throw error;
    }

    console.log('✅ Airlock ACCEPTED payload.');
    console.log('   Request ID:', data.id);
    console.log('   Status:', data.status);
    console.log('   Source:', data.request_source);

    if (data.status === 'PENDING') {
        console.log('🟢 SYSTEM HALT: Order is safely in the Queue.');
        console.log('NOTE: Dashboard/Orders page inspection required to see it.');
    } else {
        console.log('⚠️ Unexpected status:', data.status);
    }
}

verifyAirlock().catch(e => {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
});
