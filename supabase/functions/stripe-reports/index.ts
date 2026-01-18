import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^14.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Authenticate User
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        const { action, restaurantId } = await req.json()

        if (!restaurantId) throw new Error('Restaurant ID required');

        // Security: Ensure user owns this restaurant
        const { data: restaurant, error: fetchError } = await supabaseClient
            .from('gm_restaurants')
            .select('id, stripe_account_id, owner_id')
            .eq('id', restaurantId)
            .single()

        if (fetchError || !restaurant) {
            throw new Error('Restaurant not found or access denied.')
        }

        // We need the Connected Account ID to fetch THEIR balance/payouts
        const connectedAccountId = restaurant.stripe_account_id;

        if (!connectedAccountId) {
            // If they don't have a connected account, they can't have payouts from TPV
            return new Response(
                JSON.stringify({
                    balance: { available: 0, pending: 0 },
                    payouts: [],
                    message: "No connected Stripe account found."
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        const stripeOptions = {
            stripeAccount: connectedAccountId,
        };

        if (action === 'get-financials') {
            // Parallel Fetch: Balance + Payouts
            const [balance, payouts] = await Promise.all([
                stripe.balance.retrieve(stripeOptions),
                stripe.payouts.list({ limit: 10 }, stripeOptions)
            ]);

            // Transform for Frontend
            const available = balance.available.reduce((acc, curr) => acc + curr.amount, 0);
            const pending = balance.pending.reduce((acc, curr) => acc + curr.amount, 0);

            const transformedPayouts = payouts.data.map(p => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                arrival_date: p.arrival_date,
                created: p.created
            }));

            return new Response(
                JSON.stringify({
                    balance: { available, pending, currency: balance.available[0]?.currency || 'eur' },
                    payouts: transformedPayouts
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        throw new Error('Invalid action')

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
