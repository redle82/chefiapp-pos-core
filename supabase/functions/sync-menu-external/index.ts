
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

        const { restaurantId } = await req.json();

        if (!restaurantId) throw new Error('Restaurant ID required');

        // 1. Fetch Menu Items (Visible on Delivery)
        const { data: items, error } = await supabase
            .from('gm_menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId)
        // Ideally we filter by visibility->delivery but JSONB filtering can be tricky in simple triggers
        // We'll filter in code for flexibility

        if (error) throw error;

        // Filter for delivery visibility
        const deliveryItems = items.filter((i: any) =>
            !i.visibility || i.visibility.delivery === true
        );

        // 2. Transform for External APIs (Mock)
        // In reality, we would loop through enabled integrations (Uber, Glovo) from gm_restaurants settings
        const payload = {
            store_id: restaurantId,
            items: deliveryItems.map((i: any) => ({
                external_id: i.id,
                title: i.name,
                price: i.price,
                available: i.stock_quantity > 0 || !i.track_stock
            }))
        };

        // 3. Push to Providers (Mock)
        // console.log('Pushing to UberEats...', payload);
        // await fetch('https://api.uber.com/v2/eats/stores/.../menus', ...)

        // 4. Update Sync Status
        // We could update a 'last_synced_at' on the restaurant or items.
        // For now, we just return success.

        return new Response(JSON.stringify({
            success: true,
            synced_items: deliveryItems.length,
            providers: ['ubereats', 'glovo'] // Mocked active providers
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})
