import React, { useEffect, useState } from 'react';
import { useOrders } from '../context/OrderContextReal';
import { createClient } from '@supabase/supabase-js';
import { OrderEngine } from '../../../../core/order/OrderEngine';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// SOUND EFFECT (Bell)
const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const DeliveryNotificationManager: React.FC = () => {
    const { incomingDeliveryOrders, restaurantId, syncNow } = useOrders();
    const [sound] = useState(new Audio(ALERT_SOUND_URL));
    const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

    // Play sound on new orders
    useEffect(() => {
        const newOrders = incomingDeliveryOrders.filter(o => !processedIds.has(o.id));
        if (newOrders.length > 0) {
            sound.play().catch(e => console.warn('Audio play failed', e));
            // Add to processed to avoid loop, but we want to keep showing them
            const newIds = new Set(processedIds);
            newOrders.forEach(o => newIds.add(o.id));
            setProcessedIds(newIds);
        }
    }, [incomingDeliveryOrders]);

    const handleAccept = async (integrationOrder: any) => {
        if (!restaurantId) return;

        try {
            // 1. Create Order in POS (Reuse OrderEngine for consistency)
            // Map integration items to POS items
            // NOTE: This assumes products don't strictly need to match Menu IDs yet (Loose coupling)
            // Or we map by Name if ID is missing.
            const posItems = integrationOrder.items.map((item: any) => ({
                productId: item.id || 'EXT-' + Math.random().toString(36).substr(2, 9), // Fallback ID
                name: item.name,
                priceCents: Math.round(item.price * 100), // glovo sends floats
                quantity: item.quantity,
                notes: item.options?.map((o: any) => o.name).join(', ')
            }));

            const createdOrder = await OrderEngine.createOrder({
                restaurantId,
                tableNumber: `DELIVERY-${integrationOrder.reference || integrationOrder.external_id.slice(-4)}`,
                items: posItems,
                notes: `Glovo #${integrationOrder.external_id}\nCustomer: ${integrationOrder.customer_name}`
            });

            // 2. Update status in integration_orders
            await supabase
                .from('integration_orders')
                .update({
                    status: 'accepted',
                    processed_at: new Date().toISOString()
                })
                .eq('id', integrationOrder.id);

            // 3. Sync to refresh lists
            await syncNow();

        } catch (error) {
            console.error('Failed to accept delivery order', error);
            alert('Erro ao aceitar pedido: ' + error.message);
        }
    };

    const handleReject = async (orderId: string) => {
        if (!confirm('Rejeitar pedido? Isso não cancela no Glovo (ainda).')) return;

        await supabase
            .from('integration_orders')
            .update({ status: 'rejected' })
            .eq('id', orderId);

        await syncNow();
    };

    if (incomingDeliveryOrders.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-96">
            {incomingDeliveryOrders.map(order => (
                <DeliveryNotificationCard
                    key={order.id}
                    order={order}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />
            ))}
        </div>
    );
};
