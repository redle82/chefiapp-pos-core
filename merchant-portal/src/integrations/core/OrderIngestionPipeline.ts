/**
 * Order Ingestion Pipeline - The "Trojan Horse" Gateway
 * 
 * Responsável por receber eventos de pedidos externos (GloriaFood, iFood, etc.)
 * e injetá-los no sistema operacional do ChefIApp (POS/KDS).
 * 
 * Flow:
 * 1. Adapter (GloriaFood) Recebe Webhook -> Emite IntegrationEvent (order.created)
 * 2. Pipeline Recebe Evento
 * 3. Pipeline Normaliza Dados
 * 4. Pipeline Encontra/Cria Cliente
 * 5. Pipeline Injeta no OrderEngine (Cria Pedido Real no Banco)
 * 6. Pipeline Notifica KDS (via Realtime do Supabase implícito na criação)
 */

import { OrderEngine, type OrderInput, type OrderItemInput } from '../../core/tpv/OrderEngine';
import type { OrderCreatedEvent } from '../types/IntegrationEvent';
import { supabase } from '../../core/supabase';
import { DbWriteGate } from '../../core/governance/DbWriteGate';

/**
 * AIRLOCK PROTOCOL: Public Ingestion
 * 
 * Agora escreve apenas em 'gm_order_requests'.
 * O TPV (Sovereign) deve aprovar para virar 'gm_orders'.
 */
export class OrderIngestionPipeline {

    /**
     * Ingests a public request into the Airlock.
     */
    async processExternalOrder(event: OrderCreatedEvent, restaurantId: string): Promise<{ success: boolean; requestId?: string; error?: string }> {
        console.log(`[Airlock] Ingesting request: ${event.payload.orderId} from ${event.payload.source}`);

        try {
            // 1. Idempotência / Duplicate Check
            // Check if request already exists in Airlock
            const { data: existing } = await supabase
                .from('gm_order_requests')
                .select('id')
                .contains('customer_contact', { external_id: event.payload.orderId }) // Using metadata in contact for now or strictly in items/metadata
                .maybeSingle();

            if (existing) {
                console.log(`[Airlock] Request ${event.payload.orderId} already in queue as ${existing.id}.`);
                return { success: true, requestId: existing.id };
            }

            // 2. Map Items to simple JSONB structure
            // Note: OrderCreatedEvent.items has: id, name, quantity, priceCents
            const items = event.payload.items.map(item => ({
                product_id: item.id || null, // Use id as product_id (might be null if external)
                name: item.name,
                quantity: item.quantity,
                price_cents: item.priceCents, // Already in cents
                notes: `External item: ${item.id}` // Fallback note
            }));

            // 3. Calculate Totals (Trust the source, but verify later)
            const totalCents = items.reduce((sum, i) => sum + (i.price_cents * i.quantity), 0);

            // 4. Insert into Airlock (Using Gate)
            const { data: request, error } = await DbWriteGate.insert(
                'OrderIngestionPipeline',
                'gm_order_requests',
                {
                    tenant_id: restaurantId,
                    items: items,
                    total_cents: totalCents,
                    payment_method: 'UNKNOWN',
                    status: 'PENDING',
                    request_source: event.payload.source,
                    customer_contact: {
                        name: event.payload.customerName || 'Cliente Externo',
                        phone: null,
                        external_id: event.payload.orderId
                    }
                },
                { tenantId: restaurantId }
            );

            if (error) throw new Error(`Airlock Rejection: ${error.message}`);

            console.log(`[Airlock] Request accepted into queue: ${request.id}`);

            return { success: true, requestId: request.id };

        } catch (error: any) {
            console.error('[Airlock] Ingestion Failed:', error);
            return { success: false, error: error.message };
        }
    }
}

export const orderIngestion = new OrderIngestionPipeline();
