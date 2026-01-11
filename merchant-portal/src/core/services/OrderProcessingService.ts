import { supabase } from '../supabase';
import type { Order, OrderItem } from '../../pages/TPV/context/OrderTypes';

/**
 * SOVEREIGN KERNEL: Order Processing Service
 * Handles the "Peristalsis" - converting external requests into internal orders.
 */
export const OrderProcessingService = {
    /**
     * Accepts a Public Request and converts it into a Sovereign Order.
     * This is a Transactional Operation.
     */
    async acceptRequest(requestId: string, restaurantId: string): Promise<string> {
        console.log('[OrderProcessing] Accepting Request:', requestId);

        // 1. Fetch Request with Items
        const { data: request, error: fetchError } = await supabase
            .from('gm_order_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) throw new Error('Solicitação não encontrada.');
        if (request.status !== 'PENDING') throw new Error('Solicitação já processada.');

        // 2. Create Order (Using RPC would be safer for atomicity, but client-side transaction for MVP)
        // We map the request payload to the internal Order structure.

        // A. Create Order Header
        const { data: newOrder, error: orderError } = await supabase
            .from('gm_orders')
            .insert({
                restaurant_id: restaurantId,
                status: 'new', // Default initial status
                total_cents: request.total_cents,
                customer_name: request.customer_contact?.name || 'Cliente Web',
                origin: 'WEB_PUBLIC'
                // table_id is null for web orders usually, or could be mapped if QR Code provided context
            })
            .select()
            .single();

        if (orderError) throw orderError;

        try {
            // B. Create Order Items
            const items = request.items as any[];
            const orderItems = items.map((item) => ({
                order_id: newOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_snapshot: item.price_cents || 0, // MAP TO price_snapshot
                name_snapshot: item.name || 'Item', // MAP TO name_snapshot (Request items usually have name/price denormalized?)
                subtotal_cents: (item.price_cents || 0) * (item.quantity || 1), // CALCULATE subtotal
                notes: item.notes,
                // status: 'pending' // gm_order_items missing status column? Check schema.
            }));

            const { error: itemsError } = await supabase
                .from('gm_order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // C. Update Request Status (Link to Order)
            const { error: updateError } = await supabase
                .from('gm_order_requests')
                .update({
                    status: 'ACCEPTED',
                    sovereign_order_id: newOrder.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (updateError) throw updateError;

            console.log('[OrderProcessing] Request Converted to Order:', newOrder.id);
            return newOrder.id;

        } catch (err) {
            // Rollback attempted (manual) - or just leave it broken?
            // In MVP, if item creation fails, we have an empty order.
            // We should probably delete the order if items fail.
            console.error('[OrderProcessing] Transaction Failed. Rolling back order...');
            await supabase.from('gm_orders').delete().eq('id', newOrder.id);
            throw err;
        }
    },

    /**
     * Rejects a Public Request.
     */
    async rejectRequest(requestId: string): Promise<void> {
        console.log('[OrderProcessing] Rejecting Request:', requestId);

        const { error } = await supabase
            .from('gm_order_requests')
            .update({
                status: 'REJECTED',
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;
    }
};
