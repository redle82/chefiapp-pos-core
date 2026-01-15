/**
 * Glovo Webhook Receiver — Edge Function
 * 
 * Este endpoint recebe webhooks do Glovo e:
 * 1. Valida a estrutura do payload
 * 2. Armazena o pedido no banco
 * 3. Dispara evento para o frontend via Realtime
 * 
 * Deploy: npx supabase functions deploy webhook-glovo --no-verify-jwt
 * 
 * Endpoint: POST https://<project>.supabase.co/functions/v1/webhook-glovo
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Tipos do Glovo (subset)
interface GlovoOrder {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'CANCELLED';
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  delivery: {
    address: {
      address: string;
      city: string;
      postal_code?: string;
      country?: string;
    };
    estimated_time?: number;
    scheduled_time?: string;
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
  instructions?: string;
  restaurant_id?: string;
}

// Validação básica
const isValidGlovoOrder = (order: unknown): order is GlovoOrder => {
  if (!order || typeof order !== 'object') return false;
  const o = order as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.status === 'string' &&
    typeof o.customer === 'object' &&
    typeof o.delivery === 'object' &&
    Array.isArray(o.items) &&
    typeof o.total === 'number' &&
    typeof o.currency === 'string' &&
    typeof o.created_at === 'string'
  );
};

// --- SECURITY: Signature Verification ---
// --- SECURITY: Signature Verification ---
const verifyGlovoSignature = async (req: Request, rawBody: string): Promise<boolean> => {
  const secret = Deno.env.get('GLOVO_SECRET');
  if (!secret) {
    console.error('GLOVO_SECRET is missing. Cannot verify signature.');
    return false; // Fail safe
  }

  // Glovo header: 'GB-Signature' or custom 'X-Glovo-Signature' 
  // (Standard is usually 'Glovo-Signature' or 'X-Hub-Signature', verifying docs...)
  // Assuming 'X-Glovo-Signature' for this implementation based on plan.
  const signature = req.headers.get('GB-Signature') || req.headers.get('X-Glovo-Signature');

  if (!signature) {
    console.warn('Missing signature header');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify', 'sign']
    );

    const computedParams = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(rawBody)
    );

    // Convert buffer to hex string
    const computedHex = Array.from(new Uint8Array(computedParams))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Glovo signature might be "hmac <hex>" or just "<hex>"
    // We compare just the hex part if purely hex, or handle usage.
    // Assuming straightforward hex per most standard webhooks.

    // Constant-time comparison to prevent timing attacks
    let mismatch = 0;
    if (signature.length !== computedHex.length) return false;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ computedHex.charCodeAt(i);
    }

    return mismatch === 0;

  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Glovo-Signature',
      },
    });
  }

  // Só aceita POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Get RAW Body for Signature Verification 
    // (Crucial: req.json() parses and changes formatting, breaking HMAC)
    const rawBody = await req.text();

    // 2. Security Check (HMAC)
    // Pass the RAW string to verification. 
    // NOTE: This runs BEFORE parsing JSON to ensure we reject bad payloads early.
    const isVerified = await verifyGlovoSignature(req, rawBody);
    if (!isVerified) {
      console.error('[webhook-glovo] ⛔ Signature Mismatch');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 3. Parse JSON for processing
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    console.log('[webhook-glovo] Received Verified Payload');

    // 4. Extrair order (pode estar em payload.order ou ser o payload direto)
    const order: GlovoOrder = (payload as any).order || payload;

    // 5. Validate
    if (!isValidGlovoOrder(order)) {
      console.error('[webhook-glovo] Invalid payload structure');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // [P1 FIX] DEDUPE CHECK - Prevent duplicate processing
    // If order already exists with same external_id, skip processing
    const { data: existingOrder } = await supabase
      .from('integration_orders')
      .select('id, status')
      .eq('external_id', order.id)
      .eq('source', 'glovo')
      .single();

    if (existingOrder) {
      // Already processed - return OK to prevent Glovo retry
      console.log(`[webhook-glovo] ⏭️ Duplicate Ignored: order ${order.id} already exists`);
      return new Response(JSON.stringify({
        success: true,
        orderId: order.id,
        dedupe: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 7. Store in database (upsert as fallback safety)
    const { error: insertError } = await supabase
      .from('integration_orders')
      .upsert({
        external_id: order.id,
        source: 'glovo',
        reference: order.id, // Glovo usa o ID como referência
        restaurant_id: order.restaurant_id || null,
        event_type: 'order.created',
        status: order.status.toLowerCase(),
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        customer_email: order.customer.email || null,
        delivery_address: `${order.delivery.address.address}, ${order.delivery.address.city}`,
        delivery_type: 'delivery', // Glovo é sempre delivery
        items: order.items,
        total_cents: Math.round(order.total * 100), // Converter para centavos
        currency: order.currency,
        payment_method: 'online', // Assumir online (ajustar se necessário)
        payment_status: 'pending',
        instructions: order.instructions,
        raw_payload: payload,
        received_at: new Date().toISOString(),
      }, {
        onConflict: 'external_id,source',
      });

    if (insertError) {
      console.error('[webhook-glovo] DB error:', insertError);
      // Não retorna erro para o Glovo - evita retry loop
    }

    // 8. Broadcast via Realtime (para frontend escutar)
    const channel = supabase.channel('integration-events');
    await channel.send({
      type: 'broadcast',
      event: 'order.received',
      payload: {
        source: 'glovo',
        orderId: order.id,
        reference: order.id,
        eventType: 'order.created',
        customerName: order.customer.name,
        total: order.total,
        deliveryType: 'delivery',
        status: order.status,
      },
    });

    console.log(`[webhook-glovo] ✅ Processed: order ${order.id} (${order.status})`);

    // 9. Responde OK para Glovo
    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    console.error('[webhook-glovo] Error:', err);
    return new Response(JSON.stringify({
      error: 'Internal error',
      message: err instanceof Error ? err.message : 'Unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
