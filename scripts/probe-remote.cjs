
const dotenv = require('dotenv');
dotenv.config({ path: 'merchant-portal/.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function probe() {
    console.log(`[Diagnostic] Probing remote: ${SUPABASE_URL}`);

    // 1. Check Health Function
    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
            method: 'GET',
            headers: { 'apikey': ANON_KEY }
        });
        console.log(`[Health] Status: ${res.status} ${res.statusText}`);
        if (res.ok) console.log('[Health] Payload:', await res.json());
    } catch (e) {
        console.error('[Health] Error:', e.message);
    }

    // 2. Check OPTIONS (Preflight)
    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
            method: 'OPTIONS',
            headers: {
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization, x-client-info, apikey, content-type'
            }
        });
        console.log(`[CORS] Preflight Status: ${res.status}`);
        console.log(`[CORS] Headers:`, [...res.headers.entries()]);
    } catch (e) {
        console.error('[CORS] Error:', e.message);
    }
}

probe();
