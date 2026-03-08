// POST /webhook-sumup — SumUp payment webhook
// Verify HMAC-SHA256 (X-SumUp-Signature), then RPC process_webhook_event
// Ref: server/integration-gateway.ts handleSumUpWebhook, MIGRATION_RENDER_TO_EDGE

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-SumUp-Signature",
};

function apiError(code: string, message: string, detail?: string) {
  return {
    error: code,
    message,
    ...(detail && { detail }),
    timestamp: new Date().toISOString(),
  };
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(body)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify(apiError("method_not_allowed", "POST required")), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const bodyStr = await req.text();
  const signature = req.headers.get("x-sumup-signature") ?? undefined;
  const secret = Deno.env.get("SUMUP_WEBHOOK_SECRET");

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bodyStr || "{}") as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify(apiError("invalid_json", "Invalid JSON body")), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (secret && signature) {
    const expected = "sha256=" + (await hmacSha256Hex(secret, bodyStr));
    if (signature !== expected) {
      return new Response(JSON.stringify(apiError("unauthorized", "Invalid webhook signature")), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const eventId =
    (payload.paymentId as string) ||
    (payload.event_id as string) ||
    (payload.id as string) ||
    `sumup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const eventType =
    (payload.status as string)
      ? `payment.${String(payload.status).toLowerCase()}`
      : (payload.event_type as string) || "payment.notification";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({
        received: true,
        message: "CORE not configured, event logged only",
        event_id: eventId,
        timestamp: new Date().toISOString(),
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc("process_webhook_event", {
    p_provider: "sumup",
    p_event_type: eventType,
    p_event_id: eventId,
    p_payload: payload,
    p_signature: signature ?? null,
  });

  if (error) {
    return new Response(
      JSON.stringify(apiError("webhook_failed", error.message)),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const first = Array.isArray(data) ? data[0] : data;
  return new Response(
    JSON.stringify({
      received: true,
      success: (first as { success?: boolean })?.success ?? true,
      event_id: eventId,
      message: (first as { message?: string })?.message ?? "Webhook event recorded",
      timestamp: new Date().toISOString(),
    }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
