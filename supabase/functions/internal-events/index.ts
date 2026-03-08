// POST /internal-events — Receive internal events and trigger outbound webhook deliveries
// Auth: Bearer INTERNAL_API_TOKEN. Body: { event, restaurant_id, payload }
// Ref: server/integration-gateway.ts handleInternalEvents, MIGRATION_RENDER_TO_EDGE
// Note: Full outbound delivery (fetchWebhookConfigs, deliverOne) requires Core RPC/tables.
// This minimal version records the intent; optional: call Core to schedule deliveries.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Internal-Token",
};

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

  let body: { event?: string; restaurant_id?: string; payload?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_json", message: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const event = body?.event?.trim();
  const restaurant_id = body?.restaurant_id?.trim();
  if (!event || !restaurant_id) {
    return new Response(
      JSON.stringify({ error: "bad_request", message: "event and restaurant_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Minimal: accept and return 202. Full delivery to webhook_out_config can be done
  // by a separate Edge that calls Core RPC or by the Core when it has the table.
  const deliveryId = `wh_evt_${crypto.randomUUID()}`;
  return new Response(
    JSON.stringify({
      accepted: true,
      delivery_id: deliveryId,
      endpoints: 0,
      message: "Event accepted; outbound delivery requires Core webhook_out_config",
    }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
