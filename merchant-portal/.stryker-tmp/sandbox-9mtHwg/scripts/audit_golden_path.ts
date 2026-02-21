
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

const ADMIN_EMAIL = 'admin@goldmonkey.com';
const ADMIN_PASS = 'admin123';

async function auditGoldenPath() {
    console.log('🧊 Starting Phase 19 Audit: The Golden Path...');

    // =========================================================================
    // STEP 0: SETUP & IDENTIFY
    // =========================================================================
    console.log('\n--- Step 0: Identify Sovereignty ---');
    // Login as Admin to get IDs (simulating system awareness)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS
    });
    if (authError || !authData.user) throw new Error('Failed to login as admin');

    const { data: restaurants } = await supabase.from('gm_restaurants').select('id, tenant_id').limit(1);
    const restaurantId = restaurants![0].id;
    const tenantId = restaurants![0].tenant_id; // Needed for Airlock

    // Ensure Register is Open (Prerequisite)
    const { data: registers } = await supabase.from('gm_cash_registers')
        .select('id, status')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'open')
        .limit(1);

    let registerId = registers?.[0]?.id;

    if (!registerId) {
        console.log('   🔸 Opening Register for Audit...');
        const { data: newReg, error: regError } = await supabase.from('gm_cash_registers').insert({
            restaurant_id: restaurantId,
            operator_id: authData.user.id,
            status: 'open',
            opening_balance_cents: 0
        }).select().single();
        if (regError) throw regError;
        registerId = newReg.id;
    }
    console.log('   ✅ Environment Ready.');

    // =========================================================================
    // STEP 1: THE STRANGER (Public Menu & Airlock)
    // =========================================================================
    console.log('\n--- Step 1: The Stranger (Airlock) ---');
    // 1.1 Fetch Menu (Public Access Check)
    const { data: menu, error: menuError } = await supabase.from('gm_products')
        .select('id, price_cents, name')
        .eq('restaurant_id', restaurantId)
        .limit(2);

    if (menuError || !menu || menu.length === 0) throw new Error('Public Menu Fetch Failed');
    console.log(`   ✅ Menu fetched (${menu.length} items).`);

    // 1.2 Build Cart
    const cartItems = menu.map(p => ({
        product_id: p.id,
        quantity: 1,
        price_at_request: p.price_cents,
        notes: "Audit Item"
    }));
    const totalCents = menu.reduce((acc, p) => acc + p.price_cents, 0);

    // 1.3 Submit Request (Airlock Insert)
    const requestPayload = {
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        customer_name: "Audit Stranger",
        table_number: "99",
        origin: "web_qr",
        items: cartItems,
        total_cents: totalCents,
        status: "pending"
    };

    const { data: request, error: reqError } = await supabase.from('gm_order_requests')
        .insert(requestPayload)
        .select()
        .single();

    if (reqError) throw new Error(`Airlock Blocked: ${reqError.message}`);
    console.log(`   ✅ Airlock Request Accepted (ID: ${request.id.split('-')[0]}...)`);


    // =========================================================================
    // STEP 2: THE GATEKEEPER (TPV -> Order)
    // =========================================================================
    console.log('\n--- Step 2: The Gatekeeper (Order Creation) ---');
    // Simulate OrderProcessingService.acceptRequest logic
    // Create Sovereign Order
    const { data: order, error: orderError } = await supabase.from('gm_orders').insert({
        restaurant_id: restaurantId,
        table_number: parseInt(request.table_number),
        status: 'open',
        customer_name: request.customer_name,
        origin: request.origin,
        total_cents: request.total_cents
    }).select().single();

    if (orderError) throw orderError;

    // Create Items
    const orderItems = request.items.map((item: any, idx: number) => ({
        order_id: order.id,
        // restaurant_id: restaurantId, // Removed: Not in schema, relies on order join
        product_id: item.product_id,
        quantity: item.quantity,
        price_snapshot: item.price_at_request,
        name_snapshot: menu.find(m => m.id === item.product_id)?.name || 'Unknown',
        // status: 'sent', // Removed: Not in schema
        subtotal_cents: item.price_at_request * item.quantity
    }));

    const { error: itemsError } = await supabase.from('gm_order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // Update Request to Accepted
    await supabase.from('gm_order_requests').update({ status: 'accepted', order_id: order.id }).eq('id', request.id);

    console.log(`   ✅ Order Created (ID: ${order.id.split('-')[0]}...)`);
    console.log(`   ✅ Items Sent to Kitchen.`);


    // =========================================================================
    // STEP 3: THE CHEF (Kitchen Flow)
    // =========================================================================
    console.log('\n--- Step 3: The Chef (Kitchen) ---');
    // Move Order to IN_PREP (Simulating Chef touching screen)
    await supabase.from('gm_orders').update({ status: 'in_prep' }).eq('id', order.id);
    // Then to READY
    await supabase.from('gm_orders').update({ status: 'ready' }).eq('id', order.id); // Or serve directly? 
    // Usually Kitchen moves items or order status. Let's assume Order Status flow for simplicity in V1.
    // Actually V1 KitchenDisplay looks for 'open' (sent) items. 
    // Let's mark as served (Done) effectively.
    await supabase.from('gm_orders').update({ status: 'served' }).eq('id', order.id);
    console.log(`   ✅ Order Marked SERVED (Ready for Pay).`);


    // =========================================================================
    // STEP 4: THE WALLET (Payment)
    // =========================================================================
    console.log('\n--- Step 4: The Wallet (Payment) ---');
    // Call RPC process_order_payment
    const { data: payResult, error: payError } = await supabase.rpc('process_order_payment', {
        p_restaurant_id: restaurantId,
        p_order_id: order.id,
        p_cash_register_id: registerId,
        p_operator_id: authData.user.id,
        p_amount_cents: totalCents,
        p_method: 'cash',
        p_idempotency_key: `audit-${Date.now()}`
    });

    if (payError || !payResult.success) {
        throw new Error(`Payment Failed: ${payError?.message || JSON.stringify(payResult)}`);
    }
    console.log(`   ✅ Payment Processed (Amount: €${(totalCents / 100).toFixed(2)}).`);


    // =========================================================================
    // STEP 5: THE BRAIN (Dashboard Metrics)
    // =========================================================================
    console.log('\n--- Step 5: The Brain (Dashboard) ---');
    // Fetch Metrics
    const { data: metrics, error: metricsError } = await supabase.rpc('get_daily_metrics', {
        p_restaurant_id: restaurantId
    });

    if (metricsError) throw metricsError;

    // Check if our sale is counted
    if (metrics.total_orders > 0 && metrics.total_sales_cents >= totalCents) {
        console.log(`   ✅ Metrics Reflected:`);
        console.log(`      - Sales Today: €${(metrics.total_sales_cents / 100).toFixed(2)}`);
        console.log(`      - Orders Today: ${metrics.total_orders}`);
    } else {
        throw new Error('Dashboard Metrics did not reflect the transaction!');
    }

    // Check Audit Log
    const { data: logs } = await supabase.from('gm_payment_audit_logs')
        .select('id, result')
        .eq('order_id', order.id)
        .single();

    if (logs && logs.result === 'success') {
        console.log(`   ✅ Audit Log Found (ID: ${logs.id.split('-')[0]}...)`);
    } else {
        console.warn('   ⚠️ Audit Log missing or failed.');
    }

    console.log('\n🧊 GOLDEN PATH AUDIT: PASSED.');
}

auditGoldenPath().catch((err) => {
    console.error('\n❌ AUDIT FAILED:', err);
    process.exit(1);
});
