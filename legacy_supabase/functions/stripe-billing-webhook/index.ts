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

        // =========================================================================
        // EVENT: checkout.session.completed
        // =========================================================================
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            const restaurantId = session.metadata?.supabase_restaurant_id
            const subscriptionId = session.subscription

            if (restaurantId && subscriptionId) {
                console.log(`[Billing Webhook] Linking subscription ${subscriptionId} to restaurant ${restaurantId}`)

                const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
                const customerId = subscription.customer as string

                // Criar/atualizar registro em gm_billing_subscriptions
                await supabaseClient
                    .from('gm_billing_subscriptions')
                    .upsert({
                        restaurant_id: restaurantId,
                        stripe_subscription_id: subscriptionId,
                        stripe_customer_id: customerId,
                        plan: session.metadata?.plan || 'starter',
                        status: subscription.status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end || false,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'restaurant_id'
                    })

                // Portal/Core use gm_restaurants.billing_status for trial | active | past_due | canceled
                await supabaseClient
                    .from('gm_restaurants')
                    .update({ billing_status: 'active', updated_at: new Date().toISOString() })
                    .eq('id', restaurantId)

                console.log(`[Billing Webhook] Subscription ${subscriptionId} linked to restaurant ${restaurantId}; billing_status=active`)
            }
        }
        // =========================================================================
        // EVENT: customer.subscription.created
        // =========================================================================
        else if (event.type === 'customer.subscription.created') {
            const subscription = event.data.object
            const restaurantId = subscription.metadata?.supabase_restaurant_id
            const customerId = subscription.customer as string

            if (!restaurantId) {
                // Tentar buscar por customer_id
                const { data: restaurant } = await supabaseClient
                    .from('gm_restaurants')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single()

                if (restaurant) {
                    const targetRestaurantId = restaurant.id

                    await supabaseClient
                        .from('gm_billing_subscriptions')
                        .upsert({
                            restaurant_id: targetRestaurantId,
                            stripe_subscription_id: subscription.id,
                            stripe_customer_id: customerId,
                            plan: subscription.metadata?.plan || 'starter',
                            status: subscription.status,
                            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                            cancel_at_period_end: subscription.cancel_at_period_end || false,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: 'restaurant_id'
                        })

                    if (subscription.status === 'active') {
                        await supabaseClient
                            .from('gm_restaurants')
                            .update({ billing_status: 'active', updated_at: new Date().toISOString() })
                            .eq('id', targetRestaurantId)
                    }
                    console.log(`[Billing Webhook] Subscription ${subscription.id} created for restaurant ${targetRestaurantId}`)
                }
            } else {
                await supabaseClient
                    .from('gm_billing_subscriptions')
                    .upsert({
                        restaurant_id: restaurantId,
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: customerId,
                        plan: subscription.metadata?.plan || 'starter',
                        status: subscription.status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end || false,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'restaurant_id'
                    })

                if (subscription.status === 'active') {
                    await supabaseClient
                        .from('gm_restaurants')
                        .update({ billing_status: 'active', updated_at: new Date().toISOString() })
                        .eq('id', restaurantId)
                }
                console.log(`[Billing Webhook] Subscription ${subscription.id} created for restaurant ${restaurantId}`)
            }
        }
        // =========================================================================
        // EVENT: customer.subscription.updated / customer.subscription.deleted
        // =========================================================================
        else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
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
                const status = event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status

                // Atualizar gm_billing_subscriptions
                await supabaseClient
                    .from('gm_billing_subscriptions')
                    .update({
                        status: status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end || false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_subscription_id', subscription.id)

                // Sync gm_restaurants.billing_status: active | past_due | canceled
                const billingStatus = status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired' ? 'canceled' : (status === 'past_due' ? 'past_due' : 'active')
                await supabaseClient
                    .from('gm_restaurants')
                    .update({ billing_status: billingStatus, updated_at: new Date().toISOString() })
                    .eq('id', targetRestaurantId)

                console.log(`[Billing Webhook] Updated subscription ${subscription.id} status to ${status} for restaurant ${targetRestaurantId}; billing_status=${billingStatus}`)
            } else {
                console.warn(`[Billing Webhook] Could not find restaurant for subscription ${subscription.id}`)
            }
        }
        // =========================================================================
        // EVENT: invoice.paid
        // =========================================================================
        else if (event.type === 'invoice.paid') {
            const invoice = event.data.object
            const subscriptionId = invoice.subscription as string
            const customerId = invoice.customer as string

            // Buscar subscription para obter restaurant_id
            const { data: subscription } = await supabaseClient
                .from('gm_billing_subscriptions')
                .select('restaurant_id, id')
                .eq('stripe_subscription_id', subscriptionId)
                .single()

            if (subscription) {
                // Criar/atualizar invoice em gm_billing_invoices
                await supabaseClient
                    .from('gm_billing_invoices')
                    .upsert({
                        restaurant_id: subscription.restaurant_id,
                        subscription_id: subscription.id,
                        stripe_invoice_id: invoice.id,
                        amount_cents: invoice.amount_paid,
                        currency: invoice.currency || 'BRL',
                        status: 'paid',
                        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
                        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'stripe_invoice_id'
                    })

                console.log(`[Billing Webhook] Invoice ${invoice.id} marked as paid for restaurant ${subscription.restaurant_id}`)
            } else {
                console.warn(`[Billing Webhook] Could not find subscription ${subscriptionId} for invoice ${invoice.id}`)
            }
        }
        // =========================================================================
        // EVENT: invoice.payment_failed
        // =========================================================================
        else if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object
            const subscriptionId = invoice.subscription as string

            const { data: subscription } = await supabaseClient
                .from('gm_billing_subscriptions')
                .select('restaurant_id, id')
                .eq('stripe_subscription_id', subscriptionId)
                .single()

            if (subscription) {
                await supabaseClient
                    .from('gm_billing_invoices')
                    .upsert({
                        restaurant_id: subscription.restaurant_id,
                        subscription_id: subscription.id,
                        stripe_invoice_id: invoice.id,
                        amount_cents: invoice.amount_due,
                        currency: invoice.currency || 'BRL',
                        status: 'open',
                        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'stripe_invoice_id'
                    })

                console.log(`[Billing Webhook] Invoice ${invoice.id} marked as payment_failed for restaurant ${subscription.restaurant_id}`)
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
