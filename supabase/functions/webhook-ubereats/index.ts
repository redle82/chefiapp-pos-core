import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

interface UberEatsWebhookPayload {
  event: string;
  data: {
    order: {
      id: string;
      status: string;
      customer: {
        first_name: string;
        last_name: string;
        phone: string;
        email?: string;
      };
      delivery: {
        address: string;
        city: string;
        postal_code?: string;
      };
      items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        notes?: string;
      }>;
      total: number;
      currency: string;
      created_at: string;
    };
    restaurant_id?: string;
  };
}

function isValidPayload(payload: any): payload is UberEatsWebhookPayload {
  return (
    payload &&
    payload.data &&
    payload.data.order &&
    payload.data.order.id
  );
}

/**
 * Verify Uber Eats HMAC-SHA256 Signature
 */
async function verifyUberSignature(req: Request, rawBody: string): Promise<boolean> {
  const signature = req.headers.get("X-Uber-Signature");
  if (!signature) {
    console.error("[webhook-ubereats] Missing X-Uber-Signature");
    return false;
  }

  const clientSecret = Deno.env.get("UBER_CLIENT_SECRET");
  if (!clientSecret) {
    console.error("[webhook-ubereats] Missing UBER_CLIENT_SECRET in env");
    return false; // Fail safe
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(clientSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(rawBody);
  const signatureBytes = await crypto.subtle.sign("HMAC", key, data);
  const calculatedSignature = encodeHex(signatureBytes);

  if (calculatedSignature !== signature) {
    console.warn(`[webhook-ubereats] Signature Mismatch! Expected: ${calculatedSignature}, Got: ${signature}`);
    return false;
  }

  return true;
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Uber-Signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Read Raw Body for HMAC
    const rawBody = await req.text();

    // 2. Verify Signature
    const isVerified = await verifyUberSignature(req, rawBody);
    if (!isVerified) {
      return new Response(JSON.stringify({ error: 'Invalid Signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse JSON
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    if (!isValidPayload(payload)) {
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { event, data } = payload;
    const order = data.order; // Assuming Uber format logic above

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store in database
    const { error: insertError } = await supabase
      .from('integration_orders')
      .upsert({
        external_id: order.id,
        source: 'ubereats',
        reference: order.id, // Uber ID usually is reference
        restaurant_id: data.restaurant_id || null,
        event_type: event || 'created', // Default
        status: order.status || 'created',
        customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Uber Customer',
        customer_phone: order.customer?.phone,
        customer_email: order.customer?.email,
        delivery_address: order.delivery?.address,
        delivery_type: payload.data.delivery_type || 'delivery',
        items: order.items || [],
        total_cents: Math.round((order.total || 0) * 100),
        currency: order.currency || 'EUR',
        payment_method: 'ONLINE',
        payment_status: 'PAID', // Uber handles payment
        instructions: order.notes || '',
        raw_payload: payload,
        received_at: new Date().toISOString(),
      }, {
        onConflict: 'external_id,source',
      });

    if (insertError) {
      console.error('[webhook-ubereats] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('[webhook-ubereats] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
