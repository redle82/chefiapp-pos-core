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
    // 1. Parse payload
    // Glovo pode enviar como objeto direto ou dentro de um envelope
    const payload = await req.json();
    console.log('[webhook-glovo] Received:', JSON.stringify(payload).slice(0, 500));

    // 2. Extrair order (pode estar em payload.order ou ser o payload direto)
    const order: GlovoOrder = (payload as any).order || payload;

    // 3. Validate
    if (!isValidGlovoOrder(order)) {
      console.error('[webhook-glovo] Invalid payload structure');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Store in database
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

    // 6. Broadcast via Realtime (para frontend escutar)
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

    // 7. Responde OK para Glovo
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
