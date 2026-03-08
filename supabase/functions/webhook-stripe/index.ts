// POST /webhook-stripe — Stripe payment webhook
// Verify with stripe.webhooks.constructEvent (raw body), then RPC process_webhook_event
// Ref: legacy_supabase/functions/stripe-webhook, MIGRATION_RENDER_TO_EDGE

import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
};

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? Deno.env.get("STRIPE_WHSEC");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Missing Stripe-Signature or STRIPE_WEBHOOK_SECRET" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.arrayBuffer();
  const rawBody = new Uint8Array(body);

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecret!, { apiVersion: "2023-10-16" });
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Webhook Error", message: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ received: true, event_id: event.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.rpc("process_webhook_event", {
    p_provider: "stripe",
    p_event_type: event.type,
    p_event_id: event.id,
    p_payload: event as unknown as Record<string, unknown>,
    p_signature: signature,
  });

  if (error) {
    console.error("process_webhook_event error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process webhook", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Billing sync: update gm_restaurants.billing_status + merchant_subscriptions.
  // Passes event.created as timestamp guard against out-of-order delivery.
  const billingEventTypes = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
  ];
  if (billingEventTypes.includes(event.type)) {
    const obj = (event.data as any)?.object as Record<string, unknown> | undefined;
    const metadata = (obj as any)?.metadata as Record<string, unknown> | undefined;
    const rawRestaurantId =
      (metadata?.restaurant_id as string | undefined) ??
      (metadata?.supabase_restaurant_id as string | undefined) ??
      null;

    const hasValidTenant =
      typeof rawRestaurantId === "string" &&
      /^[0-9a-fA-F-]{36}$/.test(rawRestaurantId);

    if (!hasValidTenant) {
      // Tenant guard: never apply billing sync without a resolvable restaurant_id.
      // Persist incident for audit (dedup by unique index on event_id, reason).
      const { error: incidentErr } = await supabase.from("billing_incidents").insert({
        restaurant_id: null,
        provider: "stripe",
        event_id: event.id,
        event_type: event.type,
        reason: "no_tenant",
        payload: { has_metadata: !!obj?.metadata },
      });
      // 23505 = unique_violation (duplicate event_id+reason); ignore to avoid spam
      if (incidentErr && incidentErr.code !== "23505") {
        console.warn("billing_incidents insert failed:", incidentErr.message);
      }
      console.warn(
        "sync_stripe_subscription_from_event skipped: no valid restaurant_id in metadata",
        { event_id: event.id, event_type: event.type },
      );
    } else {
    const eventCreatedAt = new Date(event.created * 1000).toISOString();
    const { error: syncErr } = await supabase.rpc("sync_stripe_subscription_from_event", {
      p_event_type: event.type,
      p_payload: event as unknown as Record<string, unknown>,
      p_event_created_at: eventCreatedAt,
    });
    if (syncErr) {
      console.warn("sync_stripe_subscription_from_event (non-fatal):", syncErr);
    }
  }
  }

  return new Response(
    JSON.stringify({ received: true, event_id: event.id, timestamp: new Date().toISOString() }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
