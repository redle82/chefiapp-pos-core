/**
 * UNIVERSAL BEVERAGE CANON - TYPE DEFINITIONS
 * 
 * Defines the structure for country-specific beverage templates.
 * These are injected automatically during Genesis.
 */
// @ts-nocheck


export interface BeverageCanonItem {
    /** Display name (e.g., "Coca-Cola 33cl") */
    name: string;

    /** Universal category ID (must match UNIVERSAL_BEVERAGE_CATEGORIES) */
    category: string;

    /** Volume/size descriptor (e.g., "33cl", "50cl", "1L") */
    volume?: string;

    /** Always true for canon items - prevents deletion */
    system_provided: true;

    /** false = requires activation by owner before appearing in TPV */
    default_visibility: boolean;

    /** Price in cents - null requires owner to set */
    price_cents: null | number;

    /** Optional tags for filtering/search */
    tags?: string[];
}

export interface BeverageCanonCategory {
    /** Unique category ID */
    id: string;

    /** Localized names */
    name_pt: string;
    name_en: string;
    name_es: string;

    /** Sort order in UI */
    sort_order: number;
}

export interface CountryBeverageCanon {
    /** ISO country code (e.g., "ES", "BR", "PT") */
    country: string;

    /** Canon version for tracking updates */
    version: string;

    /** Beverage items for this country */
    items: BeverageCanonItem[];
}

export type BeverageCanonLoader = (countryCode: string) => CountryBeverageCanon;
