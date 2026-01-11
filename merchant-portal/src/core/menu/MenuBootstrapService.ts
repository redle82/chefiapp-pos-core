import { SupabaseClient } from '@supabase/supabase-js';

// PRESET DEFINITIONS
// Ideally this would live in a JSON file or DB, but for V1 we hardcode for speed.
const PRESETS: Record<string, any> = {
    'CAFE_V1': {
        name: 'Café & Bistro',
        categories: [
            {
                name: 'Bebidas Quentes',
                items: [
                    { name: 'Café Expresso', price: 1.00 },
                    { name: 'Meia de Leite', price: 1.50 },
                    { name: 'Abatanado', price: 1.20 },
                    { name: 'Cappuccino', price: 2.50 }
                ]
            },
            {
                name: 'Pastelaria',
                items: [
                    { name: 'Pastel de Nata', price: 1.20 },
                    { name: 'Croissant Simples', price: 1.50 },
                    { name: 'Torrada Mista', price: 2.50 }
                ]
            },
            {
                name: 'Bebidas Frias',
                items: [
                    { name: 'Água 33cl', price: 1.00 },
                    { name: 'Coca Cola', price: 1.80 },
                    { name: 'Compal', price: 1.80 }
                ]
            }
        ]
    },
    'BAR_V1': {
        name: 'Bar & Pub',
        categories: [
            {
                name: 'Cervejas',
                items: [
                    { name: 'Imperial', price: 1.50 },
                    { name: 'Caneca', price: 3.00 },
                    { name: 'Artesanal IPA', price: 4.50 }
                ]
            },
            {
                name: 'Cocktails',
                items: [
                    { name: 'Mojito', price: 7.00 },
                    { name: 'Caipirinha', price: 6.50 },
                    { name: 'Gin Tónico', price: 8.00 }
                ]
            }
        ]
    },
    'RESTAURANT_V1': {
        name: 'Restaurante Típico',
        categories: [
            {
                name: 'Entradas',
                items: [
                    { name: 'Pão e Azeitonas', price: 2.50 },
                    { name: 'Sopa do Dia', price: 3.00 }
                ]
            },
            {
                name: 'Pratos Principais',
                items: [
                    { name: 'Bitoque', price: 12.00 },
                    { name: 'Bacalhau à Brás', price: 14.00 },
                    { name: 'Hambúrguer da Casa', price: 11.50 }
                ]
            },
            {
                name: 'Bebidas',
                items: [
                    { name: 'Água', price: 1.50 },
                    { name: 'Refrigerante', price: 2.00 },
                    { name: 'Vinho Jarro 0.5L', price: 6.00 }
                ]
            }
        ]
    }
};

// Contexto para V2 (Owner's Mind) e V1 (Decisão)
export interface BootstrapContext {
    // Basic (Quick)
    businessType: string; // 'CAFE', 'BAR', 'RESTAURANT'
    serviceStyle: string[]; // 'TABLE', 'COUNTER', 'DELIVERY'
    operationSpeed: string; // 'FAST', 'BALANCED', 'DETAILED'

    // Guided (Questionnaire)
    mode?: 'QUICK' | 'GUIDED';
    cuisine?: string; // 'MEDITERRANEAN', 'ITALIAN', etc.
    priceTier?: 'BUDGET' | 'MID' | 'PREMIUM';
    sellsAlcohol?: boolean;
    hasBreakfast?: boolean;
    hasMenuOfDay?: boolean;

    // Future
    deliveryApps?: string[];
}

export class MenuBootstrapService {
    constructor(private supabase: SupabaseClient) { }

    async injectPreset(restaurantId: string, presetKey: string, context?: BootstrapContext) {
        if (!PRESETS[presetKey]) {
            throw new Error(`Preset ${presetKey} not found.`);
        }

        const preset = PRESETS[presetKey];
        console.log(`[MBE] Injecting preset: ${presetKey} for ${restaurantId}`, context);

        // 1. Log Source
        // We combine the Preset Data + The Operational Context into the payload
        // This preserves the "Mind of the Owner" decision for V2 analysis.
        const payload = {
            preset_data: preset,
            operational_context: context || {}
        };

        const { data: source, error: sourceError } = await this.supabase
            .from('menu_bootstrap_sources')
            .insert({
                restaurant_id: restaurantId,
                source_type: 'PRESET',
                source_origin: presetKey,
                raw_payload: payload
            })
            .select()
            .single();

        if (sourceError) throw sourceError;

        // 2. Create Run Log
        const { data: run, error: runError } = await this.supabase
            .from('menu_bootstrap_runs')
            .insert({
                source_id: source.id,
                status: 'PENDING'
            })
            .select()
            .single();

        if (runError) throw runError;

        try {
            let itemsCount = 0;
            let categoriesCount = 0;

            // 3. Execution (Normalization & Insertion via Supabase)
            // Note: In a real scenario, this should be transactional or an RPC. 
            // For V1, we do efficient client-side calls.

            for (const cat of preset.categories) {
                // V1 PATCH: Alcohol Filter
                // If user explicitly said "No Alcohol" (Guided Mode), skip alcohol categories
                // Simple heuristic: check if category name contains "Vinho", "Cerveja", "Cocktail"
                if (context?.sellsAlcohol === false) {
                    const isAlcohol = /vinho|cerveja|cocktail|beer|wine|imperial/i.test(cat.name);
                    if (isAlcohol) continue;
                }

                // A. Create/Find Category
                // Ideally checks if exists, but assuming empty start for now or duplicate name acceptable
                const { data: categoryData, error: catError } = await this.supabase
                    .from('gm_menu_categories')
                    .insert({
                        restaurant_id: restaurantId,
                        name: cat.name,
                        is_visible: true,
                        order: 0
                    })
                    .select()
                    .single();

                if (catError) throw catError;
                categoriesCount++;

                // B. Create Items
                const dbItems = cat.items.map((item: any) => ({
                    restaurant_id: restaurantId,
                    category_id: categoryData.id,
                    name: item.name,
                    price: item.price, // LEGACY COLUMN (Display)
                    base_price: item.price, // KERNEL COLUMN
                    is_active: true,
                    // tax_profile_id: null, // V1 accepts null
                    // cost_center_id: null  // V1 accepts null
                }));

                const { error: itemsError } = await this.supabase
                    .from('gm_menu_items')
                    .insert(dbItems);

                if (itemsError) throw itemsError;
                itemsCount += dbItems.length;
            }

            // 4. Update Restaurant Status
            await this.supabase
                .from('gm_restaurants')
                .update({
                    menu_status: 'draft',
                    menu_version: 1
                })
                .eq('id', restaurantId);

            // 5. Success Log
            await this.supabase
                .from('menu_bootstrap_runs')
                .update({
                    status: 'SUCCESS',
                    completed_at: new Date().toISOString(),
                    log: [{ message: 'Preset injection successful' }]
                })
                .eq('id', run.id);

            // 6. Result Record
            await this.supabase
                .from('menu_bootstrap_results')
                .insert({
                    run_id: run.id,
                    created_items_count: itemsCount,
                    created_categories_count: categoriesCount,
                    normalization_report: { method: 'PRESET_DIRECT_MAP' }
                });

            return { success: true, itemsCount, categoriesCount };

        } catch (error: any) {
            console.error('[MBE] Injection Failed:', error);

            await this.supabase
                .from('menu_bootstrap_runs')
                .update({
                    status: 'FAILED',
                    completed_at: new Date().toISOString(),
                    log: [{ message: error.message, error }]
                })
                .eq('id', run.id);

            throw error;
        }
    }
}
