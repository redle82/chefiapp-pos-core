import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 🚨 SECURITY HARDENING: Validate Caller Identity
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Missing Authorization header")

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) throw new Error("Invalid or expired session")

        // 🚨 SOVEREIGN IDENTITY: Derive user_id from JWT, ignore or validate body
        const body = await req.json().catch(() => ({}));
        const user_id = user.id; // Override with truth from JWT

        if (body.user_id && body.user_id !== user_id) {
            console.warn(`[Repair Security] Mismatch detected: Body claimed ${body.user_id}, JWT is ${user_id}. Using JWT.`)
        }

        console.log(`[Repair Service] Authorized repair for user: ${user_id}`)

        // 1. Find the restaurant where this user is the owner
        const { data: restaurant, error: restError } = await supabaseClient
            .from('gm_restaurants')
            .select('id')
            .eq('owner_id', user_id)
            .maybeSingle()

        if (restError || !restaurant) {
            throw new Error(restError?.message || "No restaurant found for this owner_id")
        }

        // 2. Upsert the membership
        const { error: memberError } = await supabaseClient.from('restaurant_members').upsert({
            restaurant_id: restaurant.id,
            user_id: user_id,
            role: 'owner'
        }, { onConflict: 'restaurant_id,user_id' })

        if (memberError) throw memberError

        console.log(`[Repair Service] Success: User ${user_id} linked to ${restaurant.id}`)

        return new Response(
            JSON.stringify({
                restaurant_id: restaurant.id,
                message: 'Membership repaired successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error(`[Repair Service] Error:`, error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
