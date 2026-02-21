/**
 * UNIVERSAL BEVERAGE CATEGORIES
 * 
 * These categories are immutable and exist across all countries.
 * They cannot be deleted, only activated/deactivated.
 */

import type { BeverageCanonCategory } from './types';

export const UNIVERSAL_BEVERAGE_CATEGORIES: readonly BeverageCanonCategory[] = [
    {
        id: 'agua',
        name_pt: 'Águas',
        name_en: 'Water',
        name_es: 'Aguas',
        sort_order: 1
    },
    {
        id: 'refrigerantes',
        name_pt: 'Refrigerantes',
        name_en: 'Soft Drinks',
        name_es: 'Refrescos',
        sort_order: 2
    },
    {
        id: 'sucos',
        name_pt: 'Sucos',
        name_en: 'Juices',
        name_es: 'Zumos',
        sort_order: 3
    },
    {
        id: 'cervejas',
        name_pt: 'Cervejas',
        name_en: 'Beers',
        name_es: 'Cervezas',
        sort_order: 4
    },
    {
        id: 'vinhos',
        name_pt: 'Vinhos',
        name_en: 'Wines',
        name_es: 'Vinos',
        sort_order: 5
    },
    {
        id: 'quentes',
        name_pt: 'Bebidas Quentes',
        name_en: 'Hot Drinks',
        name_es: 'Bebidas Calientes',
        sort_order: 6
    },
    {
        id: 'destilados',
        name_pt: 'Destilados',
        name_en: 'Spirits',
        name_es: 'Destilados',
        sort_order: 7
    }
] as const;

/**
 * Get localized category name based on system language
 */
export function getCategoryName(
    categoryId: string,
    language: 'pt' | 'en' | 'es' = 'es'
): string {
    const category = UNIVERSAL_BEVERAGE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return categoryId;

    switch (language) {
        case 'pt': return category.name_pt;
        case 'en': return category.name_en;
        case 'es': return category.name_es;
        default: return category.name_es;
    }
}
