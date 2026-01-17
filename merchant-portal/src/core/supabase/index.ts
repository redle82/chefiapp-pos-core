import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../../config'

// Phase F: Real Backend Connection
// Singleton Client
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

// Log initialization in Dev
if (CONFIG.IS_DEV) {
    console.log('[ENV CHECK] VITE_SUPABASE_URL:', CONFIG.SUPABASE_URL);

    // OPTION 3: Automatic Validation
    const EXPECTED_PROJECT_ID = 'qonfbtwsxeggxbkhqnxl';
    const isLocalSupabase = CONFIG.SUPABASE_URL.includes('127.0.0.1') || CONFIG.SUPABASE_URL.includes('localhost');
    const isCorrectEnv = CONFIG.SUPABASE_URL.includes(EXPECTED_PROJECT_ID);

    if (!isCorrectEnv && !isLocalSupabase) {
        // Only warn if not using local Supabase and not using correct cloud
        console.warn(`
        ⚠️  ENVIRONMENT MISMATCH ⚠️
        -----------------------------------
        Expected: ${EXPECTED_PROJECT_ID}
        Actual:   ${CONFIG.SUPABASE_URL}
        
        You are NOT connected to the cloud database monitor. 
        Data will not appear in the dashboard.
        -----------------------------------
        `);
    } else if (isLocalSupabase) {
        console.log('✅ Using Local Supabase (Development Mode):', CONFIG.SUPABASE_URL);
    } else {
        console.log('✅ Connected to Correct Cloud Database:', EXPECTED_PROJECT_ID);
    }
}
