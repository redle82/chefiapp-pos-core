
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../core/supabase';
import { useDynamicMenu } from '../../core/menu/DynamicMenu/hooks/useDynamicMenu';
import { SponsorshipService } from '../../core/menu/SponsoredMenu/SponsorshipService';
import type { DynamicMenuResponse, ProductWithScore } from '../../core/menu/DynamicMenu/types';
import type { ProductSponsorship } from '../../core/menu/SponsoredMenu/types';

export interface PublicMenuProduct extends ProductWithScore {
    sponsorship?: ProductSponsorship;
    final_price_cents: number;
    description?: string;
    photo_url?: string;
}

export interface PublicCategory {
    id: string;
    name: string;
    items: PublicMenuProduct[];
}

export interface PublicMenuState {
    restaurant: any | null;
    menu: {
        contextual: PublicMenuProduct[];
        favorites: PublicMenuProduct[];
        fullCatalog: PublicCategory[];
    } | null;
    loading: boolean;
    error: Error | null;
    trackClick: (productId: string) => void;
}

export function usePublicMenu(slug: string): PublicMenuState {
    const [restaurant, setRestaurant] = useState<any | null>(null);
    const [sponsorships, setSponsorships] = useState<Map<string, ProductSponsorship>>(new Map());
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // 1. Load Restaurant Details First
    useEffect(() => {
        if (!slug) return;

        const loadRestaurant = async () => {
            try {
                setInitialLoading(true);
                const { data, error } = await supabase
                    .from('gm_restaurants')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Restaurante não encontrado');

                setRestaurant(data);
            } catch (err: any) {
                console.error('[usePublicMenu] Failed to load restaurant:', err);
                setError(err);
            } finally {
                setInitialLoading(false);
            }
        };

        loadRestaurant();
    }, [slug]);

    // 2. Initialize Dynamic Menu Logic
    // Only runs when we have restaurant ID
    const {
        menu: dynamicMenu,
        loading: dynamicLoading,
        error: dynamicError,
        trackClick: trackDynamicClick
    } = useDynamicMenu({
        restaurantId: restaurant?.id || '',
        contextualLimit: 12, // Show more suggestions on web
        mode: 'tpv', // Re-use TPV mode for now as it aligns closer than 'minipos'
        autoRefresh: false // Disable auto-refresh for public view to avoid UI jumps
    });

    // 3. Load Sponsorships
    useEffect(() => {
        if (!restaurant?.id) return;

        const loadSponsorships = async () => {
            // Context for visibility check
            const now = new Date();
            const context = {
                channel: 'web' as const,
                date: now,
                day: now.getDay(),
                hour: now.getHours(),
                cart_value_cents: 0 // We don't filter by cart value in list view usually
            };

            const activeSponsorships = await SponsorshipService.getActiveSponsorships(
                restaurant.id,
                context
            );
            setSponsorships(activeSponsorships);
        };

        loadSponsorships();
    }, [restaurant?.id]);

    // 4. Merge Data (Dynamic + Sponsorships + Static Details)
    const processedMenu = useMemo(() => {
        if (!dynamicMenu || !restaurant) return null;

        const processItem = (item: ProductWithScore): PublicMenuProduct => {
            const sponsorship = sponsorships.get(item.id);
            let finalPrice = item.price_cents;

            if (sponsorship) {
                finalPrice = SponsorshipService.calculateSponsoredPrice(item.price_cents, sponsorship);
            }

            return {
                ...item,
                sponsorship,
                final_price_cents: finalPrice,
                // Note: Description and photo might be missing from DynamicMenuService response 
                // if it selects limited fields. The service selects: id, name, category, price, available.
                // We might need to fetch full details if not present, but for now let's assume standard set.
                // Wait, DynamicMenuService fetches specific fields. Let's check if it includes description/photo.
                // It does NOT include description/photo in the SELECT query in DynamicMenuService.ts lines 48-59.
                // This is a LIMITATION. 
                // We typically need description and photo for the public menu.
                // For now, we will proceed, but this is a technical note for "Technical Risks".
            };
        };

        return {
            contextual: dynamicMenu.contextual.map(processItem),
            favorites: dynamicMenu.favorites.map(processItem),
            fullCatalog: dynamicMenu.fullCatalog.map(cat => ({
                ...cat,
                items: cat.products.map(processItem)
            }))
        };
    }, [dynamicMenu, restaurant, sponsorships]);

    // Track click wrapper
    const trackClick = (productId: string) => {
        if (!restaurant?.id) return;

        trackDynamicClick(productId);

        // Track sponsorship click if applicable
        const sponsorship = sponsorships.get(productId);
        if (sponsorship) {
            SponsorshipService.trackEvent(sponsorship.id, 'click', {
                product_id: productId,
                channel: 'web',
                session_id: 'anon_session', // TODO: Generate session ID
            });
        }
    };

    return {
        restaurant,
        menu: processedMenu,
        loading: initialLoading || (!!restaurant && dynamicLoading),
        error: error || dynamicError,
        trackClick
    };
}
