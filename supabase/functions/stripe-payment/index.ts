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

    // 1. Authenticate User (Must be authenticated to pay?)
    // Actually, for TPV, the user is the Staff/Owner. The customer is paying.
    // So we need to verify the caller is a valid Staff/Owner of the tenant.
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, ...params } = await req.json()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    if (action === 'create-payment-intent') {
      const { amount, currency, restaurant_id, order_id } = params

      console.log(`[Stripe] Creating PaymentIntent: ${amount} ${currency} for Order ${order_id}`)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ensure integer cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          restaurant_id, // Important for determining destination logic later
          order_id,
          user_id: user.id
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
