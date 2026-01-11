
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const secretKey = process.env.STRIPE_SECRET_KEY || '';
const publicKey = process.env.VITE_STRIPE_PK || process.env.STRIPE_PUBLISHABLE_KEY || '';

console.log('🔒 Verifying Production Readiness...\n');

let ready = true;

// Check Secret Key
if (secretKey.startsWith('sk_live_')) {
    console.log('✅ STRIPE_SECRET_KEY: Loaded (Live Mode Detected)');
} else if (secretKey.startsWith('sk_test_')) {
    console.log('⚠️  STRIPE_SECRET_KEY: Loaded (TEST MODE)');
    ready = false;
} else {
    console.log('❌ STRIPE_SECRET_KEY: Missing or Invalid Format');
    ready = false;
}

// Check Public Key
if (publicKey.startsWith('pk_live_')) {
    console.log('✅ VITE_STRIPE_PK: Loaded (Live Mode Detected)');
} else if (publicKey.startsWith('pk_test_')) {
    console.log('⚠️  VITE_STRIPE_PK: Loaded (TEST MODE)');
    ready = false;
} else {
    console.log('❌ VITE_STRIPE_PK: Missing or Invalid Format');
    ready = false;
}

console.log('\n----------------------------------------');
if (ready) {
    console.log('🚀 SYSTEM ARMED FOR PRODUCTION SALE.');
    console.log('   The next transaction will verify real funds.');
    process.exit(0);
} else {
    console.log('🛑 SYSTEM NOT READY for Real Sale.');
    console.log('   Please update .env with sk_live_... and pk_live_...');
    process.exit(1);
}
