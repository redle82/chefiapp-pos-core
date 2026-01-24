import { supabase } from '../supabase';
import { Logger } from '../logger';
import { DbWriteGate } from '../governance/DbWriteGate';

/**
 * Inventory Projection (Sovereign)
 * 
 * Manages database writes for Inventory Domain.
 * Adheres to Domain Write Authority Contract (Law 1).
 */

export const persistStockDeduction = async (payload: any, context: any) => {
    const { productId, quantity, tenantId } = payload;
    const qty = Number(quantity) || 1;

    // 1. Fetch current (Read) - TODO: Move to RPC for atomicity relative to High Concurrency
    const { data: product, error: fetchError } = await supabase
        .from('gm_products')
        .select('id, stock_quantity, track_stock')
        .eq('id', productId)
        .single();

    if (fetchError || !product) {
        Logger.error('INVENTORY_PROJECTION: Product not found for deduction', { productId });
        return; // Fail silently or throw? Effects usually shouldn't throw to crash app, but log error.
    }

    if (!product.track_stock) {
        return; // No-op if stock tracking is disabled
    }

    const currentStock = Number(product.stock_quantity) || 0;
    const newStock = currentStock - qty;

    // 2. Update (Write) via Gate
    // Note: This relies on optimistic concurrency or simple RMW.
    // Ideally use: versioning.
    // For MVP Sovereignty, we accept RMW risk on low-volume inventory updates.
    const { error } = await DbWriteGate.update(
        'InventoryProjection',
        'gm_products',
        { stock_quantity: newStock, updated_at: new Date().toISOString() },
        { id: productId },
        { tenantId: (context?.tenantId || tenantId) }
    );

    if (error) {
        Logger.error('INVENTORY_PROJECTION: Failed to deduct stock', error, { productId, newStock });
        throw new Error('Stock deduction failed');
    }

    Logger.info('INVENTORY: Stock Deducted', { productId, deducted: qty, remaining: newStock });
};

export const persistInventoryCount = async (payload: any, context: any) => {
    const { productId, count, tenantId } = payload;
    const newCount = Number(count);

    // Write new absolute count
    const { error } = await DbWriteGate.update(
        'InventoryProjection',
        'gm_products',
        { stock_quantity: newCount, updated_at: new Date().toISOString() },
        { id: productId },
        { tenantId: (context?.tenantId || tenantId) }
    );

    if (error) {
        Logger.error('INVENTORY_PROJECTION: Failed to update count', error, { productId, newCount });
        throw new Error('Inventory count update failed');
    }

    Logger.info('INVENTORY: Count Updated', { productId, newCount });
};

export const persistStockRestock = async (payload: any, context: any) => {
    const { productId, quantity, tenantId } = payload;
    const qty = Number(quantity);

    // 1. Fetch
    const { data: product } = await supabase
        .from('gm_products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

    const currentStock = Number(product?.stock_quantity) || 0;
    const newStock = currentStock + qty;

    // 2. Update
    const { error } = await DbWriteGate.update(
        'InventoryProjection',
        'gm_products',
        { stock_quantity: newStock, updated_at: new Date().toISOString() },
        { id: productId },
        { tenantId: (context?.tenantId || tenantId) }
    );

    if (error) {
        Logger.error('INVENTORY_PROJECTION: Failed to restock', error, { productId, newStock });
        throw new Error('Stock restock failed');
    }
};
