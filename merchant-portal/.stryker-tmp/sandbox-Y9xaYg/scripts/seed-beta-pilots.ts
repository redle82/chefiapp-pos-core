import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load Environment
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
const loadEnv = (p: string) => fs.existsSync(p) && dotenv.config({ path: p });
loadEnv(envLocalPath);
loadEnv(envPath);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL');
    process.exit(1);
}

// We prefer Service Key to bypass email confirmation, but fallback to Anon
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY || '', {
    auth: { autoRefreshToken: false, persistSession: false }
});

const PILOTS = [
    {
        email: 'beta.sofia@chefiapp.com',
        password: 'password123',
        name: 'Sofia Gastrobar (Beta)',
        restaurantName: 'Sofia Gastrobar',
        slug: 'sofia-gastrobar-beta',
        category: 'bar'
    },
    {
        email: 'beta.luigi@chefiapp.com',
        password: 'password123',
        name: 'Luigi Pizza (Beta)',
        restaurantName: 'Luigi Pizza',
        slug: 'luigi-pizza-beta',
        category: 'restaurant' // Pizza falls under restaurant usually
    },
    {
        email: 'beta.lechef@chefiapp.com',
        password: 'password123',
        name: 'Le Chef (Beta)',
        restaurantName: 'Le Chef',
        slug: 'le-chef-beta',
        category: 'fine_dining' // Custom category if supported
    }
];

async function seed() {
    console.log('🌱 Starting Beta Pilot Seeding...');
    const results = [];

    for (const pilot of PILOTS) {
        console.log(`\nProcessing: ${pilot.name} (${pilot.email})`);

        let userId = null;
        let session = null;

        // 1. Create/Get User
        if (SERVICE_KEY) {
            // Admin Check
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === pilot.email);

            if (existing) {
                console.log('   👤 User already exists.');
                userId = existing.id;
            } else {
                console.log('   👤 Creating User (Admin)...');
                const { data, error } = await supabase.auth.admin.createUser({
                    email: pilot.email,
                    password: pilot.password,
                    email_confirm: true,
                    user_metadata: { name: pilot.name }
                });
                if (error) console.error('   ❌ Failed to create user:', error.message);
                userId = data.user?.id;
            }
        } else {
            // Public Sign Up
            console.log('   👤 Public Sign Up...');
            const { data, error } = await supabase.auth.signUp({
                email: pilot.email,
                password: pilot.password,
                options: { data: { name: pilot.name } }
            });

            if (error) {
                console.log('   ℹ️  Sign up result:', error.message);
                // Maybe they exist, try login?
                const { data: loginData } = await supabase.auth.signInWithPassword({
                    email: pilot.email,
                    password: pilot.password
                });
                if (loginData.session) {
                    userId = loginData.user.id;
                    session = loginData.session;
                    console.log('   ✅ Logged in existing user.');
                }
            } else {
                userId = data.user?.id;
                session = data.session;
            }
        }

        if (!userId) {
            console.log('   ❌ Skipping (No User ID)');
            continue;
        }

        // 2. Create Tenant (Atomic RPC)
        console.log('   🏢 Ensuring Tenant...');

        // Check if exists via RPC or query
        // Since we want to use the Sovereign RPC 'create_tenant_atomic':
        // It requires: user_id, name, slug (optional auto-gen), plan, operation_mode

        // We can only call RPC as the user (if Anon) or as Admin.

        try {
            // If we have a session (Anon), use it. If Admin (Service), use it.
            // CAUTION: create_tenant_atomic uses auth.uid(). If we are Service Role, auth.uid() is null/admin?
            // Usually RPCs using auth.uid() fail with Service Role unless we simulate user.

            // Checking simple query first
            const { data: existingRests, error: qErr } = await supabase
                .from('gm_restaurants')
                .select('*')
                .eq('owner_id', userId);

            if (existingRests && existingRests.length > 0) {
                console.log(`   ✅ Tenant exists: ${existingRests[0].name} (${existingRests[0].id})`);
                results.push({ ...pilot, status: 'EXISTS', id: existingRests[0].id });
                continue;
            }

            // Create via RPC
            // We need to impersonate if using Service Key? 
            // Better: Insert manually into gm_companies/gm_restaurants if we are Admin.
            // 'create_tenant_atomic' is complex logic (creates company + restaurant + members). Reference only.

            if (SERVICE_KEY) {
                // Manual Atomic Insert
                const { data: company } = await supabase.from('gm_companies').insert({
                    owner_id: userId,
                    name: `${pilot.name} Corp`,
                    plan: 'sovereign',
                    status: 'active'
                }).select().single();

                if (company) {
                    const { data: rest } = await supabase.from('gm_restaurants').insert({
                        company_id: company.id,
                        owner_id: userId,
                        name: pilot.restaurantName,
                        slug: pilot.slug,
                        category: pilot.category,
                        operation_status: 'active'
                    }).select().single();

                    if (rest) {
                        // Add Member
                        await supabase.from('gm_restaurant_members').insert({
                            restaurant_id: rest.id,
                            user_id: userId,
                            role: 'owner'
                        });
                        console.log('   ✨ Tenant Created (Manual Admin).');
                        results.push({ ...pilot, status: 'CREATED', id: rest.id });
                    }
                }
            } else if (session) {
                // Use RPC as User
                const { data: rpcData, error: rpcError } = await supabase.rpc('create_tenant_atomic', {
                    p_name: pilot.restaurantName,
                    p_plan: 'sovereign',
                    p_operation_mode: 'command'
                });

                if (rpcError) {
                    console.error('   ❌ RPC Failed:', rpcError);
                } else {
                    console.log('   ✨ Tenant Created (RPC).');
                    results.push({ ...pilot, status: 'CREATED', id: rpcData });
                }
            } else {
                console.log('   ⚠️ Email not confirmed. Cannot create tenant via RPC.');
            }

        } catch (err: any) {
            console.error('   ❌ Error:', err.message);
        }
    }

    console.log('\n🔍 --- PILOT SUMMARY ---');
    console.table(results);

    // Save to file for User
    const OUT_PATH = path.resolve(process.cwd(), 'beta-pilots.json');
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n💾 Saved pilot details to: ${OUT_PATH}`);
}

seed().catch(console.error);
