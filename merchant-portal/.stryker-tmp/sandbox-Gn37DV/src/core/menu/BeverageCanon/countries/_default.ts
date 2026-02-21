/**
 * DEFAULT BEVERAGE CANON
 * 
 * Fallback canon for countries without specific templates.
 * Uses international/generic beverage names.
 */

import type { CountryBeverageCanon, BeverageCanonItem } from '../types';

const items: BeverageCanonItem[] = [
    // WATER
    { name: 'Still Water', category: 'agua', volume: '50cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Sparkling Water', category: 'agua', volume: '50cl', system_provided: true, default_visibility: false, price_cents: null },

    // SOFT DRINKS
    { name: 'Cola', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Orange Soda', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Lemon Soda', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },

    // JUICES
    { name: 'Orange Juice', category: 'sucos', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Apple Juice', category: 'sucos', system_provided: true, default_visibility: false, price_cents: null },

    // BEERS
    { name: 'Draft Beer', category: 'cervejas', volume: '30cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Bottled Beer', category: 'cervejas', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },

    // WINES
    { name: 'Red Wine Glass', category: 'vinhos', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'White Wine Glass', category: 'vinhos', system_provided: true, default_visibility: false, price_cents: null },

    // HOT DRINKS
    { name: 'Espresso', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Coffee', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Tea', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
];

export const DEFAULT_BEVERAGE_CANON: CountryBeverageCanon = {
    country: '_DEFAULT',
    version: '1.0.0',
    items
};
