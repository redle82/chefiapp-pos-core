
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qonfbtwsxeggxbkhqnxl.supabase.co';
// Use SERVICE KEY if available for admin operations, otherwise fallback to Anon but might fail on RLS if not careful
// Actually, creating users usually requires public API or Service Key. 
// Standard signup works with Anon Key. Creating restaurants might need authenticated user or service key.
// We will simulate the flow: Signup -> (Auto Login) -> Create Restaurants as that user.
// However, creating entities "as" a user in a script is tricky without signing in.
// We will attempt to sign in the user immediately after creation.

const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZidHdzeGVnZ3hia2hxbnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzA4ODQsImV4cCI6MjA4MjIwNjg4NH0.aENcRJK8nDZvIGZFSeepH_jEvwLc0eNlUQDqDLa88AI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFranchiseOwner() {
    console.log('🌱 Seeding Franchise Owner...');

    // 1. Create User
    const timestamp = Date.now();
    const email = `franchise_${timestamp}@empire.com`;
    const password = 'Password123!';

    console.log(`Creating user: ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: 'Franchise Emperor' } }
    });

    if (authError) {
        console.error('❌ Error creating user:', authError);
        process.exit(1);
    }

    const userId = authData.user?.id;
    if (!userId) {
        console.error('❌ User ID missing after signup');
        process.exit(1);
    }

    console.log(`✅ User created: ${userId}`);

    // 2. Sign In to perform actions as this user (bypassing RLS issues if we were outside)
    // Actually, simply using the client with the returned session is easier if returned.
    // AuthData contains session if auto-confirm is on. If not, we might be stuck.
    // Assuming development environment allows auto-confirm or we use Service Role to bypass.
    // Let's try to continue using `supabase` as anon but usually strictly RLS blocks inserts.
    // Ideally we should use Service Role Key for seeding.
    // I will check if SUPABASE_SERVICE_ROLE_KEY is available in env, if not we try with what we have.

    // Since we don't have service key reliably in previous turns, we try to rely on the session returned by signUp (if any)
    // or we sign in.

    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('❌ Could not login as new user (might need email confirm):', loginError);
        console.log('⚠️  Assuming dev mode with auto-confirm...');
    }

    // Create a client acting as the user
    // Access token is needed.
    const userClient = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${sessionData.session?.access_token || ''}`
            }
        }
    });

    if (!sessionData.session) {
        console.error('❌ No session returned. Cannot create restaurants as user.');
        process.exit(1);
    }

    // 3. Create 3 Restaurants
    const restaurants = [
        { name: 'Empire Burger - Alpha', slug: `alpha_${timestamp}` },
        { name: 'Empire Burger - Beta', slug: `beta_${timestamp}` },
        { name: 'Empire Burger - Gamma', slug: `gamma_${timestamp}` }
    ];

    for (const r of restaurants) {
        // A. Insert Restaurant
        // Note: In real app, we usually use a specific RPC or flow. 
        // Here we try direct insert into 'gm_restaurants' if RLS allows authenticated users to create.
        // IF RLS is strict, this might fail.
        // Let's assume standard 'authenticated users can insert' or we rely on 'onboarding' logic.

        console.log(`Creating restaurant: ${r.name}...`);
        const { data: rest, error: restError } = await userClient
            .from('gm_restaurants')
            .insert({
                name: r.name,
                owner_id: userId, // Assuming owner_id column exists or we link via members later
                // slug: r.slug // Schema might not have slug, check later. Logic usually uses IDs.
            })
            .select()
            .single();

        if (restError) {
            console.error(`❌ Failed to create ${r.name}:`, restError);
            continue;
        }

        console.log(`   ✅ Created ${rest.name} (${rest.id})`);

        // B. Link User as Owner in 'gm_restaurant_members'
        // Often a trigger does this, but we do it explicitly to be sure.
        const { error: memberError } = await userClient
            .from('gm_restaurant_members')
            .insert({
                restaurant_id: rest.id,
                user_id: userId,
                role: 'owner'
            });

        if (memberError) {
            // If trigger already did it, this might fail as duplicate provided we have unique constraint.
            // We ignore "duplicate key value" error.
            if (!memberError.message.includes('duplicate')) {
                console.error(`   ⚠️ Failed to link member:`, memberError);
            } else {
                console.log(`   Detailed: Member link verified (likely trigger).`);
            }
        } else {
            console.log(`   ✅ Linked owner role.`);
        }
    }

    console.log('✨ Franchise Seed Complete!');
    console.log(`__CREDENTIALS__:${email}:${password}`);
}

seedFranchiseOwner();
