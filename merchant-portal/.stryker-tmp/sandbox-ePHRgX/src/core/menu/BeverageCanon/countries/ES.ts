/**
 * SPAIN (ES) - BEVERAGE CANON
 * 
 * Common beverages found in Spanish bars, cafés, and restaurants.
 * Version: 1.0.0
 */
// @ts-nocheck


import type { CountryBeverageCanon, BeverageCanonItem } from '../types';

const items: BeverageCanonItem[] = [
    // AGUAS
    { name: 'Agua con gas', category: 'agua', volume: '50cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Agua sin gas', category: 'agua', volume: '50cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Agua con gas', category: 'agua', volume: '1L', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Agua sin gas', category: 'agua', volume: '1L', system_provided: true, default_visibility: false, price_cents: null },

    // REFRESCOS
    { name: 'Coca-Cola', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null, tags: ['cola'] },
    { name: 'Coca-Cola Zero', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null, tags: ['cola', 'zero'] },
    { name: 'Fanta Naranja', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Fanta Limón', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Sprite', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Nestea', category: 'refrigerantes', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null, tags: ['té'] },
    { name: 'Tónica Schweppes', category: 'refrigerantes', volume: '20cl', system_provided: true, default_visibility: false, price_cents: null },

    // ZUMOS
    { name: 'Zumo de Naranja Natural', category: 'sucos', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Zumo de Piña', category: 'sucos', volume: '20cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Zumo de Melocotón', category: 'sucos', volume: '20cl', system_provided: true, default_visibility: false, price_cents: null },

    // CERVEZAS
    { name: 'Caña', category: 'cervejas', volume: '20cl', system_provided: true, default_visibility: false, price_cents: null, tags: ['draft'] },
    { name: 'Cerveza Botella', category: 'cervejas', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Cerveza sin Alcohol', category: 'cervejas', volume: '33cl', system_provided: true, default_visibility: false, price_cents: null, tags: ['sin alcohol'] },

    // VINOS
    { name: 'Vino Tinto Copa', category: 'vinhos', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Vino Blanco Copa', category: 'vinhos', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Vino Rosado Copa', category: 'vinhos', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Sangría', category: 'vinhos', volume: '1L', system_provided: true, default_visibility: false, price_cents: null },

    // BEBIDAS CALIENTES
    { name: 'Café Solo', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Café Cortado', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Café con Leche', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Café Americano', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Café Doble', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Té', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Infusión', category: 'quentes', system_provided: true, default_visibility: false, price_cents: null },

    // DESTILADOS
    { name: 'Ginebra', category: 'destilados', volume: '4cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Vodka', category: 'destilados', volume: '4cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Ron', category: 'destilados', volume: '4cl', system_provided: true, default_visibility: false, price_cents: null },
    { name: 'Whisky', category: 'destilados', volume: '4cl', system_provided: true, default_visibility: false, price_cents: null },
];

export const ES_BEVERAGE_CANON: CountryBeverageCanon = {
    country: 'ES',
    version: '1.0.0',
    items
};
