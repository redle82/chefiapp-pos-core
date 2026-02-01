/**
 * DYNAMIC MENU SERVICE
 * 
 * Main service for retrieving dynamically sorted menus.
 * Handles score calculation, caching, and favorites management.
 */

import { supabase } from '../../supabase';
import { calculateDynamicScore, getCurrentTimeSlot } from './scoring';
import type {
    DynamicMenuResponse,
    ProductWithScore,
    CategoryWithProducts,
    MenuSettings,
    ScoreWeights
} from './types';

export class DynamicMenuService {

    /**
     * Get dynamic menu for a restaurant at current time
     */
    public static async getDynamicMenu(
        restaurantId: string,
        options: {
            contextualLimit?: number;
            currentHour?: number;
            includeInactive?: boolean;
        } = {}
    ): Promise<DynamicMenuResponse> {
        const {
            contextualLimit = 12,
            currentHour = new Date().getHours(),
            includeInactive = false
        } = options;

        // 1. Get menu settings (weights, enabled flag)
        const settings = await this.getMenuSettings(restaurantId);

        if (!settings.dynamic_menu_enabled) {
            // Fallback to static menu
            return this.getStaticMenu(restaurantId);
        }

        // 2. Get all products with their dynamics
        // Note: Fetching products without 'category' column (may not exist in schema)
        const { data: products, error: productsError } = await supabase
            .from('gm_products')
            .select(`
                id,
                name,
                description,
                photo_url,
                price_cents,
                available,
                category_id
            `)
            .eq('restaurant_id', restaurantId)
            .eq('available', true);

        if (productsError || !products) {
            throw new Error('Failed to load products: ' + productsError?.message);
        }

        // 2b. Get categories separately if needed
        const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
        let categoriesMap = new Map();
        if (categoryIds.length > 0) {
            const { data: categories } = await supabase
                .from('gm_menu_categories')
                .select('id, name')
                .in('id', categoryIds);
            
            if (categories) {
                categoriesMap = new Map(categories.map(c => [c.id, c.name]));
            }
        }

        // 3. Get product dynamics
        const { data: dynamics, error: dynamicsError } = await supabase
            .from('product_dynamics')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (dynamicsError) {
            console.warn('[DynamicMenu] Failed to load dynamics:', dynamicsError);
        }

        // 4. Create dynamics map
        const dynamicsMap = new Map(
            (dynamics || []).map(d => [d.product_id, d])
        );

        // 5. Calculate scores for all products
        const productsWithScores: ProductWithScore[] = products.map(product => {
            const productDynamics = dynamicsMap.get(product.id);
            // Get category name from map if available, otherwise use category_id as fallback
            const categoryName = categoriesMap.get(product.category_id) || product.category_id || '';

            let score = 0;
            if (productDynamics) {
                const scoreResult = calculateDynamicScore(
                    productDynamics,
                    categoryName,
                    currentHour,
                    settings.score_weights
                );
                score = scoreResult.final_score;
            } else {
                // No dynamics: use fallback based on category + time
                const timeSlot = getCurrentTimeSlot(currentHour);
                score = this.getFallbackScore(categoryName, timeSlot);
            }

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                photo_url: product.photo_url,
                category: categoryName, // Use category name from map
                price_cents: product.price_cents,
                available: product.available,
                score,
                is_favorite: productDynamics?.is_favorite || false
            };
        });

        // 6. Sort by score (descending)
        const sortedProducts = [...productsWithScores].sort((a, b) => b.score - a.score);

        // 7. Split into contextual and favorites
        const favorites = sortedProducts
            .filter(p => p.is_favorite)
            .sort((a, b) => {
                const dynamicsA = dynamicsMap.get(a.id);
                const dynamicsB = dynamicsMap.get(b.id);
                return (dynamicsA?.favorite_order || 999) - (dynamicsB?.favorite_order || 999);
            });

        const contextual = sortedProducts
            .filter(p => !p.is_favorite)
            .slice(0, contextualLimit);

        // 8. Build full catalog by category
        const categoryMap = new Map<string, CategoryWithProducts>();

