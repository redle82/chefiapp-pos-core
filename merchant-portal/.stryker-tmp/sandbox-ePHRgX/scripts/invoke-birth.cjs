// @ts-nocheck

const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function birth() {
    const timestamp = Date.now();
    const email = `confirmed.test.${timestamp}@gmail.com`;
    const password = 'Password123!';
    const restaurantName = `Bistro Confirmed ${timestamp}`;

    console.log(`[Birth Service] Invoking Birth Engine for: ${email}`);

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/create-tenant`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    restaurant_name: restaurantName,
                    owner_email: email,
                    password: password,
                    country: 'PT'
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('[Birth Service] Failed:', data);
            return;
        }

        console.log('[Birth Service] Success! User created and confirmed.');
        console.log('[Birth Service] Email:', email);
        console.log('[Birth Service] Password:', password);
        console.log('[Birth Service] Tenant ID:', data.tenant_id);
    } catch (error) {
        console.error('[Birth Service] Error:', error.message);
    }
}

birth();
