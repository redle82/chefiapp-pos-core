import { supabase } from '../supabase';
import { Logger } from '../logger';

interface EffectContext {
    entity: string;
    entityId: string;
    event: string;
    payload?: any;
    [key: string]: any;
}

/**
 * Persist Product Creation/Update (Law 1)
 */
export async function persistProduct(context: EffectContext): Promise<void> {
    const { entityId, payload, restaurantId } = context;
    const { name, priceCents, trackStock, stockQuantity, categoryId } = payload || {};

    if (!restaurantId || !name) {
        throw new Error('[Sovereignty] Missing required fields for Product Persistence');
    }

    Logger.info('[Sovereignty] Projecting Product...', { entityId, name });

    const { error } = await supabase.from('gm_products').upsert({
        id: entityId,
        restaurant_id: restaurantId,
        name,
        price_cents: priceCents,
        track_stock: trackStock || false,
        stock_quantity: stockQuantity || 0,
        available: true,
        category_id: categoryId || null,
        updated_at: new Date().toISOString()
    });

    if (error) {
        Logger.error('[Sovereignty] Product Projection Failed', error);
        throw new Error(`Product Projection Failed: ${error.message}`);
    }
}

/**
 * Persist Product Archive (Law 1)
 */
export async function persistProductArchive(context: EffectContext): Promise<void> {
    const { entityId } = context;

    Logger.info('[Sovereignty] Archiving Product...', { entityId });

    const { error } = await supabase.from('gm_products').update({
        available: false,
        updated_at: new Date().toISOString()
    }).eq('id', entityId);

    if (error) {
        Logger.error('[Sovereignty] Product Archive Failed', error);
        throw new Error(`Product Archive Failed: ${error.message}`);
    }
}
