import { supabase } from '../supabase';
import type { EffectContext } from '../../../../core-engine/effects';
import { Logger } from '../logger';

/**
 * Order Projection (Sovereign Write)
 * 
 * Enforces Law 1 (Single Writer) by projecting Kernel Events to the Database
 * via the authorized atomic RPC.
 */
export async function persistOrder(context: EffectContext): Promise<void> {
    const { entityId, restaurantId, items, tableId, tableNumber, paymentMethod, syncMetadata } = context;

    Logger.info('[Sovereignty] Projecting Order Creation...', { entityId });

    // 1. Prepare RPC payload
    const rpcItems = (items || []).map((item: any) => ({
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.priceCents || item.unitPrice // Normalized
    }));

    // 2. Call Authorized RPC (Fat DB Logic for now)
    const { data, error } = await supabase.rpc('create_order_atomic', {
        p_restaurant_id: restaurantId,
        p_items: rpcItems,
        p_payment_method: paymentMethod || 'cash',
        p_sync_metadata: syncMetadata || null
    });

    if (error) {
        Logger.error('[Sovereignty] Projection Failed', error);
        throw new Error(`Projection Failed: ${error.message}`);
    }

    // 3. Validation
    if (data.id !== entityId && entityId) {
        // If entityId was provided (UUIDv4 from Client), ensure DB used it if possible.
        // Currently create_order_atomic GENERATES a new UUID. 
        // We need to support "Caller ID" eventually for pure idempotency.
        // For now, we accept the DB ID.
        Logger.warn('[Sovereignty] ID Mismatch (DB Generated vs Kernel Request)', { dbId: data.id, kernelId: entityId });
    }

    Logger.info('[Sovereignty] Order Projected Successfully', { id: data.id });
}

/**
 * Persist Item Addition (Law 1)
 */
export async function persistOrderItem(context: EffectContext): Promise<void> {
    const { entityId, item } = context;
    Logger.info('[Sovereignty] Projecting Item Addition...', { entityId, item });

    const { data, error } = await supabase
        .from('gm_order_items')
        .insert({
            order_id: entityId,
            product_id: item.productId || null,
            product_name: item.name,
            unit_price: item.priceCents || item.unitPrice,
            quantity: item.quantity,
            total_price: (item.priceCents || item.unitPrice) * item.quantity,
            modifiers: item.modifiers || [],
            notes: item.notes || null,
            category_name: item.categoryName || null,
            consumption_group_id: item.consumptionGroupId || null,
        })
        .select()
        .single();

    if (error) {
        Logger.error('[Sovereignty] Item Projection Failed', error);
        throw new Error(`Item Projection Failed: ${error.message}`);
    }
}

/**
 * Persist Item Removal (Law 1)
 */
export async function persistRemoveItem(context: EffectContext): Promise<void> {
    const { entityId, itemId } = context;
    Logger.info('[Sovereignty] Projecting Item Removal...', { entityId, itemId });

    const { error } = await supabase
        .from('gm_order_items')
        .delete()
        .eq('id', itemId)
        .eq('order_id', entityId);

    if (error) {
        Logger.error('[Sovereignty] Item Removal Failed', error);
        throw new Error(`Item Removal Failed: ${error.message}`);
    }
}

/**
 * Persist Item Quantity Update (Law 1)
 */
export async function persistUpdateItemQty(context: EffectContext): Promise<void> {
    const { entityId, itemId, quantity, unitPriceCents } = context;
    Logger.info('[Sovereignty] Projecting Item Update...', { entityId, itemId, quantity });

    const updates: any = { quantity };

    // Recalculate total if price known
    if (unitPriceCents !== undefined) {
        updates.total_price = unitPriceCents * quantity;
    }

    const { error } = await supabase
        .from('gm_order_items')
        .update(updates)
        .eq('id', itemId)
        .eq('order_id', entityId);

    if (error) {
        Logger.error('[Sovereignty] Item Update Failed', error);
        throw new Error(`Item Update Failed: ${error.message}`);
    }
}

/**
 * Persist Order Status Change (Law 1)
 * Maps Kernel Transitions (FINALIZE, MARK_READY, SERVE) to DB Status
 */
export async function persistOrderStatus(context: EffectContext): Promise<void> {
    const { entityId, targetStatus, metadata } = context;

    if (!targetStatus) {
        throw new Error('[Sovereignty] Missing targetStatus for Status Persistence');
    }

    Logger.info('[Sovereignty] Projecting Status Change...', { entityId, targetStatus });

    const updates = {
        status: targetStatus,
        updated_at: new Date().toISOString(),
        ...(metadata || {})
    };

    const { error } = await supabase
        .from('gm_orders')
        .update(updates)
        .eq('id', entityId);

    if (error) {
        Logger.error('[Sovereignty] Status Projection Failed', error);
        throw new Error(`Status Projection Failed: ${error.message}`);
    }
}

/**
 * Persist Payment (Law 1 - Financial)
 * Wraps PaymentEngine to ensure Kernel is the Authority for Transactions.
 */
import { PaymentEngine } from '../tpv/PaymentEngine'; // Dynamic Import to avoid cycles? No, static is fine here.

export async function persistPayment(context: EffectContext): Promise<void> {
    const { entityId, amountCents, method, metadata, restaurantId, cashRegisterId, idempotencyKey, isPartial } = context;

    if (!amountCents || !method || !restaurantId || !cashRegisterId) {
        throw new Error('[Sovereignty] Missing Payment Details for Kernel Transaction');
    }

    Logger.info('[Sovereignty] Processing Sovereign Payment...', { entityId, amountCents });

    // Use PaymentEngine (Legacy/Robust) to execute the DB Transaction
    // This maintains all current validations (Split Payment, Idempotency, etc)

    if (isPartial) {
        await PaymentEngine.processSplitPayment({
            orderId: entityId,
            restaurantId,
            cashRegisterId,
            amountCents,
            method,
            metadata,
            idempotencyKey
        });
    } else {
        await PaymentEngine.processPayment({
            orderId: entityId,
            restaurantId,
            cashRegisterId,
            amountCents,
            method,
            metadata,
            idempotencyKey
        });
    }
}




