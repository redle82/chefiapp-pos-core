// POST /billing-create-checkout-session — Stripe Checkout Session (subscription)
// Auth: Bearer INTERNAL_API_TOKEN or X-Internal-Token; allowlist origin for success_url/cancel_url
// Ref: server/integration-gateway.ts L1195–1322, MIGRATION_RENDER_TO_EDGE

import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Internal-Token",
};

function getOriginFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return null;
  }
}

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

  const token =
    req.headers.get("x-internal-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  const expected = Deno.env.get("INTERNAL_API_TOKEN");
  if (!token || token !== expected) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Invalid or missing internal token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { price_id?: string; success_url?: string; cancel_url?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ error: "validation_error", message: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawPriceId = body?.price_id?.trim();
  const successUrl = body?.success_url?.trim();
  const cancelUrl = body?.cancel_url?.trim();
  if (!rawPriceId || !successUrl || !cancelUrl) {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "price_id, success_url and cancel_url are required",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const allowed = (Deno.env.get("BILLING_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);
  const defaultOrigins = [
    "https://www.chefiapp.com",
    "https://chefiapp.com",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
  ];
  const list = allowed.length > 0 ? allowed : defaultOrigins;
  const successOrigin = getOriginFromUrl(successUrl);
  const cancelOrigin = getOriginFromUrl(cancelUrl);
  if (
    !successOrigin ||
    !list.includes(successOrigin) ||
    !cancelOrigin ||
    !list.includes(cancelOrigin)
  ) {
    return new Response(
      JSON.stringify({
        error: "billing_not_allowed",
        message:
          "A venda da plataforma (checkout) só está disponível em origens permitidas.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Map semântico de preços: STRIPE_PRICE_<KEY> → price_xxx
  // Ex.: STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO_EUR, STRIPE_PRICE_STARTER_USD, etc.
  const priceMap: Record<string, string> = {};
  const env = Deno.env.toObject();
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("STRIPE_PRICE_") && value) {
      const semanticKey = key.replace("STRIPE_PRICE_", "").toLowerCase();
      priceMap[semanticKey] = value;
    }
  }
  const normalizedKey = rawPriceId.toLowerCase();
  const priceId =
    priceMap[normalizedKey] ||
    (rawPriceId.startsWith("price_") ? rawPriceId : null);
  if (!priceId) {
    return new Response(
      JSON.stringify({
        error: "no_such_price",
        message: `No such price: '${rawPriceId}'. Set STRIPE_PRICE_* env or use Stripe price_xxx ID.`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecret) {
    return new Response(
      JSON.stringify({ error: "stripe_not_configured", message: "STRIPE_SECRET_KEY not set" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return new Response(
      JSON.stringify({ url: session.url ?? "", session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return new Response(
      JSON.stringify({
        error: "stripe_error",
        message: (e as Error).message ?? "Stripe checkout failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
