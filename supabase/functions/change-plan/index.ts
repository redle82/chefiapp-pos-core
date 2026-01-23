/**
 * change-plan — Edge Function
 * 
 * FASE 1 - Billing Integration
 * 
 * Muda o plano da subscription (upgrade/downgrade).
 * 
 * Funcionalidades:
 * - Atualiza plano na tabela `subscriptions`
 * - Atualiza features e limites
 * - Emite evento na tabela `billing_events`
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Planos padrão (deve corresponder a billing-core/types.ts)
const DEFAULT_PLANS = [
    {
        plan_id: 'plan_starter_v1',
        tier: 'STARTER',
        name: 'Starter',
        price_cents: 2900,
        features: ['CORE_POS', 'CORE_ORDERS', 'CORE_TABLES', 'CORE_PAYMENTS', 'CORE_AUDIT', 'GATEWAY_CASH', 'GATEWAY_SUMUP'],
        max_terminals: 1,
        max_tables: 20,
    },
    {
        plan_id: 'plan_professional_v1',
        tier: 'PROFESSIONAL',
        name: 'Professional',
        price_cents: 5900,
        features: ['CORE_POS', 'CORE_ORDERS', 'CORE_TABLES', 'CORE_PAYMENTS', 'CORE_AUDIT', 'GATEWAY_CASH', 'GATEWAY_SUMUP', 'GATEWAY_STRIPE', 'ANALYTICS_PRO'],
        max_terminals: 3,
        max_tables: -1,
    },
    {
        plan_id: 'plan_enterprise_v1',
        tier: 'ENTERPRISE',
        name: 'Enterprise',
        price_cents: 14900,
        features: ['CORE_POS', 'CORE_ORDERS', 'CORE_TABLES', 'CORE_PAYMENTS', 'CORE_AUDIT', 'GATEWAY_CASH', 'GATEWAY_SUMUP', 'GATEWAY_STRIPE', 'ANALYTICS_PRO', 'MULTI_LOCATION', 'API_ACCESS', 'FISCAL_ADVANCED'],
        max_terminals: -1,
        max_tables: -1,
    },
]

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

        const { restaurant_id, new_plan_id } = await req.json()

        if (!restaurant_id || !new_plan_id) {
            throw new Error('restaurant_id and new_plan_id are required')
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

        // Buscar planos
        const newPlan = DEFAULT_PLANS.find(p => p.plan_id === new_plan_id)
        if (!newPlan) {
            throw new Error('Plan not found')
        }

        const currentPlan = DEFAULT_PLANS.find(p => p.plan_id === subscription.plan_id)
        const isUpgrade = newPlan.price_cents > (currentPlan?.price_cents || 0)

        // Atualizar subscription
        const now = new Date()
        const { data: updatedSubscription, error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
                plan_id: newPlan.plan_id,
                plan_tier: newPlan.tier,
                enabled_features: newPlan.features,
                max_terminals: newPlan.max_terminals,
                max_tables: newPlan.max_tables,
            })
            .eq('subscription_id', subscription.subscription_id)
            .select()
            .single()

        if (updateError) {
            console.error('[change-plan] Error updating subscription:', updateError)
            throw new Error(`Failed to change plan: ${updateError.message}`)
        }

        // Emitir evento
        const event_id = crypto.randomUUID()
        await supabaseClient
            .from('billing_events')
            .insert({
                event_id,
                type: isUpgrade ? 'PLAN_UPGRADED' : 'PLAN_DOWNGRADED',
                subscription_id: subscription.subscription_id,
                restaurant_id,
                occurred_at: now.toISOString(),
                payload: {
                    old_plan_id: subscription.plan_id,
                    new_plan_id: newPlan.plan_id,
                    old_price_cents: currentPlan?.price_cents,
                    new_price_cents: newPlan.price_cents,
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
                is_upgrade: isUpgrade,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('[change-plan] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
