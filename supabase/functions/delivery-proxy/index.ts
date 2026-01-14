/**
 * Delivery Proxy — Edge Function
 * 
 * Acts as a secure gateway for delivery integrations (Glovo, Uber).
 * Frontend calls this function instead of direct API calls.
 * 
 * Features:
 * - 'sync': Polls orders from provider using stored secrets.
 * - 'auth': Handles OAuth token exchange (Client Credentials) securely.
 * 
 * Security:
 * - Requires User Auth (JWT).
 * - Reads secrets from 'gm_integration_secrets' using Service Role.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface SyncRequest {
    action: 'sync';
    restaurantId: string;
    provider: 'glovo' | 'uber';
}

interface GlovoCredentials {
    clientId: string;
    clientSecret: string;
}

Deno.serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const sbClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await sbClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. Parse Body
        const body: SyncRequest = await req.json();
        const { action, restaurantId, provider } = body;

        if (action !== 'sync') {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 4. Verification: Is User member of Restaurant?
        // Using simple RPC or table check.
        const { data: membership, error: memberError } = await sbClient
            .rpc('check_user_membership', { p_restaurant_id: restaurantId }); // Assuming this RPC exists or we check tables directly

        // Alternative: Check gm_restaurant_members directly
        const { data: isMember } = await sbClient
            .from('gm_restaurant_members')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: isOwner } = await sbClient
            .from('gm_restaurants')
            .select('id')
            .eq('id', restaurantId)
            .eq('owner_id', user.id)
            .maybeSingle();

        if (!isMember && !isOwner) {
            return new Response(JSON.stringify({ error: 'Forbidden: Not a member' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Get Secrets (Service Role)
        const sbAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: secretData, error: secretError } = await sbAdmin
            .from('gm_integration_secrets')
            .select('credentials')
            .eq('restaurant_id', restaurantId)
            .eq('provider', provider)
            .maybeSingle();

        if (secretError || !secretData) {
            // Graceful fail: if no secrets, maybe not configured.
            return new Response(JSON.stringify({ success: false, message: 'Provider not configured (No secrets found)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const credentials = secretData.credentials as GlovoCredentials;

        // 6. Execute Provider Logic
        if (provider === 'glovo') {
            const result = await syncGlovoOrders(credentials, restaurantId, sbAdmin);
            return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
            return new Response(JSON.stringify({ error: 'Provider not supported yet' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});

// --- POLL LOGIC ---

async function syncGlovoOrders(creds: GlovoCredentials, restaurantId: string, sbAdmin: any) {
    // A. OAuth
    const authUrl = 'https://open-api.glovoapp.com/oauth/token'; // Or use PROD URL
    const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: creds.clientId,
        client_secret: creds.clientSecret
    });

    const tokenRes = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams
    });

    if (!tokenRes.ok) {
        throw new Error(`Glovo Auth Failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // B. Fetch Orders
    const ordersUrl = 'https://open-api.glovoapp.com/v3/orders?status=PENDING';
    const ordersRes = await fetch(ordersUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!ordersRes.ok) {
        throw new Error(`Glovo Fetch Failed: ${ordersRes.status}`);
    }

    const data = await ordersRes.json();
    const orders = data.orders || [];
    let created = 0;

    // C. Upsert (Deduplication)
    for (const order of orders) {
        const { error } = await sbAdmin
            .from('integration_orders')
            .upsert({
                external_id: order.id,
                source: 'glovo',
                reference: order.id,
                restaurant_id: restaurantId,
                event_type: 'order.created',
                status: order.status.toUpperCase(), // Canonical Uppercase
                customer_name: order.customer.name,
                // ... map other fields (simplified for now) ...
                items: order.items,
                total_cents: Math.round(order.total * 100),
                raw_payload: order,
                received_at: new Date().toISOString()
            }, { onConflict: 'external_id,source' });

        if (!error) created++;
    }

    return { success: true, count: orders.length, created };
}
