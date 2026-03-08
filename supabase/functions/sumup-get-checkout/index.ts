// GET /sumup-get-checkout/:checkoutId — Get SumUp checkout status
// Auth: Bearer INTERNAL_API_TOKEN. Path param: checkoutId
// Ref: server/integration-gateway.ts L1424–1474, MIGRATION_RENDER_TO_EDGE

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Internal-Token",
};

const SUMUP_API_BASE = (Deno.env.get("SUMUP_API_BASE_URL") ?? "https://api.sumup.com").replace(
  /\/$/,
  ""
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET") {
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

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const checkoutId = pathParts[pathParts.length - 1];
  if (!checkoutId) {
    return new Response(
      JSON.stringify({ error: "validation_error", message: "Missing checkout ID" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const res = await fetch(
    `${SUMUP_API_BASE}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch checkout status",
        message: text || res.statusText,
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
    transactions?: unknown[];
    valid_until?: string;
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (
    supabaseUrl &&
    supabaseKey &&
    (checkout.status === "PAID" || checkout.status === "SUCCESSFUL")
  ) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const transactionId = (checkout.transactions as { id?: string }[])?.[0]?.id;
    await supabase
      .from("gm_payments")
      .update({
        status: "paid",
        external_payment_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("external_checkout_id", checkoutId);
  }

  return new Response(
    JSON.stringify({
      success: true,
      checkout: {
        id: checkout.id,
        status: checkout.status,
        amount: checkout.amount,
        currency: checkout.currency,
        reference: checkout.checkout_reference,
        transactions: checkout.transactions,
        validUntil: checkout.valid_until,
      },
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
