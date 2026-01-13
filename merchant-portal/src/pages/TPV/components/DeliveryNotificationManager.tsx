import React, { useEffect, useState } from 'react';
import { useOrders } from '../context/OrderContextReal';
import { createClient } from '@supabase/supabase-js';
import { OrderEngine } from '../../../../core/order/OrderEngine';
import { FiscalPrinter } from '../../../../core/fiscal/FiscalPrinter';
import { DeliveryNotificationCard } from '../../../../ui/design-system/domain/DeliveryNotificationCard';

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

            // 2. KITCHEN AUTOMATION: Print Ticket Immediately
            // "Aceitou -> Imprimiu -> Cozinhou"
            try {
                const printer = new FiscalPrinter();
                // Inject Delivery Metadata for custom ticket layout
                const orderWithMetadata = {
                    ...createdOrder,
                    deliveryMetadata: {
                        provider: integrationOrder.source || 'delivery', // glovo, uber
                        customerName: integrationOrder.customer_name,
                        orderCode: integrationOrder.external_id,
                        courierCode: integrationOrder.pickup_code
                    }
                };
                await printer.printKitchenTicket(orderWithMetadata);
                // Optional: Toast "Ticket enviado para cozinha"
            } catch (printError) {
                console.warn('Auto-Print failed (non-blocking):', printError);
            }

            // 3. Update status in integration_orders
            await supabase
                .from('integration_orders')
                .update({
                    status: 'accepted',
                    processed_at: new Date().toISOString()
                })
                .eq('id', integrationOrder.id);

            // 4. Sync to refresh lists
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
                // Assuming DeliveryNotificationCard is in the scope or handled by parent, 
                // but checking previous file it was used here. 
                // Wait, DeliveryNotificationCard was used in the map but I don't see it imported in step 3179. 
                // It might be defined in the same file or I missed an import.
                // Checking 3179 again... it's not imported explicitly in 1-98.
                // It might be below line 98? No, file ends at 98.
                // It might be auto-imported or I missed it.
                // Actually, Step 3137 showed full file 1-98. There is NO import for DeliveryNotificationCard.
                // That implies it might be defined in the same file but I didn't see it?
                // Or there is an error in my assumption.
                // Ah, line 88 uses it.
                // If it was working before, it must be available.
                // Wait, step 3137 output shows `export const DeliveryNotificationManager...` at line 14.
                // Imports 1-4.
                // Where is `DeliveryNotificationCard`?
                // Maybe the previous file listing was truncated? "The above content shows the entire, complete file contents of the requested file."
                // This is strange. `DeliveryNotificationCard` is used but not imported.
                // Is it a global? Unlikely.
                // Maybe I should check if there are more lines or if it's imported from `./DeliveryNotificationCard`.
                // Let's assume it was imported and I missed it in the view?
                // Lines 1-14 only show: `useOrders`, `createClient`, `OrderEngine`.
                // No `DeliveryNotificationCard`.
                // This means the file I viewed was ALREADY broken or incomplete?
                // OR `DeliveryNotificationCard` is defined at the bottom of the file?
                // But view said "Total Lines: 98" and showed up to 98.
                //
                // Risk: If I write this file without importing `DeliveryNotificationCard`, it will break.
                // I should add the import. It's likely `./DeliveryNotificationCard`.
                // I will add `import { DeliveryNotificationCard } from './DeliveryNotificationCard';` just to be safe.
                // If it creates an error, I can fix it.
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
