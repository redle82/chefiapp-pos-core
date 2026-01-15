import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false } // Service role context
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
    console.log('\n🔐 SETUP DELIVERY SECRETS (AIR GAP VAULT)\n');

    // 1. Select Restaurant
    const { data: restaurants, error: rError } = await supabase
        .from('gm_restaurants')
        .select('id, name');

    if (rError) {
        console.error('Error fetching restaurants:', rError.message);
        process.exit(1);
    }

    console.log('Available Restaurants:');
    restaurants?.forEach((r, i) => console.log(`${i + 1}. ${r.name} (${r.id})`));

    const choice = await question('\nSelect Restaurant # (or Enter ID): ');
    let restaurantId = '';

    const idx = parseInt(choice) - 1;
    if (!isNaN(idx) && restaurants && restaurants[idx]) {
        restaurantId = restaurants[idx].id;
        console.log(`✅ Selected: ${restaurants[idx].name}`);
    } else {
        restaurantId = choice.trim();
    }

    if (!restaurantId) {
        console.error('Invalid ID');
        process.exit(1);
    }

    // 2. Select Provider
    const provider = await question('Provider (glovo / uber / deliveroo) [glovo]: ') || 'glovo';

    // 3. Input Secrets
    console.log(`\n🔑 Entering credentials for ${provider}...`);
    const clientId = await question('Client ID / API Key: ');
    const clientSecret = await question('Client Secret: ');

    if (!clientId || !clientSecret) {
        console.error('❌ Credentials cannot be empty.');
        process.exit(1);
    }

    // 4. Save to Vault
    const { error: upsertError } = await supabase
        .from('gm_integration_secrets')
        .upsert({
            restaurant_id: restaurantId,
            provider: provider.toLowerCase(),
            credentials: {
                clientId,
                clientSecret
            },
            updated_at: new Date().toISOString()
        }, { onConflict: 'restaurant_id, provider' });

    if (upsertError) {
        console.error('❌ Failed to save secrets:', upsertError.message);
    } else {
        console.log('\n✅ SECRETS SECURED IN VAULT.');
        console.log('   The Frontend cannot access these. Only the Edge Function can.');
        console.log('   Run "npx supabase functions serve" to test proxy.');
    }

    rl.close();
}

main();
