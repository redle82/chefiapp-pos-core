// 💳 STRIPE PAYMENTS ENGINE
// Handles secure server-side interactions with Stripe

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe@^14.14.0'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { action, ...params } = await req.json()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 1. TPV Payment (Authenticated Staff/Owner)
    if (action === 'create-payment-intent') {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !user) throw new Error('Unauthorized')

      const { amount, currency, restaurant_id, order_id, operator_id, cash_register_id } = params
      console.log(`[Stripe] Creating TPV PaymentIntent: ${amount} ${currency} for Order ${order_id}`)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          restaurant_id,
          order_id,
          user_id: user.id,
          operator_id,
          cash_register_id,
          source: 'TPV'
        }
      })

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          id: paymentIntent.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 2. Public Web Payment (Anonymous but Validated)
    if (action === 'create-public-payment-intent') {
      const { amount, currency, restaurant_id } = params

      // Verify restaurant exists and allows web ordering
      // Use Supabase client to check (it has Anon key, so checks public table RLS)
      const { data: restaurant, error } = await supabaseClient
        .from('gm_restaurants')
        .select('id, name, web_ordering_enabled')
        .eq('id', restaurant_id)
        .single()

      if (error || !restaurant) throw new Error('Restaurant not found')
      if (!restaurant.web_ordering_enabled) throw new Error('Web ordering disabled')

      console.log(`[Stripe] Creating Public PaymentIntent: ${amount} ${currency} for ${restaurant.name}`)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          restaurant_id,
          source: 'WEB_PUBLIC'
        }
      })

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          id: paymentIntent.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error(`[Stripe] Error:`, error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
