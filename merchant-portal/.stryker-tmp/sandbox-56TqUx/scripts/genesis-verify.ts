// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { LAYER_0_LAW } from '../src/core/genesis/law';
import { LayerProof } from '../src/core/genesis/types';
import { GenesisKernel } from '../src/core/genesis/kernel';

// THE VERIFIER (CI Guard)
async function verify() {
    console.log(`🛡️  GENESIS VERIFIER v1 (Layer ${LAYER_0_LAW.layer})`);
    console.log(`-------------------------------------------`);

    const proofPath = path.resolve(process.cwd(), 'src/core/genesis/proof.layer0.json');

    if (!fs.existsSync(proofPath)) {
        console.error(`❌ CRITICAL: Proof file not found at ${proofPath}`);
        console.error(`   Run 'npm run prove' or 'npx tsx scripts/genesis-prove.ts' first.`);
        process.exit(1);
    }

    const proofRaw = fs.readFileSync(proofPath, 'utf8');
    let proof: LayerProof;

    try {
        proof = JSON.parse(proofRaw);
    } catch (e) {
        console.error(`❌ CRITICAL: Corrupted proof file.`);
        process.exit(1);
    }

    console.log(`🔍 Loading Proof...`);
    console.log(`   Layer: ${proof.layer}`);
    console.log(`   Signed By: ${proof.signedBy}`);
    console.log(`   Signed At: ${proof.signedAt}`);
    console.log(`-------------------------------------------`);

    // JUDGMENT
    const verdict = GenesisKernel.judge(LAYER_0_LAW, proof);

    if (verdict.unlocked) {
        console.log(`🔓 KERNEL VERDICT: UNLOCKED`);
        console.log(`   System is safe to proceed.`);
        process.exit(0);
    } else {
        console.log(`🔒 KERNEL VERDICT: LOCKED`);
        console.log(`   The following gates are blocking the system:`);
        verdict.blockers.forEach(b => console.log(`   🔴 ${b}`));
        console.error(`\n❌ VERIFICATION FAILED`);
        process.exit(1);
    }
}

verify();
