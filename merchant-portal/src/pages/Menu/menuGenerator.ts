/**
 * AI Menu Generator (Heuristic MVP)
 * 
 * Generates starter menus based on cuisine and vibe.
 * This mocks an AI response using robust templates.
 */

import type { ParsedMenuItem, MenuPrompt } from './MenuSharedTypes';

export type { MenuPrompt };

interface TemplateItem {
    name: string;
    priceBase: number;
    category: string;
    desc?: string;
    imageUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, TemplateItem[]> = {
    'pizza': [
        { category: 'Pizzas', name: 'Margherita', priceBase: 10, desc: 'Molho de tomate, mozzarella, manjericão' },
        { category: 'Pizzas', name: 'Pepperoni', priceBase: 12, desc: 'Molho de tomate, mozzarella, pepperoni' },
        { category: 'Pizzas', name: 'Quatro Queijos', priceBase: 13, desc: 'Mozzarella, gorgonzola, parmesão, provolone' },
        { category: 'Pizzas', name: 'Frango com Catupiry', priceBase: 12, desc: 'Frango desfiado, catupiry, milho' },
        { category: 'Bebidas', name: 'Refrigerante Lata', priceBase: 2, imageUrl: '/assets/products/coke.png' },
        { category: 'Bebidas', name: 'Cerveja Long Neck', priceBase: 3 },
        { category: 'Sobremesas', name: 'Pizza de Chocolate', priceBase: 8, desc: 'Chocolate ao leite, morangos' },
    ],
    'burger': [
        { category: 'Burgers', name: 'Cheeseburger', priceBase: 9, desc: 'Pão brioche, carne 150g, queijo cheddar', imageUrl: '/assets/products/burger.png' },
        { category: 'Burgers', name: 'Bacon Burger', priceBase: 11, desc: 'Pão brioche, carne 150g, bacon, cheddar', imageUrl: '/assets/products/burger.png' },
        { category: 'Burgers', name: 'Veggie Burger', priceBase: 10, desc: 'Burger de grão de bico, alface, tomate' },
        { category: 'Acompanhamentos', name: 'Batata Frita', priceBase: 3, imageUrl: '/assets/products/fries.png' },
        { category: 'Acompanhamentos', name: 'Onion Rings', priceBase: 4 },
        { category: 'Bebidas', name: 'Milkshake Chocolate', priceBase: 5 },
        { category: 'Bebidas', name: 'Refrigerante e Lata', priceBase: 3, imageUrl: '/assets/products/coke.png' },
    ],
    'sushi': [
        { category: 'Entradas', name: 'Sunomono', priceBase: 4, desc: 'Salada de pepino agridoce' },
        { category: 'Entradas', name: 'Guioza (6 un)', priceBase: 6, desc: 'Pastelzinho oriental de carne' },
        { category: 'Combinados', name: 'Combinado Salmão (20 peças)', priceBase: 25 },
        { category: 'Temakis', name: 'Temaki Salmão Completo', priceBase: 8 },
        { category: 'Temakis', name: 'Temaki Skin', priceBase: 6 },
        { category: 'Bebidas', name: 'Água sem Gás', priceBase: 1.5 },
        { category: 'Bebidas', name: 'Sake Dose', priceBase: 5 },
    ],
    'cafe': [
        { category: 'Cafés', name: 'Expresso', priceBase: 1 },
        { category: 'Cafés', name: 'Cappuccino', priceBase: 2.5 },
        { category: 'Cafés', name: 'Latte Macchiato', priceBase: 3 },
        { category: 'Salgados', name: 'Croissant', priceBase: 2 },
        { category: 'Salgados', name: 'Pão de Queijo', priceBase: 1.5 },
        { category: 'Doces', name: 'Fatia de Bolo', priceBase: 3.5 },
        { category: 'Bebidas', name: 'Sumo de Laranja', priceBase: 2.5 },
    ],
    'generic': [
        { category: 'Entradas', name: 'Couvert', priceBase: 2.5, desc: 'Pão, azeitonas e manteiga' },
        { category: 'Pratos Principais', name: 'Prato do Dia', priceBase: 12 },
        { category: 'Pratos Principais', name: 'Bitoque', priceBase: 10, desc: 'Bife, ovo, batata frita, arroz' },
        { category: 'Bebidas', name: 'Refrigerante', priceBase: 2 },
        { category: 'Bebidas', name: 'Água', priceBase: 1.5 },
        { category: 'Sobremesas', name: 'Mousse de Chocolate', priceBase: 3.5 },
        { category: 'Cafetaria', name: 'Café', priceBase: 1 },
    ]
};

// ─────────────────────────────────────────────────────────────
// Logic
// ─────────────────────────────────────────────────────────────

export function generateMenu(prompt: MenuPrompt): Promise<ParsedMenuItem[]> {
    return new Promise((resolve) => {
        // Fake AI Latency
        setTimeout(() => {
            const key = Object.keys(TEMPLATES).find(k =>
                prompt.cuisine.toLowerCase().includes(k)
            ) || 'generic';

            const template = TEMPLATES[key];
            const multiplier = getPriceMultiplier(prompt.vibe);

            const items: ParsedMenuItem[] = template.map((t, index) => ({
                lineNumber: index + 1,
                categoria: t.category,
                produto: t.name,
                preco: Math.round(t.priceBase * multiplier * 100) / 100, // Round to 2 decimals
                descricao: t.desc,
                ativo: true,
                iva: 23,
                imageUrl: t.imageUrl // Visual Polish
            }));

            resolve(items);
        }, 1500);
    });
}

export function generateFromImage(file: File): Promise<ParsedMenuItem[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock Vision API response
            resolve([
                { lineNumber: 1, categoria: 'Sugestões do Chef', produto: 'Prato da Foto 1', preco: 15.00, descricao: 'Identificado via OCR', ativo: true, iva: 23 },
                { lineNumber: 2, categoria: 'Sugestões do Chef', produto: 'Prato da Foto 2', preco: 18.50, descricao: 'Identificado via OCR', ativo: true, iva: 23 },
                { lineNumber: 3, categoria: 'Bebidas', produto: 'Vinho Tinto', preco: 12.00, descricao: 'Garrafa identificada', ativo: true, iva: 23 }
            ]);
        }, 2000);
    });
}

export function generateFromUrl(url: string): Promise<ParsedMenuItem[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock Scraper response
            resolve([
                { lineNumber: 1, categoria: 'Importados Web', produto: 'Combo Família', preco: 25.90, descricao: `Importado de ${url}`, ativo: true, iva: 23 },
                { lineNumber: 2, categoria: 'Importados Web', produto: 'Burger Especial', preco: 10.90, ativo: true, iva: 23 }
            ]);
        }, 1500);
    });
}

function getPriceMultiplier(vibe: MenuPrompt['vibe']): number {
    switch (vibe) {
        case 'CHEAP': return 0.8;
        case 'PREMIUM': return 1.5;
        default: return 1.0;
    }
}

export const SUGGESTED_CUISINES = [
    { id: 'pizza', label: 'Pizzaria', icon: '🍕' },
    { id: 'burger', label: 'Hamburgueria', icon: '🍔' },
    { id: 'sushi', label: 'Japonês', icon: '🍣' },
    { id: 'cafe', label: 'Café / Padaria', icon: '☕' },
    { id: 'generic', label: 'Restaurante Típico', icon: '🍽️' },
];
