// import { supabase } from '../../supabaseClient';
const supabase: any = {}; // MOCK for build
import type { InventorySignal } from '../../intelligence/nervous-system/InventoryReflexEngine';

export interface PhysicalInventoryItem {
    link_id: string;
    item_id: string;
    item_name: string;
    organ_id: string;
    organ_name: string;
    current_qty: number;
    par_level: number;
    min_safe_level: number;
    unit: string;
}

export const InventoryRepo = {

    // 1. Get the Physical Truth (View Logic)
    async getPhysicalInventory(restaurantId: string): Promise<PhysicalInventoryItem[]> {
        // This requires joining 4 tables.
        // For MVP, we fetch raw and join in memory or use a View if we added one.
        // Let's do a reliable multi-step fetch to avoid complicated Postgrest joins without types.

        // A. Fetch Links (The Structure)
        const { data: links } = await supabase
            .from('gm_inventory_links')
            .select(`
                id, par_level, min_safe_level,
                item:gm_inventory_items(id, name, unit),
                organ:gm_organs(id, name)
            `)
            .eq('restaurant_id', restaurantId);

        if (!links) return [];

        // B. Fetch Current Levels (The Reality)
        const { data: levels } = await supabase
            .from('gm_inventory_levels')
            .select('link_id, current_qty')
            .eq('restaurant_id', restaurantId);

        const levelMap = new Map(levels?.map((l: any) => [l.link_id, l.current_qty]));

        // C. Synthesize
        return links.map((link: any) => ({
            link_id: link.id,
            item_id: link.item.id,
            item_name: link.item.name,
            organ_id: link.organ.id,
            organ_name: link.organ.name,
            unit: link.item.unit,
            par_level: link.par_level,
            min_safe_level: link.min_safe_level,
            current_qty: levelMap.get(link.id) ?? 0 // Default to 0 if no level record
        }));
    },

    // 2. Generate Hunger Signals (The Metabolism)
    async getSignalsFromLevels(restaurantId: string): Promise<InventorySignal[]> {
        const inventory = await this.getPhysicalInventory(restaurantId);
        const signals: InventorySignal[] = [];

        for (const slot of inventory) {
            // Logic 1: Panic Threshold
            if (slot.current_qty <= slot.min_safe_level) {
                signals.push({
                    kind: 'HUNGER',
                    itemId: slot.item_id,
                    itemName: slot.item_name,
                    organId: slot.organ_id,
                    organName: slot.organ_name,
                    currentLevel: slot.current_qty,
                    parLevel: slot.par_level,
                    unit: slot.unit,
                    severity: 60, // Panic Logic 1 = 60
                    timestamp: Date.now(),
                    delta: slot.par_level - slot.current_qty, // Ask to fill to Par
                    urgency: 'high',
                    context: `Nível Crítico em ${slot.organ_name}: ${slot.current_qty} ${slot.unit}`
                });
            }
            // Logic 2: Empty (Zombie Candidate if neglected)
            else if (slot.current_qty === 0) {
                signals.push({
                    kind: 'HUNGER',
                    itemId: slot.item_id,
                    itemName: slot.item_name,
                    organId: slot.organ_id,
                    organName: slot.organ_name,
                    currentLevel: slot.current_qty,
                    parLevel: slot.par_level,
                    unit: slot.unit,
                    severity: 100, // Panic Logic 2 = 100 (Zombie)
                    timestamp: Date.now(),
                    delta: slot.par_level,
                    urgency: 'critical',
                    context: `Esgotado em ${slot.organ_name}`
                });
            }
        }
        return signals;
    },

    // 3. Update Reality (Counting)
    async updateLevel(restaurantId: string, linkId: string, qty: number, userId: string) {
        // Upsert logic for levels
        // First find if level exists for this link
        const { data: existing } = await supabase
            .from('gm_inventory_levels')
            .select('id')
            .eq('link_id', linkId)
            .single();

        if (existing) {
            await supabase
                .from('gm_inventory_levels')
                .update(
                    ((_: any) => ({
                        current_qty: qty,
                        last_count_at: new Date().toISOString(),
                        updated_by: userId
                    }))(null) // Applying the map function immediately with a dummy argument
                )
                .eq('id', existing.id);
        } else {
            await supabase
                .from('gm_inventory_levels')
                .insert({
                    restaurant_id: restaurantId,
                    link_id: linkId,
                    current_qty: qty,
                    updated_by: userId
                });
        }
    }
};
