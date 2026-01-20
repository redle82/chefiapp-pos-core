/**
 * Hook para buscar menu items do banco
 */

import { useState, useEffect } from 'react';
import { supabase } from '../core/supabase';

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    priceCents: number;
    category: string;
    photoUrl?: string;
    trackStock?: boolean;
    stockQuantity?: number;
    visibility?: { tpv: boolean; web: boolean; delivery: boolean };
}

export function useMenuItems(restaurantId: string | null) {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        let retryCount = 0;
        let isMounted = true;

        const loadMenuItems = async () => {
            if (!isMounted) return;
            try {
                // Buscar categorias e itens
                const { data: categoriesData } = await supabase
                    .from('gm_menu_categories')
                    .select('id, name')
                    .eq('restaurant_id', restaurantId)
                    .order('sort_order');

                const { data: itemsData, error: itemsError } = await supabase
                    .from('gm_products')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .eq('status', 'available');
                // .order('created_at');

                if (itemsError) throw itemsError;

                if (itemsData && itemsData.length > 0) console.log('[useMenuItems] First Item:', itemsData[0]);

                // Mapear para formato esperado
                const categoryMap = new Map(
                    (categoriesData || []).map(cat => [cat.id, cat.name])
                );

                const mappedItems: MenuItem[] = (itemsData || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    priceCents: item.price_cents,
                    // FIX: Handle both schema variants (category_id OR category)
                    category: categoryMap.get(item.category_id || item.category) || 'Outros',
                    photoUrl: item.photo_url,
                    trackStock: item.track_stock,
                    stockQuantity: item.stock_quantity,
                    visibility: item.visibility
                }));

                if (isMounted) setItems(mappedItems);
            } catch (err) {
                console.error('[useMenuItems] Error:', err);
                if (isMounted) {
                    setError(err as Error);
                    // Retry logic (Max 3 retries)
                    if (retryCount < 3) {
                        retryCount++;
                        console.log(`[useMenuItems] Retrying... (${retryCount})`);
                        setTimeout(loadMenuItems, 2000);
                        // INTENTIONAL: Do not set loading=false here, keep it true during retry delay
                        return;
                    }
                }
            } finally {
                // Only set loading false if we are NOT retrying (i.e. success or max retries reached)
                // If we returned early above, this finally block runs for the CURRENT execution,
                // but since we restart loadMenuItems (async), we want to maintain loading=true state?
                // Actually `finally` runs before `return`? No, `return` inside catch exits function.
                // But `finally` ALWAYS runs.
                // We need to use a flag.
                if (isMounted && retryCount >= 3) setLoading(false);
                // Success case also needs loading=false.
                // We can't easily detect success vs retry in finally without a flag outside or relying on flow.
            }
            // BETTER APPROACH: Move setLoading(false) to success path and max-retry path explicitly.
            if (isMounted) setLoading(false);
        };

        loadMenuItems();

        return () => { isMounted = false; };
    }, [restaurantId]);

    return {
        items: (items.length === 0 && import.meta.env.DEV) ? [
            { id: 'mock-1', name: 'Mock Burger', priceCents: 1200, category: 'Burgers', description: 'Delicious mock burger' },
            { id: 'mock-2', name: 'Mock Cola', priceCents: 300, category: 'Drinks', description: 'Cold mock cola' }
        ] as MenuItem[] : items,
        loading,
        error
    };
}

