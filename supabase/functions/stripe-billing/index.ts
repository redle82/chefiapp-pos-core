import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@^14.10.0";
import { corsHeaders, requireUser } from "../_shared/auth.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url =
      Deno.env.get("MY_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
    const key =
      Deno.env.get("MY_SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      "";
    const authResult = await requireUser(req, url, key);
    if (authResult instanceof Response) return authResult;
    const { user, supabase: supabaseClient } = authResult;

    const { action, priceId, successUrl, cancelUrl, returnUrl } =
      await req.json();

    // Get Tenant context (Assuming user belongs to a tenant or we pass tenantId.
    // Ideally we should look up the tenant the user owns or is managing.
    // For now, let's assume we query gm_restaurants where owner_id = user.id OR we pass tenantId from front)

    // Better: Front-end passes tenantId, we verify access.
    // But since I don't see tenantId in the body of the previous requests usually, I'll fetch the one linked to metadata or query.
    // Actually, in `stripe-payment`, we didn't use tenantId because it was for TPV.
    // Here, we are billing the RESTAURANT.

    console.log(`[Billing] User authenticated: ${user.id}`);

    const { data: restaurants, error: fetchError } = await supabaseClient
      .from("gm_restaurants")
      .select("id, stripe_customer_id, name, owner_id")
      .eq("owner_id", user.id)
      .single();

    if (fetchError || !restaurants) {
      console.error("[Billing] Restaurant Fetch Error:", fetchError);
      console.error("[Billing] Restaurant Data:", restaurants);
      // Only owners can manage billing for now
      throw new Error(
        `Restaurant not found or you require owner privileges. (User: ${user.id}, Error: ${fetchError?.message})`,
      );
    }

    const restaurant = restaurants;

    // 1. Ensure Stripe Customer Exists
    let customerId = restaurant.stripe_customer_id;

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: restaurant.email || user.email,
        name: restaurant.name,
        metadata: {
          supabase_restaurant_id: restaurant.id,
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save back to DB
      await supabaseClient
        .from("gm_restaurants")
        .update({ stripe_customer_id: customerId })
        .eq("id", restaurant.id);
    }

    if (action === "create-checkout-session") {
      if (!priceId) throw new Error("priceId is required for checkout");
      if (!successUrl || !cancelUrl) throw new Error("URLs required");

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            supabase_restaurant_id: restaurant.id,
          },
        },
        metadata: {
          supabase_restaurant_id: restaurant.id,
        },
      });

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    if (action === "create-portal-session") {
      if (!returnUrl) throw new Error("returnUrl is required");

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
