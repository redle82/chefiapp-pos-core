/**
 * update-subscription-status — Edge Function
 * 
 * FASE 1 - Billing Integration
 * 
 * Atualiza status da subscription após pagamento confirmado.
 * 
 * Funcionalidades:
 * - Atualiza subscription para ACTIVE
 * - Emite evento de ativação
 * - Sincroniza com Stripe (se necessário)
 * 
 * Deploy: npx supabase functions deploy update-subscription-status
 */

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

        // Autenticar usuário
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        const { restaurant_id, subscription_id, status, payment_intent_id } = await req.json()

        if (!restaurant_id || !status) {
            throw new Error('restaurant_id and status are required')
        }

        // Verificar se usuário é owner do restaurante
        const { data: restaurant, error: restaurantError } = await supabaseClient
            .from('gm_restaurants')
            .select('id, owner_id')
            .eq('id', restaurant_id)
            .single()

        if (restaurantError || !restaurant) {
            throw new Error('Restaurant not found')
        }

        if (restaurant.owner_id !== user.id) {
            throw new Error('User is not the owner of this restaurant')
        }

        // Buscar subscription
        const query = supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('restaurant_id', restaurant_id)

        if (subscription_id) {
            query.eq('subscription_id', subscription_id)
        }

        const { data: subscription, error: subscriptionError } = await query.single()

        if (subscriptionError || !subscription) {
            throw new Error('Subscription not found')
        }

        // Atualizar status
        const now = new Date()
        const updateData: any = {
            status,
            updated_at: now.toISOString(),
        }

        // Se status é ACTIVE e tinha trial, atualizar datas
        if (status === 'ACTIVE' && subscription.status === 'TRIAL') {
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
            updateData.current_period_start = now.toISOString()
            updateData.current_period_end = periodEnd.toISOString()
            updateData.next_payment_at = periodEnd.toISOString()
        }

        // Se payment_intent_id foi fornecido, buscar informações do Stripe
        if (payment_intent_id) {
            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
                
                if (paymentIntent.status === 'succeeded') {
                    updateData.last_payment_at = new Date(paymentIntent.created * 1000).toISOString()
                    updateData.payment_method_id = paymentIntent.payment_method as string
                }
            } catch (stripeError) {
                console.warn('[update-subscription-status] Error retrieving payment intent:', stripeError)
                // Não falhar se não conseguir buscar do Stripe
            }
        }

        // Atualizar subscription
        const { data: updatedSubscription, error: updateError } = await supabaseClient
            .from('subscriptions')
            .update(updateData)
            .eq('subscription_id', subscription.subscription_id)
            .select()
            .single()

        if (updateError) {
            console.error('[update-subscription-status] Error updating subscription:', updateError)
            throw new Error(`Failed to update subscription: ${updateError.message}`)
        }

        // Emitir evento
        const event_id = crypto.randomUUID()
        await supabaseClient
            .from('billing_events')
            .insert({
                event_id,
                type: status === 'ACTIVE' ? 'SUBSCRIPTION_ACTIVATED' : `SUBSCRIPTION_${status}`,
                subscription_id: subscription.subscription_id,
                restaurant_id,
                occurred_at: now.toISOString(),
                payload: {
                    previous_status: subscription.status,
                    new_status: status,
                    payment_intent_id,
                },
                metadata: {
                    source: 'API',
                    actor_id: user.id,
                },
            })

        return new Response(
            JSON.stringify({
                success: true,
                subscription: updatedSubscription,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('[update-subscription-status] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
