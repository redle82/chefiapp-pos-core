
const dotenv = require('dotenv');
const path = require('path');
// Since this is in merchant-portal/scripts/, .env is in ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function signupBirth() {
    const timestamp = Date.now();
    const email = `test.birth.${timestamp}@gmail.com`;
    const password = 'Password123!';

    if (!SUPABASE_URL) {
        console.error('ERROR: VITE_SUPABASE_URL not found in .env');
        return;
    }

    console.log(`[Signup Birth] URL: ${SUPABASE_URL}`);
    console.log(`[Signup Birth] Email: ${email}`);

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                data: {
                    role: 'owner',
                    born_at: new Date().toISOString()
                }
            })
        });

        const data = await response.json();
        console.log(`[Signup Birth] Status: ${response.status}`);

        if (response.ok) {
            console.log('\n✅ SIGNUP SUCCESSFUL');
            console.log(`EMAIL: ${email}`);
            console.log(`PASSWORD: ${password}`);
            if (data.session) {
                console.log('AUTO-CONFIRMED: YES');
            } else {
                console.log('AUTO-CONFIRMED: NO (Check email or Supabase settings)');
            }
        } else {
            console.log('\n❌ SIGNUP FAILED');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('[Signup Birth] Error:', e.message);
    }
}

signupBirth();
