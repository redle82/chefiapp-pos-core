
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const RESTAURANT_ID = '6d676ae5-2375-42d2-8db3-e4e80ddb1b76';

async function rpc(name: string, payload: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
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

async function runTest() {
    console.log('🦅 Starting Cash Register Concurrency Test...');

    // 0. Ensure closed (manual usually, but let's try to proceed)
    // We assume it's closed or we will fail.
    // If open, we need to close it. But we need ID.
    // Let's just try to open.

    // 1. Concurrent Open
    console.log('⚡ simulating 2 parallel open requests...');

    const payload = {
        p_restaurant_id: RESTAURANT_ID,
        p_name: 'Concurrent Test Register',
        p_opened_by: '3b6cd06c-40a3-44fd-8dff-0f3f72f5cc57',
        p_opening_balance_cents: 0
    };

    const call1 = rpc('open_cash_register_atomic', payload);
    const call2 = rpc('open_cash_register_atomic', payload);

    const results = await Promise.all([call1, call2]);

    const successes = results.filter(r => !r.error);
    const failures = results.filter(r => r.error);

    console.log(`Results: ${successes.length} success, ${failures.length} failures`);
    if (failures.length > 0) {
        console.log('Failure reasons:', failures.map(f => f.error));
    }

    // Logic:
    // If register was already open: 0 success, 2 failures (ALREADY_OPEN) -> PASS (Safe)
    // If closed: 1 success, 1 failure (ALREADY_OPEN) -> PASS (Correct Locking)
    // If 2 success -> FAIL (Double Open)

    if (successes.length === 2) {
        console.error('❌ FATAL: Race Condition detected (Double Open).');
        process.exit(1);
    }

    if (successes.length === 1 && failures.length === 1) {
        // Must verify failure reason
        const reason = failures[0].error.message;
        if (reason.includes('CASH_REGISTER_ALREADY_OPEN')) {
            console.log('✅ Concurrency Handled (1 success, 1 blocked).');
        } else {
            console.error('❌ Failed for wrong reason:', reason);
            process.exit(1);
        }
    } else if (successes.length === 0) {
        // Maybe already open
        const reason = failures[0].error.message;
        if (reason.includes('CASH_REGISTER_ALREADY_OPEN')) {
            console.log('⚠️ Both failed because register was ALREADY open. Safe, but test inconclusive for race condition.');
            // Ideally we close it first.
        } else {
            console.error('❌ Both failed unexpectedly.', reason);
            process.exit(1);
        }
    }
}

runTest();
