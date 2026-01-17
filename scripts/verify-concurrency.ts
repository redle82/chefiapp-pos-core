
import fetch from 'node-fetch';
import 'dotenv/config';

// Load from .env or .env.local if not present (tsc-node might not load .env.local auto)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Env Vars. Ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

async function rpc(name: string, payload: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`, // Using anon key is fine for atomic test usually
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const txt = await res.text();
        return { error: { message: txt, status: res.status } };
    }
    const data = await res.json();
    return { data };
}

async function testConcurrency() {
    console.log('🦅 Starting Concurrency Test (REST Mode)...');


    // 1. Setup: Create pending order
    const rpcItems = [{
        product_id: 'e697305d-223b-4786-8f3a-969c3a35d94e', // Must match item structure
        name: 'Initial Item',
        quantity: 1,
        unit_price: 100
    }];

    const { data: order, error } = await rpc('create_order_atomic', {
        p_restaurant_id: '6d676ae5-2375-42d2-8db3-e4e80ddb1b76', // Sofia Gastrobar
        p_items: rpcItems,
        p_payment_method: 'cash',
        p_sync_metadata: null
    });

    if (error || !order) {
        console.error('❌ Setup Failed (create_order_atomic):', error);
        process.exit(1);
    }

    const orderId = order.id;
    const version = order.version || 1;
    console.log(`✅ Order Created: ${orderId} (v${version})`);

    // 2. Simulate Concurrent Adds (Race Condition)
    console.log('⚡ simulating 2 parallel item adds (same expected version)...');

    const itemData = {
        product_name: 'Test Item',
        unit_price: 1000,
        quantity: 1,
        total_price: 1000,
        product_id: 'e697305d-223b-4786-8f3a-969c3a35d94e',
        notes: null,
        modifiers: [],
        category_name: 'Test',
        consumption_group_id: null
    };

    const call1 = rpc('add_order_item_atomic', {
        p_order_id: orderId,
        p_restaurant_id: '6d676ae5-2375-42d2-8db3-e4e80ddb1b76',
        p_item_data: itemData,
        p_expected_version: version
    });

    const call2 = rpc('add_order_item_atomic', {
        p_order_id: orderId,
        p_restaurant_id: '6d676ae5-2375-42d2-8db3-e4e80ddb1b76',
        p_item_data: itemData,
        p_expected_version: version // SAME VERSION -> One MUST fail
    });

    const results = await Promise.all([call1, call2]);

    const successes = results.filter(r => !r.error);
    const failures = results.filter(r => r.error);

    console.log(`Results: ${successes.length} success, ${failures.length} failures`);

    if (failures.length > 0) {
        console.log('Failure reasons:', failures.map(f => f.error));
    }

    if (successes.length === 1 && failures.length === 1) {
        console.log('✅ Concurrency Handled Correctly (One won, one failed).');

        // Verify version bump
        // @ts-ignore
        const newVer = successes[0].data.new_version;
        console.log(`   New Version: ${newVer}`);
        if (newVer !== version + 1) {
            console.error('❌ Version mismatch in response');
        }

    } else {
        console.error('❌ Concurrency Audit FAILED.');
        process.exit(1);
    }

    // Cleanup - not implemented in REST easily without another RPC or manual delete
    console.log('🧹 Cleanup Skipped (Manual).');
}

testConcurrency();
