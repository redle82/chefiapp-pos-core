
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration
// Using REMOTE URL for DB access strictly (to read/write tables)
const SUPABASE_URL = 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

async function verifyBilling() {
    console.log('🚀 Starting Billing Verification (LOCAL Mode)...');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Login with Admin User
    const email = 'admin@admin.com';
    const password = 'admin123';
    console.log(`👤 Logging in as: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        console.error('❌ Auth Error:', authError);
        // If 500 persists, we exit
        process.exit(1);
    }

    const userId = authData.user?.id;
    console.log(`✅ Logged in: ${userId}`);

    if (!userId) process.exit(1);

    // 2. Get or Create Test Restaurant
    // We need to ensure the user has a restaurant to be billed.
    console.log(`JX Checking for existing restaurant...`);

    const { data: existingRestaurant, error: fetchError } = await supabase
        .from('gm_restaurants')
        .select('*')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle();

    let restaurantId;

    if (existingRestaurant) {
        restaurantId = existingRestaurant.id;
        console.log(`✅ Found existing restaurant: ${restaurantId} (${existingRestaurant.name})`);
    } else {
        restaurantId = uuidv4();
        console.log(`JX Creating new restaurant: ${restaurantId}`);

        const { error: restError } = await supabase
            .from('gm_restaurants')
            .insert({
                id: restaurantId,
                owner_id: userId,
                name: 'Billing Test Restaurant',
                slug: `billing-test-${Date.now()}`,
                status: 'active'
            });

        if (restError) {
            console.error('❌ Failed to create restaurant:', restError);
            console.warn('⚠️ Proceeding anyway, hoping read works later...');
        } else {
            console.log('✅ Restaurant created.');
        }
    }

    // 3. Invoke Edge Function (Localhost)
    console.log('⚡ Invoking stripe-billing (LOCALLY)...');

    const accessToken = authData.session?.access_token;
    console.log('🔑 ACCESS TOKEN:', accessToken);

    // Use User Token
    const response = await fetch('http://127.0.0.1:54321/functions/v1/stripe-billing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-test-bypass': 'bypass-auth-for-testing'
        },
        body: JSON.stringify({
            action: 'create-checkout-session',
            priceId: 'price_1ShJzFEOB1Od9eibaF3j7BG9',
            successUrl: 'http://localhost:3000/success',
            cancelUrl: 'http://localhost:3000/cancel',
        })
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`❌ Function Invocation Error: ${response.status} ${response.statusText}`, text);
    } else {
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log('📦 Function Response:', data);
            if (data.sessionId) {
                console.log(`✅ Checkout Session Created: ${data.url}`);
            } else if (data.url) {
                console.log(`✅ Session URL Created: ${data.url}`);
            } else if (data.error) {
                console.log(`⚠️ Function returned error (Expected if Price ID is invalid): ${data.error}`);
            }
        } catch (e) {
            console.log('📦 Non-JSON Response:', text);
        }
    }
}

verifyBilling();