        for (const product of sortedProducts) {
            const categoryName = product.category;
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    id: categoryName,
                    name: categoryName,
                    products: []
                });
            }
            categoryMap.get(categoryName)!.products.push(product);
        }

        const fullCatalog = Array.from(categoryMap.values());

        return {
            contextual,
            favorites,
            fullCatalog
        };
    }

    /**
     * Track product click for recency scoring
     */
    public static async trackClick(
        restaurantId: string,
        productId: string
    ): Promise<void> {
        const { error } = await supabase
            .from('product_dynamics')
            .upsert({
                restaurant_id: restaurantId,
                product_id: productId,
                last_clicked_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'restaurant_id,product_id'
            });

        if (error) {
            console.warn('[DynamicMenu] Failed to track click:', error);
        }
    }

    /**
     * Pin/unpin product as favorite
     */
    public static async toggleFavorite(
        restaurantId: string,
        productId: string,
        isFavorite: boolean,
        order?: number
    ): Promise<void> {
        const { error } = await supabase
            .from('product_dynamics')
            .upsert({
                restaurant_id: restaurantId,
                product_id: productId,
                is_favorite: isFavorite,
                favorite_order: order || null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'restaurant_id,product_id'
            });

        if (error) {
            throw new Error('Failed to update favorite: ' + error.message);
        }
    }

    /**
     * Update menu settings (weights, enabled flag)
     */
    public static async updateSettings(
        restaurantId: string,
        settings: Partial<MenuSettings>
    ): Promise<void> {
        const { error } = await supabase
            .from('gm_restaurants')
            .update({
                menu_settings: settings
            })
            .eq('id', restaurantId);

        if (error) {
            throw new Error('Failed to update menu settings: ' + error.message);
        }
    }

    /**
     * Reset all dynamics (clear learning)
     */
    public static async resetDynamics(restaurantId: string): Promise<void> {
        const { error } = await supabase
            .from('product_dynamics')
            .delete()
            .eq('restaurant_id', restaurantId);

        if (error) {
            throw new Error('Failed to reset dynamics: ' + error.message);
        }
    }

    // --- Private Helpers ---

    private static async getMenuSettings(restaurantId: string): Promise<MenuSettings> {
        const { data, error } = await supabase
            .from('gm_restaurants')
            .select('menu_settings')
            .eq('id', restaurantId)
            .single();

        // If column doesn't exist or query fails, return defaults
        if (error || !data?.menu_settings) {
            console.warn('[DynamicMenu] menu_settings not found, using defaults:', error?.message);
            // Return defaults
            return {
                dynamic_menu_enabled: true,
                score_weights: {
                    time_match: 0.4,
                    recent_frequency: 0.3,
                    click_recency: 0.2,
                    favorite_bonus: 0.1
                },
                time_slots: {
                    morning: [6, 11],
                    lunch: [12, 16],
                    afternoon: [17, 19],
                    night: [20, 23]
                }
            };
        }

        return data.menu_settings as MenuSettings;
    }

    private static async getStaticMenu(restaurantId: string): Promise<DynamicMenuResponse> {
        // Simple alphabetical sort when dynamic is disabled
        const { data: products } = await supabase
            .from('gm_products')
            .select('id, name, price_cents, available, category_id')
            .eq('restaurant_id', restaurantId)
            .eq('available', true)
            .order('name');

        // Get category names if needed
        const categoryIds = [...new Set((products || []).map(p => p.category_id).filter(Boolean))];
        let categoriesMap = new Map();
        if (categoryIds.length > 0) {
            const { data: categories } = await supabase
                .from('gm_menu_categories')
                .select('id, name')
                .in('id', categoryIds);
            
            if (categories) {
                categoriesMap = new Map(categories.map(c => [c.id, c.name]));
            }
        }

        const productsWithScores: ProductWithScore[] = (products || []).map(p => ({
            id: p.id,
            name: p.name,
            category: categoriesMap.get(p.category_id) || p.category_id || '',
            price_cents: p.price_cents,
            available: p.available,
            score: 0,
            is_favorite: false
        }));

        return {
            contextual: productsWithScores,
            favorites: [],
            fullCatalog: []
        };
    }

    private static getFallbackScore(category: string, timeSlot: string): number {
        const fallbacks: Record<string, Record<string, number>> = {
            morning: { quentes: 90, sucos: 70, agua: 50 },
            lunch: { comida: 90, vinhos: 60, agua: 70 },
            afternoon: { quentes: 60, refrigerantes: 50 },
            night: { cervejas: 90, destilados: 80, vinhos: 70 }
        };

        return fallbacks[timeSlot]?.[category.toLowerCase()] || 20;
    }
}
