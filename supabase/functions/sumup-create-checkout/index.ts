// POST /sumup-create-checkout — Create SumUp checkout (card)
// Auth: Bearer INTERNAL_API_TOKEN. Body: { orderId, restaurantId, amount, currency?, description?, returnUrl? }
// Ref: server/integration-gateway.ts L1476–1540, MIGRATION_RENDER_TO_EDGE

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Internal-Token",
};

const SUMUP_API_BASE = (Deno.env.get("SUMUP_API_BASE_URL") ?? "https://api.sumup.com").replace(
  /\/$/,
  ""
);

function normalizeAmount(value: number): number {
  return Number(Number(value).toFixed(2));
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
  if (token !== Deno.env.get("INTERNAL_API_TOKEN")) {
    return new Response(
      JSON.stringify({ error: "unauthorized", message: "Invalid or missing internal token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const accessToken = Deno.env.get("SUMUP_ACCESS_TOKEN");
  if (!accessToken) {
    return new Response(
      JSON.stringify({
        error: "service_unavailable",
        message: "SumUp not configured (SUMUP_ACCESS_TOKEN)",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    orderId?: string;
    restaurantId?: string;
    amount?: number;
    currency?: string;
    description?: string;
    returnUrl?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ error: "validation_error", message: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const orderId = body?.orderId?.trim();
  const restaurantId = body?.restaurantId?.trim();
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  if (!orderId || !restaurantId || !Number.isFinite(amount) || amount <= 0) {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "orderId, restaurantId and amount (positive number) are required",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload: Record<string, unknown> = {
    checkout_reference: orderId,
    amount: normalizeAmount(amount),
    currency: (body.currency?.trim() || "EUR").toUpperCase(),
    ...(body.description && { description: body.description }),
    ...(body.returnUrl && { return_url: body.returnUrl }),
  };

  const res = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg: string;
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      msg = j.message || j.error || text;
    } catch {
      msg = text || res.statusText;
    }
    return new Response(
      JSON.stringify({
        error: "Failed to create SumUp checkout",
        message: `SumUp API: ${res.status} ${msg}`,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const checkout = JSON.parse(text || "{}") as {
    id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    checkout_reference?: string;
    valid_until?: string;
    checkout_url?: string;
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from("gm_payments").insert({
      restaurant_id: restaurantId,
      order_id: orderId,
      amount_cents: Math.round((checkout.amount ?? amount) * 100),
      currency: checkout.currency ?? "EUR",
      payment_method: "card",
      payment_provider: "sumup",
      external_checkout_id: checkout.id,
      status: "pending",
      metadata: {
        checkout_url: checkout.checkout_url,
        valid_until: checkout.valid_until,
      },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      checkout: {
        id: checkout.id,
        url: checkout.checkout_url,
        status: checkout.status,
        amount: checkout.amount,
        currency: checkout.currency,
        expiresAt: checkout.valid_until,
        reference: checkout.checkout_reference,
      },
      timestamp: new Date().toISOString(),
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
