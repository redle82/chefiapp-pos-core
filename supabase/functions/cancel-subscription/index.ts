/**
 * cancel-subscription — Edge Function
 * 
 * FASE 1 - Billing Integration
 * 
 * Cancela subscription do restaurante.
 * 
 * Funcionalidades:
 * - Cancela subscription (imediato ou ao final do período)
 * - Atualiza status na tabela `subscriptions`
 * - Emite evento na tabela `billing_events`
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

        const { restaurant_id, immediately } = await req.json()

        if (!restaurant_id) {
            throw new Error('restaurant_id is required')
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
        const { data: subscription, error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('restaurant_id', restaurant_id)
            .single()

        if (subscriptionError || !subscription) {
            throw new Error('Subscription not found')
        }

        if (subscription.status === 'CANCELLED') {
            return new Response(
                JSON.stringify({ error: 'Subscription already cancelled' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // Atualizar subscription
        const now = new Date()
        const updateData: any = {
            status: 'CANCELLED',
            cancelled_at: immediately ? now.toISOString() : subscription.current_period_end,
        }

        const { data: updatedSubscription, error: updateError } = await supabaseClient
            .from('subscriptions')
            .update(updateData)
            .eq('subscription_id', subscription.subscription_id)
            .select()
            .single()

        if (updateError) {
            console.error('[cancel-subscription] Error updating subscription:', updateError)
            throw new Error(`Failed to cancel subscription: ${updateError.message}`)
        }

        // Emitir evento
        const event_id = crypto.randomUUID()
        await supabaseClient
            .from('billing_events')
            .insert({
                event_id,
                type: 'SUBSCRIPTION_CANCELLED',
                subscription_id: subscription.subscription_id,
                restaurant_id,
                occurred_at: now.toISOString(),
                payload: {
                    previous_status: subscription.status,
                    cancelled_immediately: immediately,
                    cancelled_at: updateData.cancelled_at,
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
        console.error('[cancel-subscription] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
