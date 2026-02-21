
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz');

async function simulateTPV() {
    console.log('🤖 SIMULATING TPV PERISTALSIS...');

    // 1. Get Pending Requests
    const { data: requests } = await supabase
        .from('gm_order_requests')
        .select('*')
        .eq('status', 'PENDING');

    console.log(`📋 Pending Requests: ${requests?.length || 0}`);

    if (!requests || requests.length === 0) {
        console.log('⚠️ No pending requests to process.');
        return;
    }

    const request = requests[0];
    console.log(`👉 Processing Request: ${request.id} (${request.customer_contact?.name})`);

    // 1.5 Get Restaurant ID
    const { data: restaurant } = await supabase
        .from('gm_restaurants')
        .select('id')
        .eq('tenant_id', request.tenant_id)
        .single();

    if (!restaurant) throw new Error('Restaurant not found for tenant');

    // 2. Accept Request (Logic from OrderProcessingService, but manual here to verify steps)
    // Create GM Order
    const { data: order, error: orderError } = await supabase
        .from('gm_orders')
        .insert({
            restaurant_id: restaurant.id,
            status: 'new',
            total_cents: request.total_cents,
            customer_name: request.customer_contact?.name || 'Cliente Web',
            origin: 'WEB_PUBLIC'
        })
        .select()
        .single();

    if (orderError) throw orderError;
    console.log(`✅ Order Created: ${order.id}`);

    // Create Items
    const items = request.items as any[];
    const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_snapshot: item.price_cents || 0,
        name_snapshot: item.name || 'Item',
        subtotal_cents: (item.price_cents || 0) * (item.quantity || 1),
        notes: item.notes
    }));

    const { error: itemsError } = await supabase.from('gm_order_items').insert(orderItems);
    if (itemsError) throw itemsError;
    console.log(`✅ Items Created: ${orderItems.length}`);

    // Update Request
    const { error: updateError } = await supabase
        .from('gm_order_requests')
        .update({ status: 'ACCEPTED', sovereign_order_id: order.id })
        .eq('id', request.id);

    if (updateError) throw updateError;
    console.log(`✅ Request marked ACCEPTED.`);

    console.log('🎉 PERISTALSIS COMPLETE.');
}

simulateTPV().catch(console.error);
