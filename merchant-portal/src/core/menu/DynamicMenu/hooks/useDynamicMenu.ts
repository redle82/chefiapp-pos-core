/**
 * DYNAMIC MENU REACT HOOK
 * 
 * React hook for consuming dynamic menu in TPV and MiniPOS.
 * Handles real-time updates, click tracking, and favorites.
 */

import { useState, useEffect, useCallback } from 'react';
import { DynamicMenuService } from '../DynamicMenuService';
import type { DynamicMenuResponse, ProductWithScore } from '../types';

interface UseDynamicMenuOptions {
    restaurantId: string;
    contextualLimit?: number;
    mode?: 'tpv' | 'minipos';
    autoRefresh?: boolean; // Refresh every 5 minutes
}

interface UseDynamicMenuReturn {
    menu: DynamicMenuResponse | null;
    loading: boolean;
    error: Error | null;

    // Actions
    refresh: () => Promise<void>;
    trackClick: (productId: string) => Promise<void>;
    toggleFavorite: (productId: string, isFavorite: boolean) => Promise<void>;
}

export function useDynamicMenu(options: UseDynamicMenuOptions): UseDynamicMenuReturn {
    const {
        restaurantId,
        contextualLimit = 12,
        mode = 'tpv',
        autoRefresh = true
    } = options;

    const [menu, setMenu] = useState<DynamicMenuResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadMenu = useCallback(async () => {
        try {
            if (!restaurantId) return;

            setLoading(true);
            setError(null);

            const limit = mode === 'tpv' ? 12 : 8; // TPV shows more contextual items

            const result = await DynamicMenuService.getDynamicMenu(restaurantId, {
                contextualLimit: contextualLimit || limit
            });

            setMenu(result);
        } catch (err) {
            setError(err as Error);
            console.error('[useDynamicMenu] Load failed:', err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId, contextualLimit, mode]);

    const trackClick = useCallback(async (productId: string) => {
        try {
            await DynamicMenuService.trackClick(restaurantId, productId);

            // Optimistically update score (approximate)
            setMenu(prev => {
                if (!prev) return prev;

                const updateScore = (product: ProductWithScore) => {
                    if (product.id === productId) {
                        return { ...product, score: product.score + 20 }; // Click boost
                    }
                    return product;
                };

                return {
                    ...prev,
                    contextual: prev.contextual.map(updateScore),
                    favorites: prev.favorites.map(updateScore)
                };
            });

            // Refresh after 100ms to get real score
            setTimeout(loadMenu, 100);
        } catch (err) {
            console.error('[useDynamicMenu] Track click failed:', err);
        }
    }, [restaurantId, loadMenu]);

    const toggleFavorite = useCallback(async (productId: string, isFavorite: boolean) => {
        try {
            await DynamicMenuService.toggleFavorite(restaurantId, productId, isFavorite);

            // Immediately refresh to reflect change
            await loadMenu();
        } catch (err) {
            console.error('[useDynamicMenu] Toggle favorite failed:', err);
            throw err;
        }
    }, [restaurantId, loadMenu]);

    // Initial load
    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            console.log('[useDynamicMenu] Auto-refreshing menu...');
            loadMenu();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [autoRefresh, loadMenu]);

    return {
        menu,
        loading,
        error,
        refresh: loadMenu,
        trackClick,
        toggleFavorite
    };
}
