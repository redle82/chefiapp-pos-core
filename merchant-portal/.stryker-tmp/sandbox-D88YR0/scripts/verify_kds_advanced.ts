
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

async function verifyKDSAdvanced() {
    console.log('🍳 Verifying Advanced KDS Workflow...');

    // 1. Setup (Get Restaurant)
    const { data: restaurants } = await supabase.from('gm_restaurants').select('id').limit(1);
    const restaurantId = restaurants![0].id;

    // 2. Create Sovereign Order (Simulate TPV Acceptance)
    console.log('   🔸 Creating New Order (Status: open)...');
    const { data: order, error: orderError } = await supabase.from('gm_orders').insert({
        restaurant_id: restaurantId,
        table_number: 999, // Magic number for test
        status: 'open', // NEW in KDS
        customer_name: "KDS Tester",
        origin: "PROBE",
        total_cents: 1000
    }).select().single();

    if (orderError) throw orderError;
    console.log(`   ✅ Order Created: ${order.id}`);

    // 3. Move to IN_PREP (Simulate Kitchen Tap)
    console.log('   🔸 Kitchen: Moving to IN_PREP...');
    const nowPrep = new Date().toISOString();
    const { error: prepError } = await supabase.from('gm_orders').update({
        status: 'in_prep',
        in_prep_at: nowPrep
    }).eq('id', order.id);
    if (prepError) throw prepError;

    // Verify Timestamp
    const { data: check1 } = await supabase.from('gm_orders').select('in_prep_at').eq('id', order.id).single();
    if (!check1.in_prep_at) throw new Error('in_prep_at NOT recorded!');
    console.log(`   ✅ IN_PREP Timestamp Recorded: ${check1.in_prep_at}`);

    // 4. Move to READY (Simulate Kitchen Ready)
    console.log('   🔸 Kitchen: Moving to READY...');
    const nowReady = new Date().toISOString();
    const { error: readyError } = await supabase.from('gm_orders').update({
        status: 'ready',
        ready_at: nowReady
    }).eq('id', order.id);
    if (readyError) throw readyError;

    // Verify Timestamp
    const { data: check2 } = await supabase.from('gm_orders').select('ready_at').eq('id', order.id).single();
    if (!check2.ready_at) throw new Error('ready_at NOT recorded!');
    console.log(`   ✅ READY Timestamp Recorded: ${check2.ready_at}`);

    // 5. Move to SERVED (Simulate Waiter Handoff)
    console.log('   🔸 Waiter: Moving to SERVED...');
    const nowServed = new Date().toISOString();
    const { error: servedError } = await supabase.from('gm_orders').update({
        status: 'served',
        served_at: nowServed
    }).eq('id', order.id);
    if (servedError) throw servedError;

    // Verify Timestamp
    const { data: check3 } = await supabase.from('gm_orders').select('served_at').eq('id', order.id).single();
    if (!check3.served_at) throw new Error('served_at NOT recorded!');
    console.log(`   ✅ SERVED Timestamp Recorded: ${check3.served_at}`);

    console.log('\n✅ ADVANCED KDS LOGIC: VERIFIED.');
}

verifyKDSAdvanced().catch((err) => {
    console.error('\n❌ KDS FAILED:', err);
    process.exit(1);
});
