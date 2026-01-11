import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface DeliverooWebhookPayload {
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

function isValidPayload(payload: any): payload is DeliverooWebhookPayload {
  return (
    payload &&
    payload.event &&
    payload.data &&
    payload.data.order &&
    payload.data.order.id &&
    payload.data.order.customer
  );
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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
    const payload = await req.json();

    if (!isValidPayload(payload)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { event, data } = payload;
    const order = data.order;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store in database
    const { error: insertError } = await supabase
      .from('integration_orders')
      .upsert({
        external_id: order.id,
        source: 'deliveroo',
        reference: order.id,
        restaurant_id: data.restaurant_id || null,
        event_type: event,
        status: order.status,
        customer_name: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
        customer_phone: order.customer.phone,
        customer_email: order.customer.email,
        delivery_address: order.delivery.address,
        delivery_type: 'delivery',
        items: order.items,
        total_cents: Math.round(order.total * 100),
        currency: order.currency,
        payment_method: 'UNKNOWN',
        payment_status: 'PENDING',
        instructions: '',
        raw_payload: payload,
        received_at: new Date().toISOString(),
      }, {
        onConflict: 'external_id,source',
      });

    if (insertError) {
      console.error('[webhook-deliveroo] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Broadcast via Realtime
    await supabase
      .channel('integration_orders')
      .send({
        type: 'broadcast',
        event: 'new_order',
        payload: {
          source: 'deliveroo',
          order_id: order.id,
          restaurant_id: data.restaurant_id,
        },
      });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[webhook-deliveroo] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
