/**
 * GloriaFood Webhook Receiver — Edge Function
 * 
 * Este endpoint recebe webhooks do GloriaFood e:
 * 1. Valida a estrutura do payload
 * 2. Armazena o pedido no banco
 * 3. Dispara evento para o frontend via Realtime
 * 
 * Deploy: npx supabase functions deploy webhook-gloriafood --no-verify-jwt
 * 
 * Endpoint: POST https://<project>.supabase.co/functions/v1/webhook-gloriafood
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Tipos do GloriaFood (subset)
interface GloriaFoodOrder {
  id: string;
  reference: string;
  restaurant_id: string;
  created_at: string;
  status: string;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      instructions?: string;
    };
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    instructions?: string;
  }>;
  payment: {
    method: string;
    status: string;
    total: number;
    currency: string;
  };
  delivery: {
    type: string;
    estimated_time?: number;
  };
  instructions?: string;
}

interface WebhookPayload {
  event: string;
  timestamp: string;
  signature?: string;
  data: {
    order: GloriaFoodOrder;
  };
}

// Validação básica
const isValidPayload = (payload: unknown): payload is WebhookPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.event === 'string' &&
    typeof p.timestamp === 'string' &&
    p.data !== null &&
    typeof p.data === 'object'
  );
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GloriaFood-Signature',
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
    // 1. Parse payload
    const payload = await req.json();
    console.log('[webhook-gloriafood] Received:', JSON.stringify(payload).slice(0, 500));

    // 2. Validate
    if (!isValidPayload(payload)) {
      console.error('[webhook-gloriafood] Invalid payload structure');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { event, data } = payload;
    const order = data.order;

    // 3. Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Store in database
    const { error: insertError } = await supabase
      .from('integration_orders')
      .upsert({
        external_id: order.id,
        source: 'gloriafood',
        reference: order.reference,
        restaurant_id: order.restaurant_id,
        event_type: event,
        status: order.status,
        customer_name: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
        customer_phone: order.customer.phone,
        customer_email: order.customer.email,
        delivery_address: order.customer.address 
          ? `${order.customer.address.street}, ${order.customer.address.city}` 
          : null,
        delivery_type: order.delivery.type,
        items: order.items,
        total_cents: order.payment.total,
        currency: order.payment.currency,
        payment_method: order.payment.method,
        payment_status: order.payment.status,
        instructions: order.instructions,
        raw_payload: payload,
        received_at: new Date().toISOString(),
      }, {
        onConflict: 'external_id,source',
      });

    if (insertError) {
      console.error('[webhook-gloriafood] DB error:', insertError);
      // Não retorna erro para o GloriaFood - evita retry loop
    }

    // 5. Broadcast via Realtime (para frontend escutar)
    const channel = supabase.channel('integration-events');
    await channel.send({
      type: 'broadcast',
      event: 'order.received',
      payload: {
        source: 'gloriafood',
        orderId: order.id,
        reference: order.reference,
        eventType: event,
        customerName: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
        total: order.payment.total / 100,
        deliveryType: order.delivery.type,
      },
    });

    console.log(`[webhook-gloriafood] ✅ Processed: ${event} for ${order.reference}`);

    // 6. Responde OK para GloriaFood
    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      reference: order.reference,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    console.error('[webhook-gloriafood] Error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal error', 
      message: err instanceof Error ? err.message : 'Unknown' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
