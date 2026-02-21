import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { LAYER_0_LAW } from '../src/core/genesis/law';
import { LayerProof, GateEvidence } from '../src/core/genesis/types';
import { GenesisKernel } from '../src/core/genesis/kernel';

// Helper: Run Shell Command
function run(cmd: string): boolean {
    try {
        execSync(cmd, { stdio: 'pipe' });
        return true;
    } catch (e) {
        return false;
    }
}

// Helper: Capture Evidence
function evidence(pass: boolean, meta: any = {}): GateEvidence {
    return {
        status: pass ? 'pass' : 'fail',
        timestamp: new Date().toISOString(),
        meta
    };
}

// THE PROVER
async function prove() {
    console.log(`🛡️  GENESIS PROVER v1 (Layer ${LAYER_0_LAW.layer})`);
    console.log(`-------------------------------------------`);

    const proof: LayerProof = {
        layer: LAYER_0_LAW.layer,
        version: '1.0.0',
        gates: {},
        signedBy: 'script:genesis-prove',
        signedAt: new Date().toISOString()
    };

    // 1. Gate: no_critical_bloat (Type Check)
    console.log(`🔍 Checking Gate: no_critical_bloat...`);
    const tscOk = run('npx tsc -b');
    proof.gates['no_critical_bloat'] = evidence(tscOk, { command: 'tsc -b' });
    console.log(tscOk ? '✅ PASS' : '❌ FAIL');

    // 2. Gate: routes_alive (Playwright)
    // We re-use the automated walkthrough we just built
    console.log(`🔍 Checking Gate: routes_alive...`);
    const e2eOk = run('npx playwright test e2e/antigravity-ui-walkthrough.spec.ts');
    proof.gates['routes_alive'] = evidence(e2eOk, { spec: 'antigravity-ui-walkthrough.spec.ts' });
    console.log(e2eOk ? '✅ PASS' : '❌ FAIL');

    // 3. Gate: env_sanitized (Grep Secrets)
    // Simple check for hardcoded 'sk_live_' in src (excluding proof files)
    console.log(`🔍 Checking Gate: env_sanitized...`);
    const hasSecrets = run(`grep -r "sk_live_" src --exclude-dir=genesis`);
    proof.gates['env_sanitized'] = evidence(!hasSecrets, { check: 'grep sk_live_' });
    console.log(!hasSecrets ? '✅ PASS' : '❌ FAIL');

    // Save Proof
    const proofPath = path.resolve(process.cwd(), 'src/core/genesis/proof.layer0.json');
    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
    console.log(`-------------------------------------------`);
    console.log(`🧾 Proof generated at: ${proofPath}`);

    // Immediate Verdict
    const verdict = GenesisKernel.judge(LAYER_0_LAW, proof);
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
