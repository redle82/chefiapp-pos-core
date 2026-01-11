import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^14.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_BILLING_WEBHOOK_SECRET')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const signature = req.headers.get('stripe-signature')
        if (!endpointSecret || !signature) {
            throw new Error('Missing secret or signature')
        }

        const body = await req.text()
        let event
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                endpointSecret
            )
        } catch (err) {
            throw new Error(`Webhook signature verification failed: ${err.message}`)
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`Processing event: ${event.type}`)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            const restaurantId = session.metadata?.supabase_restaurant_id
            const subscriptionId = session.subscription

            if (restaurantId && subscriptionId) {
                console.log(`Linking subscription ${subscriptionId} to restaurant ${restaurantId}`)

                // Initial status might be incomplete, but usually active after checkout
                // We will rely on subscription.updated for detailed status sync, but it's good to link immediately.

                const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)

                await supabaseClient
                    .from('gm_restaurants')
                    .update({
                        subscription_id: subscriptionId,
                        billing_status: subscription.status,
                        plan: 'SOVEREIGN' // Assume standard plan for now
                    })
                    .eq('id', restaurantId)
            }
        } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object
            const restaurantId = subscription.metadata?.supabase_restaurant_id

            // If metadata is missing on subscription (because it was set on checkout session), 
            // we might need to look it up by stripe_customer_id in our DB.

            let targetRestaurantId = restaurantId

            if (!targetRestaurantId) {
                const customerId = subscription.customer
                const { data: restaurant } = await supabaseClient
                    .from('gm_restaurants')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                targetRestaurantId = restaurant?.id
            }

            if (targetRestaurantId) {
                const status = subscription.status
                const plan = (status === 'active' || status === 'trialing') ? 'SOVEREIGN' : 'FREE'

                // Note: Simplistic logic. If canceled, we might downgrade to FREE or just mark status.
                // Let's stick to updating status and let the app decide access.

                await supabaseClient
                    .from('gm_restaurants')
                    .update({
                        billing_status: status,
                        subscription_id: subscription.id,
                        // Only change plan to Sovereign if active, otherwise maybe keep it but let status block access?
                        // Better: If deleted/canceled, keep plan tag but status indicates access is lost.
                        // Or set plan to downgraded. 
                        // Let's just update fields for now.
                        billing_status: status
                    })
                    .eq('id', targetRestaurantId)

                console.log(`Updated restaurant ${targetRestaurantId} status to ${status}`)
            } else {
                console.warn(`Could not find restaurant for subscription ${subscription.id}`)
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
