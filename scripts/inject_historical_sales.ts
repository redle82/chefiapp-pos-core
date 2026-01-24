
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
// Note: This script assumes running from project root with local env or proper .env file
// For simplicity in this environment, I'll ask user to run or hardcode if needed for this session.
// Actually, better to read from config or just use the known URL/Key if I can.
// I'll assume environment variables are set or I'll use the ones I can find.

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Need service role for writing past dates

if (!supabaseKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required to inject historical data.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHistory() {
    console.log("🌱 Seeding 30 days of historical sales...");

    // Get a restaurant ID (e.g., Sofia Gastrobar)
    const { data: tenant } = await supabase.from('gm_tenants').select('id').eq('slug', 'sofia-gastrobar').single();
    if (!tenant) {
        console.error("❌ Tenant not found");
        return;
    }
    const restaurantId = tenant.id;

    const payments = [];
    const today = new Date();

    for (let i = 30; i > 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Random Daily Sales between 500€ and 1500€
        // Add some "trend" (increasing)
        const base = 50000;
        const trend = i * 1000;
        const random = Math.random() * 50000;
        const amount_cents = Math.floor(base + random + (30 - i) * 1000); // Inverse i for increasing trend

        // Simulate 5-10 transactions per day
        const numTx = 5 + Math.floor(Math.random() * 5);
        for (let j = 0; j < numTx; j++) {
            payments.push({
                restaurant_id: restaurantId,
                amount_cents: Math.floor(amount_cents / numTx),
                currency: 'eur',
                status: 'succeeded',
                provider: 'manual_seed',
                provider_tx_id: `seed_${date.getTime()}_${j}`,
                created_at: date.toISOString()
            });
        }
    }

    const { error } = await supabase.from('gm_payments').insert(payments);

    if (error) {
        console.error("❌ Error seeding:", error);
    } else {
        console.log(`✅ Successfully injected ${payments.length} transactions for the last 30 days.`);
    }
}

seedHistory();
