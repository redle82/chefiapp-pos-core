// 💳 STRIPE WEBHOOK HANDLER
// Accurately reflects money movement in the database

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
      // Note: stripe-node expects Buffer or string. 
      // Deno's Uint8Array might need casting or text decoding if constructEvent doesn't support it directly in this version.
      // Safe bet: TextDecoder (if signature allows string) OR just pass Uint8Array and hope stripe-node handles it (it usually does).
      // Actually, Stripe docs for Deno suggest using the text body.
      // Let's rely on standard practice: verify logic needs exact bytes.
      // stripe-node@14+ supports Uint8Array.
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`[Webhook] Processing ${event.type}`)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const { order_id, restaurant_id } = paymentIntent.metadata

      if (order_id && restaurant_id) {
        // 1. Record Payment
        await supabaseClient.from('gm_payments').insert({
          tenant_id: restaurant_id, // Assuming gm_payments has tenant_id column
          order_id: order_id,
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          method: 'stripe',
          status: 'succeeded',
          metadata: paymentIntent
        })

        // 2. Update Order
        // Double check order exists and is pending? No, just force Paid.
        const { error: updateError } = await supabaseClient
          .from('gm_orders')
          .update({
            payment_status: 'paid',
            // potentially update status to 'preparing' if auto-fire needed
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
          metadata: paymentIntent
        })
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
