
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();

    // Glovo Payload Mapping
    const orderData = {
      id: payload.order_code,
      source: 'glovo',
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone_number
      },
      items: payload.products.map((p: any) => ({
        name: p.name,
        quantity: p.quantity,
        price_cents: Math.round(p.price * 100), // Glovo sends float
        notes: p.comment || '',
        external_id: p.id
      })),
      total_cents: Math.round(payload.estimated_total_price * 100),
      created_at: new Date().toISOString()
    };

    // Store Event
    await supabase.from('event_store').insert({
      stream_type: 'WEBHOOK',
      stream_id: `GLOVO:${payload.order_code}`,
      event_type: 'ORDER_RECEIVED',
      payload: JSON.stringify(payload)
    });

    // Inject Order
    // Hardcoded example Restaurant ID again (In prod, this comes from store_id mapping)
    const restaurantId = '84a7df84-e910-449e-8798-204128522e86';

    const { error } = await supabase.from('gm_orders').insert({
      restaurant_id: restaurantId,
      status: 'NEW',
      total_cents: orderData.total_cents,
      origin: 'external',
      service_source: 'glovo',
      external_reference: orderData.id,
      customer_name: orderData.customer.name,
      items: orderData.items,
      created_at: new Date().toISOString()
    });

    if (error) throw error;

    return new Response(JSON.stringify({ status: 'accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
