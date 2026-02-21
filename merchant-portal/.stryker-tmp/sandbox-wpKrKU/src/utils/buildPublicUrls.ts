/**
 * Build Public URLs for Restaurant Web Pages
 * 
 * Generates URLs for public-facing restaurant pages based on slug or restaurant ID.
 */

import { CONFIG } from '../config';

const WEB_SERVER_BASE = CONFIG.API_BASE;

export interface PublicUrls {
    home: string;
    menu: string;
    table: (tableNumber: number) => string;
}

/**
 * Build public URLs for a restaurant
 */
export function buildPublicUrls(slug: string): PublicUrls {
    const base = `${WEB_SERVER_BASE}/public/${encodeURIComponent(slug)}`;
    
    return {
        home: base,
        menu: `${base}/menu`,
        table: (tableNumber: number) => {
            // QR table links - if feature exists
            // For now, return menu URL as fallback
            return `${base}/menu?table=${tableNumber}`;
        }
    };
}

/**
 * Get restaurant slug from restaurant ID (via API)
 */
export async function getRestaurantSlug(restaurantId: string): Promise<string | null> {
    try {
        const response = await fetch(`${WEB_SERVER_BASE}/api/restaurants/${restaurantId}/public-profile`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return data.slug || null;
    } catch (error) {
        console.error('Error fetching restaurant slug:', error);
        return null;
    }
}

