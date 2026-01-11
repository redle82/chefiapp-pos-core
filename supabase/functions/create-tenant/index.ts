// Setup via: supabase functions new create-tenant
// Deploy via: supabase functions deploy create-tenant

// ⚠️ CORE SYSTEM — DO NOT MODIFY WITHOUT REVIEW
// This function creates users + tenants + initial data (The Birth Engine)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { restaurant_name, owner_email, password, country, user_id } = await req.json()

        // 1. Validation
        // If user_id is provided, password is not required (OAuth flow)
        if (!restaurant_name || !owner_email || (!password && !user_id)) {
            throw new Error("Missing required fields")
        }

        console.log(`[Birth Engine] Creating tenant for: ${owner_email} - ${restaurant_name}`)

        let userId = user_id;
        let createdUserNow = false;

        // 2. Resolve User (Identity)
        if (!userId) {
            // Standard Signup Flow (Email/Password)
            const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
                email: owner_email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    role: 'owner',
                    created_via: 'cold_signup_engine'
                }
            })

            if (userError) {
                // PONTO CRÍTICO 1: 409 Conflict for existing user
                if (userError.message.includes('already has been registered')) {
                    return new Response(
                        JSON.stringify({ error: 'OWNER_ALREADY_EXISTS' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
                    )
                }
                throw userError
            }
            userId = userData.user.id;
            createdUserNow = true;
            console.log(`[Birth Engine] New user created: ${userId}`)
        } else {
            console.log(`[Birth Engine] Using existing user: ${userId}`)
        }

        // 🚨 IDEMPOTENCY CHECK: Do they already have a restaurant?
        const { data: existingRestaurant } = await supabaseClient
            .from('gm_restaurants')
            .select('id')
            .eq('owner_id', userId)
            .maybeSingle();

        if (existingRestaurant) {
            console.log(`[Birth Engine] Restaurant already exists for user ${userId}. Recovering membership if missing.`)

            // Ensure membership exists (Recovery Path / Scenario A fix)
            const { error: recoveryError } = await supabaseClient.from('restaurant_members').upsert({
                restaurant_id: existingRestaurant.id,
                user_id: userId,
                role: 'owner'
            }, { onConflict: 'restaurant_id,user_id' });

            if (recoveryError) {
                console.error(`[Birth Engine] Membership recovery failed: ${recoveryError.message}`);
                // Continue anyway as tenant_id is correct, but the link might still be broken
            }

            return new Response(
                JSON.stringify({
                    tenant_id: existingRestaurant.id,
                    owner_id: userId,
                    role: 'owner',
                    message: 'Tenant already exists (Idempotent success)'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 3. Create Owner Profile (Identity) - UPSERT to prevent failure on OAuth re-run
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
                id: userId,
                role: 'owner',
                full_name: 'Comandante', // Default name
                email: owner_email
            }, { onConflict: 'id' })

        if (profileError) {
            console.error(`[Birth Engine] Profile creation failed: ${profileError.message}`)
            if (createdUserNow) {
                console.log(`[Birth Engine] Rolling back user creation for ${userId}`)
                await supabaseClient.auth.admin.deleteUser(userId)
            }
            throw new Error(`Failed to create profile: ${profileError.message}`)
        }

        console.log(`[Birth Engine] Profile upserted for user: ${userId}`)

        // 4. Create Restaurant (The Tenant)
        // Sentinel: Slug Normalization (Robust)
        const baseSlug = restaurant_name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        // Append 6 char hash for uniqueness
        const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`

        const { data: restaurantData, error: restaurantError } = await supabaseClient
            .from('gm_restaurants')
            .insert({
                name: restaurant_name,
                slug: slug,
                owner_id: userId,
                status: 'active', // Born alive
                country: country || 'ES', // Sentinel: Default ES
                plan: 'trial'
            })
            .select()
            .single()

        if (restaurantError) {
            console.error(`[Birth Engine] Restaurant creation failed: ${restaurantError.message}`)
            if (createdUserNow) {
                console.log(`[Birth Engine] Rolling back user creation for ${userId}`)
                await supabaseClient.auth.admin.deleteUser(userId)
            }
            throw new Error(`Failed to create restaurant: ${restaurantError.message}`)
        }

        const restaurantId = restaurantData.id
        console.log(`[Birth Engine] Restaurant created: ${restaurantId}`)

        // 5. Create Membership (The Link)
        try {
            // Membership
            const { error: memberError } = await supabaseClient
                .from('restaurant_members')
                .insert({
                    restaurant_id: restaurantId,
                    user_id: userId,
                    role: 'owner'
                })
            if (memberError) throw memberError

        } catch (permissionError) {
            // Sentinel: Full Rollback (User + Restaurant)
            console.error(`[Birth Engine] Membership setup failed: ${permissionError.message}. Initiating FULL ROLLBACK.`)

            // Delete Restaurant
            await supabaseClient.from('gm_restaurants').delete().eq('id', restaurantId)

            if (createdUserNow) {
                console.log(`[Birth Engine] Rolling back user creation for ${userId}`)
                await supabaseClient.auth.admin.deleteUser(userId)
            }

            throw new Error(`Failed to setup permissions. Please try again. System rolled back.`)
        }

        // 5. Seed Initial Data (The Menu & Pulse)

        // Default Category
        const { data: catData } = await supabaseClient
            .from('menu_categories')
            .insert({ restaurant_id: restaurantId, name: 'Principais', sort_order: 1 })
            .select()
            .single()

        // Default Item (Demo)
        // PONTO CRÍTICO 4: price_cents standardization
        if (catData) {
            await supabaseClient.from('menu_items').insert({
                restaurant_id: restaurantId,
                category_id: catData.id,
                name: 'Exemplo: Burger da Casa',
                price: 12.00, // Legacy support if needed
                price_cents: 1200, // Modern standard
                currency: 'EUR',
                available: true
            })
        }

        // Initial Empire Pulse (Heartbeat) - PONTO CRÍTICO 4
        await supabaseClient.from('empire_pulses').insert({
            restaurant_id: restaurantId,
            type: 'BIRTH',
            status: 'online',
            metadata: {
                origin: 'cold_signup',
                message: 'Restaurant system initialized.'
            }
        })

        console.log(`[Birth Engine] Pulse started for ${restaurantId}`)

        return new Response(
            JSON.stringify({
                tenant_id: restaurantId, // Contract: tenant_id
                owner_id: userId,        // Contract: owner_id (Explicit)
                role: 'owner',           // Contract: role (Explicit)
                message: 'Tenant born successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error(`[Birth Engine] Fatal Error:`, error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
