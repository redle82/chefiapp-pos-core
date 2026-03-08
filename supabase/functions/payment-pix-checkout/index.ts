// POST /payment-pix-checkout — Create SumUp PIX checkout (Brazil)
// Auth: Bearer INTERNAL_API_TOKEN. Body: { order_id, amount, merchant_code?, description?, return_url? }
// Ref: server/integration-gateway.ts L1336–1423, PaymentBroker.ts, MIGRATION_RENDER_TO_EDGE

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
        message: "PIX/SumUp not configured (SUMUP_ACCESS_TOKEN)",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    order_id?: string;
    amount?: number;
    merchant_code?: string;
    description?: string;
    return_url?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ error: "validation_error", message: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const orderId = body?.order_id?.trim();
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  if (!orderId || !Number.isFinite(amount) || amount <= 0) {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "order_id (string) and amount (positive number) are required",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload: Record<string, unknown> = {
    checkout_reference: orderId,
    amount: normalizeAmount(amount),
    currency: "BRL",
    payment_type: "pix",
    country: "BR",
    ...(body.merchant_code && { merchant_code: body.merchant_code }),
    ...(body.description && { description: body.description }),
    ...(body.return_url && { return_url: body.return_url }),
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
        error: "Failed to create PIX checkout",
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
  };

  return new Response(
    JSON.stringify({
      provider: "sumup",
      payment_method: "pix",
      country: "BR",
      checkout_id: checkout.id,
      checkout_reference: checkout.checkout_reference ?? orderId,
      status: checkout.status,
      amount: checkout.amount,
      currency: checkout.currency,
      raw: checkout,
      timestamp: new Date().toISOString(),
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
