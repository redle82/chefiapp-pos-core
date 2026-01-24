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
    async acceptRequest(requestId: string, restaurantId: string, kernel: any): Promise<string> {
        console.log('[OrderProcessing] Accepting Request:', requestId);

        if (!kernel) {
            throw new Error('Sovereignty Violation: Kernel required for Order Processing.');
        }

        // 1. Fetch Request with Items
        const { data: request, error: fetchError } = await supabase
            .from('gm_order_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) throw new Error('Solicitação não encontrada.');
        if (request.status !== 'PENDING') throw new Error('Solicitação já processada.');

        // 2. Sovereign Creation (Kernel RPC)
        const orderId = crypto.randomUUID();
        const items = (request.items as any[]) || [];

        // Map items to Sovereign Input
        const sovereignItems = items.map((item) => ({
            productId: item.product_id,
            name: item.name || 'Item Web',
            quantity: item.quantity,
            priceCents: item.price_cents || 0,
            notes: item.notes,
            projectId: item.project_id
        }));

        await kernel.execute({
            entity: 'ORDER',
            entityId: orderId,
            event: 'CREATE',
            restaurantId,
            payload: {
                // Standard Kernel Payload
                entityId: orderId,
                restaurantId,
                tableId: null, // Web Order
                items: sovereignItems,
                paymentMethod: 'online_pending',
                totalCents: request.total_cents, // Added explicit total for Kernel to handle if needed
                syncMetadata: {
                    origin: 'WEB_PUBLIC',
                    request_id: requestId,
                    customer_name: request.customer_contact?.name || 'Cliente Web'
                }
            }
        });

        // 3. Decorate Order - REMOVED (Sovereign PURE Mode)
        // Kernel payload must be sufficient. Gate cannot write to gm_orders.

        // 4. Update Request Status (Link to Order) - Using Gate for Compliance
        const { error: updateError } = await DbWriteGate.update(
            'OrderProcessingService',
            'gm_order_requests',
            {
                status: 'ACCEPTED',
                sovereign_order_id: orderId,
                updated_at: new Date().toISOString()
            },
            { id: requestId },
            { tenantId: restaurantId }
        );

        if (updateError) throw updateError;

        console.log('[OrderProcessing] Request Converted to Sovereign Order:', orderId);
        return orderId;
    },

    /**
     * Rejects a Public Request.
     */
    async rejectRequest(requestId: string): Promise<void> {
        console.log('[OrderProcessing] Rejecting Request:', requestId);

        // Dynamic Import since this is a static object method
        const { DbWriteGate } = await import('../governance/DbWriteGate');

        const { error } = await DbWriteGate.update(
            'OrderProcessingService',
            'gm_order_requests',
            {
                status: 'REJECTED',
                updated_at: new Date().toISOString()
            },
            { id: requestId },
            { tenantId: 'unknown' } // We might not have tenantId here easily? 
            // Usually we do, but if not, Gate accepts 'unknown' for logs, or we fetch it.
            // Request usually has tenant_id column. But Gate doesn't fetch, it just logs.
        );

        if (error) throw error;
    }
};
