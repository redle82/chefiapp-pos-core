import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { LAYER_1_LAW } from '../src/core/genesis/law.layer1';
import { LayerProof, GateEvidence } from '../src/core/genesis/types';
import { GenesisKernel } from '../src/core/genesis/kernel';
import * as dotenv from 'dotenv';

// Load ENV for script
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''; // Ideally Service Role for rigorous check, but Anon is safer in repo

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ENV Missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function evidence(pass: boolean, meta: any = {}): GateEvidence {
    return {
        status: pass ? 'pass' : 'fail',
        timestamp: new Date().toISOString(),
        meta
    };
}

// THE PROVER (Layer 1)
async function prove() {
    console.log(`🛡️  GENESIS PROVER v1 (Layer ${LAYER_1_LAW.layer})`);
    console.log(`-------------------------------------------`);

    const proof: LayerProof = {
        layer: LAYER_1_LAW.layer,
        version: '1.0.0',
        gates: {},
        signedBy: 'script:genesis-prove-l1',
        signedAt: new Date().toISOString()
    };

    // 1. Gate: db_reachable
    console.log(`🔍 Checking Gate: db_reachable...`);
    const { data: ping, error: pingErr } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    const isReachable = !pingErr;
    proof.gates['db_reachable'] = evidence(isReachable, { error: pingErr?.message });
    console.log(isReachable ? '✅ PASS' : `❌ FAIL: ${pingErr?.message}`);

    // 2. Gate: schema_valid
    console.log(`🔍 Checking Gate: schema_valid...`);
    // We check by select single row from critical tables
    const tables = ['companies', 'menus', 'menu_categories', 'products', 'orders'];
    let tablesOk = true;
    const missingTables = [];

    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (error && error.code === '42P01') { // undefined_table
            tablesOk = false;
            missingTables.push(t);
        }
    }
    proof.gates['schema_valid'] = evidence(tablesOk, { missing: missingTables });
    console.log(tablesOk ? '✅ PASS' : `❌ FAIL: Missing ${missingTables.join(', ')}`);

    // 3. Gate: seed_verified (Pilot Check)
    console.log(`🔍 Checking Gate: seed_verified (Sofia Check)...`);
    const { data: sofia } = await supabase
        .from('companies')
        .select('id, slug')
        .or('slug.eq.sofia-gastrobar, slug.eq.sofia-gastrobar-dev')
        .maybeSingle();

    const sofiaOk = !!sofia;
    proof.gates['seed_verified'] = evidence(sofiaOk, { found: sofia?.slug || 'none' });
    console.log(sofiaOk ? '✅ PASS' : '⚠️ WARN: Sofia not found (Ops warning)');


    // Save Proof
    const proofPath = path.resolve(process.cwd(), 'src/core/genesis/proof.layer1.json');
    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
    console.log(`-------------------------------------------`);
    console.log(`🧾 Proof generated at: ${proofPath}`);

    // Immediate Verdict
    const verdict = GenesisKernel.judge(LAYER_1_LAW, proof);
    if (verdict.unlocked) {
        console.log(`🔓 KERNEL VERDICT: UNLOCKED`);
        process.exit(0);
    } else {
        console.log(`🔒 KERNEL VERDICT: LOCKED`);
        console.log(`   Blockers:`, verdict.blockers);
        process.exit(1);
    }
}

prove();
