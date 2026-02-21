
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../merchant-portal/.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function forceBirth() {
    const timestamp = Date.now();
    const email = `confirmed.${timestamp}@chefiapp.com`;
    const password = 'Password123!';
    const restaurantName = `Bistro Force ${timestamp}`;

    console.log(`[Force Birth] Target URL: ${SUPABASE_URL}`);
    console.log(`[Force Birth] Email: ${email}`);

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
                    country: 'BR'
                })
            }
        );

        console.log(`[Force Birth] Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log(`[Force Birth] Body:`, JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ ACCOUNT CREATED SUCCESSFULLY');
            console.log(`EMAIL: ${email}`);
            console.log(`PASSWORD: ${password}`);
        } else {
            console.log('\n❌ FAILED TO CREATE ACCOUNT');
        }
    } catch (error) {
        console.error(`[Force Birth] Critical Error: ${error.message}`);
    }
}

forceBirth();
