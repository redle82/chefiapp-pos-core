import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load Environment Variables (Priority: .env.local -> .env)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL');
    process.exit(1);
}

// Use Service Key if available, else Anon
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const CREDENTIALS_PATH = path.resolve(process.cwd(), 'tests/e2e/e2e-creds.json');

// Generate unique email to avoid Rate Limits and conflicts
const TIMESTAMP = Date.now();
const TEST_USER = {
    email: `sovereign.test.${TIMESTAMP}@chefiapp.com`,
    password: 'password123',
    name: 'Sovereign Tester'
};

async function seed() {
    console.log(`🌱 Seeding E2E User: ${TEST_USER.email}`);

    let userId = null;
    let session = null;

    if (SERVICE_KEY) {
        console.log('🔑 Using Service Key (Admin Mode)');
        // Unlikely to hit rate limits with Admin API
        const { data, error } = await supabase.auth.admin.createUser({
            email: TEST_USER.email,
            password: TEST_USER.password,
            email_confirm: true,
            user_metadata: { name: TEST_USER.name }
        });
        if (error) throw error;
        userId = data.user.id;
        console.log('✨ User Created via Admin.');
    } else {
        console.log('⚠️ Using Anon Key (Public Mode)');
        const { data, error } = await supabase.auth.signUp({
            email: TEST_USER.email,
            password: TEST_USER.password,
            options: { data: { name: TEST_USER.name } }
        });

        if (error) throw error;

        userId = data.user?.id;
        session = data.session;

        if (!session) {
            console.error('❌ User created but NOT confirmed (No Session).');
            console.error('CRITICAL: Cannot proceed with E2E unless "Enable Email Confirmations" is OFF in Supabase.');
            process.exit(1);
        } else {
            console.log('✅ User created and Auto-Confirmed.');
        }
    }

    if (!userId) throw new Error('Failed to obtain User ID');
    console.log('🆔 User ID:', userId);

    // Save Credentials for E2E Test
    // Ensure dir exists
    const dir = path.dirname(CREDENTIALS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(TEST_USER, null, 2));
    console.log(`💾 Credentials saved to: ${CREDENTIALS_PATH}`);

    // Seed Data (Company/Restaurant)
    // If Anon, we hope triggers did the work or RLS allows insert.
    // If Admin, we verify/insert.

    // Attempt logic (best effort if Anon)
    if (SERVICE_KEY) {
        // ---------------------------------------------------------------------
        // Company + Restaurant + Membership (Owner)
        // ---------------------------------------------------------------------
        // Check gm_companies
        const { data: companies } = await supabase
            .from('gm_companies')
            .select('*')
            .eq('owner_id', userId);
        let companyId = companies?.[0]?.id as string | undefined;

        if (!companyId) {
            console.log('🏢 Creating Company...');
            const { data: newComp, error: compErr } = await supabase
                .from('gm_companies')
                .insert({
                    owner_id: userId,
                    name: 'GoldMonkey Corp',
                    plan: 'sovereign',
                    status: 'active'
                })
                .select()
                .single();
            if (compErr) {
                console.warn('Warning: Company create failed:', compErr.message);
            } else {
                companyId = newComp?.id;
            }
        }

        let restaurantId: string | undefined;

        if (companyId) {
            // Check gm_restaurants
            const { data: rests } = await supabase
                .from('gm_restaurants')
                .select('*')
                .eq('owner_id', userId);
            if (!rests || rests.length === 0) {
                console.log('🍔 Creating Restaurant...');
                const { data: newRest, error: restErr } = await supabase
                    .from('gm_restaurants')
                    .insert({
                        company_id: companyId,
                        owner_id: userId,
                        name: 'Sovereign Burger Hub',
                        slug: 'sovereign-burger-hub',
                        status: 'active'
                    })
                    .select()
                    .single();
                if (restErr) {
                    console.warn('Warning: Restaurant create failed:', restErr.message);
                } else {
                    restaurantId = newRest?.id;
                }
            } else {
                restaurantId = rests[0]?.id;
            }
        }

        // Ensure membership as OWNER for this restaurant
        if (restaurantId) {
            const { data: existingMembers, error: memberErr } = await supabase
                .from('gm_restaurant_members')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('user_id', userId);

            if (memberErr) {
                console.warn('Warning: Membership lookup failed:', memberErr.message);
            } else if (!existingMembers || existingMembers.length === 0) {
                console.log('👤 Creating OWNER membership for restaurant...');
                const { error: insertMemberErr } = await supabase
                    .from('gm_restaurant_members')
                    .insert({
                        restaurant_id: restaurantId,
                        user_id: userId,
                        role: 'owner'
                    });
                if (insertMemberErr) {
                    console.warn('Warning: Membership create failed:', insertMemberErr.message);
                }
            }
        }
    } else {
        console.log('ℹ️  Skipping direct DB inserts (Anon Key). Relying on Database Triggers.');
    }

    console.log('✅ Seeding Complete.');
}

seed().catch(err => {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
});
