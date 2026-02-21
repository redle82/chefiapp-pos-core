
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function signup(email, password) {
    console.log(`[Smoke Test] Signing up user: ${email}`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('[Smoke Test] Signup failed:', error.message);
        process.exit(1);
    }

    console.log('[Smoke Test] Signup successful for:', data.user.email);
    console.log('[Smoke Test] User ID:', data.user.id);
    process.exit(0);
}

const timestamp = Date.now();
// Using a more standard email format
const email = `smoke.test.birth.${timestamp}@gmail.com`;
const password = 'Password123!';

signup(email, password);
