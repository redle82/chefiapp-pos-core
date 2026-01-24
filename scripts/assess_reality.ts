
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const supabase = createClient(supabaseUrl, supabaseKey);

// --- MOCK CONSTANTS FROM ROADMAP ---
const ROADMAP_FILES = {
    'orders': 'src/pages/TPV/context/OrderContextReal.tsx',
    'cash_register': 'src/core/fiscal/CashRegister.ts',
    'fiscal': 'src/core/fiscal/InvoiceXpressAdapter.ts',
    'offline': 'src/pages/TPV/context/OfflineOrderContext.tsx',
    'kds_realtime': 'src/pages/TPV/KDS/KDSLayout.tsx',
    'menu_ai': 'src/pages/Menu/MenuAI.tsx',
    'menu_import': 'src/pages/Menu/MenuImport.tsx',
    'staff_stream': 'src/pages/AppStaff/WorkerTaskStream.tsx',
    'staff_minipos': 'src/pages/AppStaff/MiniPOS.tsx',
};

async function checkFileExists(relPath: string) {
    const fullPath = path.resolve(__dirname, '../merchant-portal', relPath);
    return fs.existsSync(fullPath);
}

// --- LOGIC COPIED FROM KERNELS ---

async function genesisJudge(tenantId: string) {
    const failures = [];
    let checksPassed = 0;
    const totalChecks = 4;

    // 1. Foundations
    const { data: tenant } = await supabase.from('gm_restaurants').select('id, name, onboarding_completed, status').eq('id', tenantId).single();
    if (!tenant || !tenant.onboarding_completed || tenant.status !== 'active') failures.push('Foundations');
    else checksPassed++;

    // 2. Menu
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenantId);
    if ((productCount || 0) === 0) failures.push('Menu Empty');
    else checksPassed++;

    // 3. Staff
    const { count: staffCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenantId).eq('active', true);
    if ((staffCount || 0) < 1) failures.push('Staff < 1');
    else checksPassed++;

    // 4. Flow (Onboarding Complete as proxy)
    if (tenant?.onboarding_completed) checksPassed++;

    return {
        ready: failures.length === 0,
        score: (checksPassed / totalChecks) * 100,
        failures
    };
}

async function liveJudge(tenantId: string) {
    const failures = [];
    let checksPassed = 0;
    const totalChecks = 4;

    // 1. Heartbeat (Orders > 0 in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentOrders } = await supabase.from('gm_orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenantId).gte('created_at', oneHourAgo);
    if ((recentOrders || 0) > 0) checksPassed++;
    else failures.push('No Recent Heartbeat');

    // 2. Tribe (Staff >= 2)
    const { count: staffCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenantId).eq('active', true);
    if ((staffCount || 0) >= 2) checksPassed++;
    else failures.push('Tribe Too Small (<2)');

    // 3. Money (Paid Orders > 0)
    const { count: paidOrders } = await supabase.from('gm_orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', tenantId).eq('payment_status', 'paid');
    if ((paidOrders || 0) > 0) checksPassed++;
    else failures.push('No Proof of Money');

    // 4. Installation (Proxy)
    if (checksPassed >= 1) checksPassed++; // Benevolent

    return {
        alive: checksPassed === totalChecks,
        score: (checksPassed / totalChecks) * 100,
        failures
    };
}

async function assess() {
    console.log('--- SYSTEM ASSESSMENT STARTED ---');

    // 1. Login
    const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'beta.sofia@chefiapp.com',
        password: 'password123'
    });

    if (!authData.user) {
        console.error('CRITICAL: Login failed for beta.sofia');
        process.exit(1);
    }
    const userId = authData.user.id;
    console.log(`User Authenticated: ${userId}`);

    // 2. Resolve Tenant
    const { data: rests } = await supabase.from('gm_restaurants').select('*').eq('owner_id', userId);
    if (!rests || rests.length === 0) {
        console.error('CRITICAL: No tenant found');
        process.exit(1);
    }
    const tenant = rests[0];
    console.log(`Tenant Resolved: ${tenant.name} (${tenant.id})`);
    console.log(`Reality Status (DB): ${tenant.reality_status || 'NOT SET/DRAFT'}`);

    // 3. Code Scan
    console.log('\n--- CODE EXISTENCE SCAN ---');
    const codeStatus: Record<string, boolean> = {};
    for (const [key, path] of Object.entries(ROADMAP_FILES)) {
        const exists = await checkFileExists(path);
        codeStatus[key] = exists;
        console.log(`[${exists ? 'WARN' : 'MISS'}] ${key}: ${exists ? 'PRESENT' : 'MISSING'}`);
        // Note: Logic inverted in log message? 'WARN' for present? 
        // Fixing logic:
    }
    // Re-log correctly
    console.log('Corrected Log:');
    for (const [key, exists] of Object.entries(codeStatus)) {
        console.log(`[${exists ? 'OK' : 'FAIL'}] ${key}`);
    }

    // 4. Judges
    const genesis = await genesisJudge(tenant.id);
    const live = await liveJudge(tenant.id);

    // 5. Output JSON Report
    const report = {
        global: {
            tenant: tenant.name,
            reality_status_db: tenant.reality_status || 'DRAFT',
            genesis_readiness: genesis.score,
            live_readiness: live.score,
            code_coverage_key_features: Object.values(codeStatus).filter(x => x).length / Object.keys(codeStatus).length * 100
        },
        genesis_detail: genesis,
        live_detail: live,
        code_detail: codeStatus
    };

    console.log('\n--- FINAL JSON REPORT ---');
    console.log(JSON.stringify(report, null, 2));
}

assess().catch(console.error);
