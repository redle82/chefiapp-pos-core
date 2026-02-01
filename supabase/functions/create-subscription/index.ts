/**
 * create-subscription — Edge Function
 *
 * FASE 1 - Billing Integration
 *
 * Cria subscription para restaurante durante onboarding.
 *
 * Funcionalidades:
 * - Cria subscription na tabela `subscriptions`
 * - Emite evento na tabela `billing_events`
 * - Se não for trial, cria PaymentIntent no Stripe
 *
 * Deploy: npx supabase functions deploy create-subscription
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@^14.10.0";
import { corsHeaders, requireUser } from "../_shared/auth.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Planos padrão (deve corresponder a billing-core/types.ts)
const DEFAULT_PLANS = [
  {
    plan_id: "plan_starter_v1",
    tier: "STARTER",
    name: "Starter",
    price_cents: 2900,
    currency: "EUR",
    trial_days: 14,
    features: [
      "CORE_POS",
      "CORE_ORDERS",
      "CORE_TABLES",
      "CORE_PAYMENTS",
      "CORE_AUDIT",
      "GATEWAY_CASH",
      "GATEWAY_SUMUP",
    ],
    max_terminals: 1,
    max_tables: 20,
  },
  {
    plan_id: "plan_professional_v1",
    tier: "PROFESSIONAL",
    name: "Professional",
    price_cents: 5900,
    currency: "EUR",
    trial_days: 14,
    features: [
      "CORE_POS",
      "CORE_ORDERS",
      "CORE_TABLES",
      "CORE_PAYMENTS",
      "CORE_AUDIT",
      "GATEWAY_CASH",
      "GATEWAY_SUMUP",
      "GATEWAY_STRIPE",
      "ANALYTICS_PRO",
    ],
    max_terminals: 3,
    max_tables: -1,
  },
  {
    plan_id: "plan_enterprise_v1",
    tier: "ENTERPRISE",
    name: "Enterprise",
    price_cents: 14900,
    currency: "EUR",
    trial_days: 30,
    features: [
      "CORE_POS",
      "CORE_ORDERS",
      "CORE_TABLES",
      "CORE_PAYMENTS",
      "CORE_AUDIT",
      "GATEWAY_CASH",
      "GATEWAY_SUMUP",
      "GATEWAY_STRIPE",
      "ANALYTICS_PRO",
      "MULTI_LOCATION",
      "API_ACCESS",
      "FISCAL_ADVANCED",
    ],
    max_terminals: -1,
    max_tables: -1,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const key = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authResult = await requireUser(req, url, key);
    if (authResult instanceof Response) return authResult;
    const { user, supabase: supabaseClient } = authResult;

    const { restaurant_id, plan_id, start_trial } = await req.json();

    if (!restaurant_id || !plan_id) {
      throw new Error("restaurant_id and plan_id are required");
    }

    // Verificar se usuário é owner do restaurante
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from("gm_restaurants")
      .select("id, owner_id, name, email, stripe_customer_id")
      .eq("id", restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      throw new Error("Restaurant not found");
    }

    if (restaurant.owner_id !== user.id) {
      throw new Error("User is not the owner of this restaurant");
    }

    // Verificar se já existe subscription
    const { data: existingSubscription } = await supabaseClient
      .from("subscriptions")
      .select("subscription_id")
      .eq("restaurant_id", restaurant_id)
      .single();

    if (existingSubscription) {
      return new Response(
        JSON.stringify({
          error: "Restaurant already has a subscription",
          subscription: existingSubscription,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Buscar plano
    const plan =
      DEFAULT_PLANS.find((p) => p.plan_id === plan_id) || DEFAULT_PLANS[1]; // Default: Professional

    // Calcular datas
    const now = new Date();
    const trialEndsAt = start_trial
      ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
      : null;
    const periodEnd =
      trialEndsAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const status = start_trial ? "TRIAL" : "ACTIVE";

    // Gerar subscription_id
    const subscription_id = crypto.randomUUID();

    // Criar subscription na tabela
    const { data: subscription, error: insertError } = await supabaseClient
      .from("subscriptions")
      .insert({
        subscription_id,
        restaurant_id,
        plan_id: plan.plan_id,
        plan_tier: plan.tier,
        status,
        trial_ends_at: trialEndsAt?.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_payment_at: periodEnd.toISOString(),
        active_addons: [],
        configured_gateways: [],
        enabled_features: plan.features,
        max_terminals: plan.max_terminals,
        max_tables: plan.max_tables,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "[create-subscription] Error inserting subscription:",
        insertError,
      );
      throw new Error(`Failed to create subscription: ${insertError.message}`);
    }

    // Emitir evento
    const event_id = crypto.randomUUID();
    await supabaseClient.from("billing_events").insert({
      event_id,
      type: start_trial ? "SUBSCRIPTION_TRIAL_STARTED" : "SUBSCRIPTION_CREATED",
      subscription_id,
      restaurant_id,
      occurred_at: now.toISOString(),
      payload: {
        plan_id: plan.plan_id,
        plan_tier: plan.tier,
        trial_days: plan.trial_days,
      },
      metadata: {
        source: "API",
        actor_id: user.id,
      },
    });

    // Se não for trial, criar PaymentIntent no Stripe
    let client_secret = null;
    if (!start_trial) {
      // Garantir que existe Stripe Customer
      let customerId = restaurant.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: restaurant.email || user.email,
          name: restaurant.name,
          metadata: {
            supabase_restaurant_id: restaurant_id,
            supabase_user_id: user.id,
          },
        });
        customerId = customer.id;

        // Salvar customer_id no restaurante
        await supabaseClient
          .from("gm_restaurants")
          .update({ stripe_customer_id: customerId })
          .eq("id", restaurant_id);
      }

      // Criar PaymentIntent para primeira cobrança
      // Nota: Em produção, você pode querer criar uma Subscription no Stripe aqui
      // Por enquanto, criamos apenas um PaymentIntent para o primeiro pagamento
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        customer: customerId,
        metadata: {
          subscription_id,
          restaurant_id,
          plan_id: plan.plan_id,
        },
      });

      client_secret = paymentIntent.client_secret;
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          ...subscription,
          trial_ends_at: subscription.trial_ends_at,
          current_period_end: subscription.current_period_end,
        },
        client_secret,
        next_step: start_trial ? "TRIAL_STARTED" : "CONFIGURE_PAYMENT_METHOD",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("[create-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
