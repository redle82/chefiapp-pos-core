
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; // Trusted Evironment
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verify Signature (Mock for now, would use HMAC with client_secret)
    // const signature = req.headers.get('x-uber-signature');
    // if (!signature) throw new Error('Missing Signature');

    const payload = await req.json();

    // 2. Extract Data (Simplified Uber schema)
    // In reality, Uber sends resource_href, and we must fetch the order details.
    // For this implementation (The Hydra), we assume a pushed JSON payload.

    const orderData = {
      id: payload.id,
      source: 'ubereats',
      customer: {
        name: payload.eater?.name || 'Uber Customer',
        phone: payload.eater?.phone
      },
      items: payload.cart?.items?.map((i: any) => ({
        name: i.title,
        quantity: i.quantity,
        price_cents: i.price.amount,
        notes: i.special_instructions,
        external_id: i.id
      })) || [],
      total_cents: payload.payment?.amount || 0,
      created_at: new Date().toISOString()
    };

    // 3. Store Raw Event (Audit Trail)
    await supabase.from('event_store').insert({
      stream_type: 'WEBHOOK',
      stream_id: `UBER:${payload.id}`,
      event_type: 'ORDER_RECEIVED',
      payload: JSON.stringify(payload)
    });

    // 4. Inject into gm_orders (via OrderNormalizer logic, but done here or via trigger)
    // For efficiency, we insert directly into gm_orders if the schema supports JSONB for details
    // Or we stick to the core schema.
    // Let's assume we map to the Core Schema directly here.

    // Find Restaurant (Using a static map or metadata in webhook)
    // For now, hardcoded to specific test restaurant or passed in query
    const restaurantId = '84a7df84-e910-449e-8798-204128522e86'; // Sofia Gastrobar (Example)

    const { error } = await supabase.from('gm_orders').insert({
      restaurant_id: restaurantId,
      status: 'NEW',
      total_cents: orderData.total_cents,
      origin: 'external',
      service_source: 'ubereats',
      external_reference: orderData.id,
      customer_name: orderData.customer.name,
      items: orderData.items, // Requires gm_orders to support JSONB items or relational insert
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
