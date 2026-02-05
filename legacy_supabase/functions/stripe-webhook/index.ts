// 💳 STRIPE WEBHOOK HANDLER
// Accurately reflects money movement in the database
// P2.2 FIX: Added event deduplication to prevent duplicate processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe@^14.14.0'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) throw new Error('No signature')

    // Get Raw Body for verification
    const body = await req.arrayBuffer()
    const rawBody = new Uint8Array(body)

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // =========================================================================
    // P2.2 FIX: Check if this event was already processed (R-024)
    // Stripe may retry webhooks, causing duplicate processing
    // =========================================================================
    const { data: alreadyProcessed } = await supabaseClient.rpc('fn_webhook_event_exists', {
      p_provider: 'stripe',
      p_event_id: event.id
    })

    if (alreadyProcessed) {
      console.log(`[Webhook] Event ${event.id} already processed - skipping (idempotent)`)
      return new Response(JSON.stringify({ received: true, deduplicated: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log(`[Webhook] Processing ${event.type} (event: ${event.id})`)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const { order_id, restaurant_id } = paymentIntent.metadata

      if (order_id && restaurant_id) {
        // 1. Record Payment
        await supabaseClient.from('gm_payments').insert({
          tenant_id: restaurant_id,
          order_id: order_id,
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          method: 'stripe',
          status: 'succeeded',
          metadata: { ...paymentIntent, stripe_event_id: event.id }
        })

        // 2. Update Order
        const { error: updateError } = await supabaseClient
          .from('gm_orders')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id)

        if (updateError) console.error('Failed to update order:', updateError)
        else console.log(`[Webhook] Order ${order_id} marked as PAID`)
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object
      const { order_id, restaurant_id } = paymentIntent.metadata

      if (order_id && restaurant_id) {
        await supabaseClient.from('gm_payments').insert({
          tenant_id: restaurant_id,
          order_id: order_id,
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          method: 'stripe',
          status: 'failed',
          metadata: { ...paymentIntent, stripe_event_id: event.id }
        })
      }
    }

    // =========================================================================
    // P2.2 FIX: Record this event as processed
    // =========================================================================
    const tenantId = (event.data.object as any).metadata?.restaurant_id || null
    await supabaseClient.rpc('fn_record_webhook_event', {
      p_provider: 'stripe',
      p_event_id: event.id,
      p_event_type: event.type,
      p_tenant_id: tenantId,
      p_payload: event
    })

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

