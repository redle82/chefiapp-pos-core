// @ts-nocheck
import type { InventoryItem } from './InventoryTypes';

// ------------------------------------------------------------------
// 🏛️ SOFIA GASTROBAR - INVENTORY TRUTH
// ------------------------------------------------------------------
// "Inventário não é democrático. Tem dono e ritual."
// ------------------------------------------------------------------

export const SOFIA_INVENTORY: InventoryItem[] = [
    // 🍕 1. PIZZAS (The "Threshold" Logic)
    // "Só compramos quando temos 10-20 pizzas"
    {
        id: 'base-pizza-artesanal',
        name: 'Base Pizza Artesanal (Congelada)',
        category: 'raw_material',
        packaging: { type: 'box', hasDispenser: false, volumePerUnit: 1, unit: 'un' },
        currentStock: 15, // Scenario: In the "Help" zone (10-20)
        lastRestockedAt: Date.now() - 86400000 * 2,
        lifecycle: {
            requiresPrep: false,
            shelfLifeAfterPrep: 0,
            parLevel: 50, // Ideal
            criticalLevel: 20, // Start buying
            maxSafeStock: 60, // Don't buy if > 60 (Freezer Full)
            restockRule: { type: 'threshold', min: 20, max: 50 },
            responsibleRole: 'kitchen'
        }
    },

    // 🥤 2. BEBIDAS (The "Calendar" Logic)
    // "Entrega fixa: quarta até 14h"
    {
        id: 'keg-super-bock',
        name: 'Super Bock (Barril 50L)',
        category: 'consumable',
        packaging: { type: 'crate', hasDispenser: true, volumePerUnit: 50, unit: 'L' },
        currentStock: 2, // Low, but only matters if it's Wednesday
        lastRestockedAt: Date.now() - 86400000 * 6,
        lifecycle: {
            requiresPrep: false,
            shelfLifeAfterPrep: 0,
            parLevel: 4,
            criticalLevel: 1, // Emergency only
            maxSafeStock: 6, // Storage limit
            restockRule: { type: 'calendar', dayOfWeek: 3, cutOffHour: 14 }, // Wednesday 14h
            responsibleRole: 'bar'
        }
    },
    {
        id: 'wine-house-red',
        name: 'Vinho Casa Tinto (Bag)',
        category: 'consumable',
        packaging: { type: 'bulk_bag', hasDispenser: true, volumePerUnit: 5, unit: 'L' },
        currentStock: 3,
        lastRestockedAt: Date.now() - 86400000 * 6,
        lifecycle: {
            requiresPrep: false,
            shelfLifeAfterPrep: 720, // 30 days open
            parLevel: 10,
            criticalLevel: 3,
            maxSafeStock: 15,
            restockRule: { type: 'calendar', dayOfWeek: 3, cutOffHour: 14 }, // Wednesday 14h
            responsibleRole: 'bar'
        }
    },

    // 🥩 3. PERECÍVEIS CRÍTICOS (The "Daily" Logic)
    // "Compra diária básica" -> precisa de guia para evitar impulso
    {
        id: 'fresh-mozzarella',
        name: 'Mozzarella Fresca (Bola)',
        category: 'raw_material',
        packaging: { type: 'box', hasDispenser: false, volumePerUnit: 1, unit: 'kg' },
        currentStock: 2,
        lastRestockedAt: Date.now() - 86400000,
        lifecycle: {
            requiresPrep: false,
            shelfLifeAfterPrep: 48, // 2 days shelf life! Critical.
            parLevel: 5,
            criticalLevel: 2,
            maxSafeStock: 6, // Strictly limited by shelf life
            restockRule: { type: 'threshold', min: 2, max: 5 }, // Just-in-time
            responsibleRole: 'kitchen'
        }
    },
    {
        id: 'salad-mix',
        name: 'Mix de Folhas (Lavado)',
        category: 'raw_material',
        packaging: { type: 'bulk_bag', hasDispenser: false, volumePerUnit: 1, unit: 'kg' },
        currentStock: 0.5, // 500g
        lastRestockedAt: Date.now() - 86400000,
        lifecycle: {
            requiresPrep: false,
            shelfLifeAfterPrep: 24, // 1 day
            parLevel: 3,
            criticalLevel: 1,
            maxSafeStock: 4, // Anti-waste limit
            restockRule: { type: 'threshold', min: 1, max: 3 },
            responsibleRole: 'kitchen'
        }
    }
];

// 🧠 RITUAL DEFINITIONS
export const SOFIA_RITUALS = {
    DRINKS_WEDNESDAY: {
        id: 'ritual-drinks-wed',
        name: 'Ritual de Bebidas (Quarta-feira)',
        dayOfWeek: 3,
        windowStart: 10, // 10:00
        windowEnd: 14,   // 14:00
        responsible: 'manager',
        primaryChecklist: ['keg-super-bock', 'wine-house-red']
    },
    DAILY_PERISHABLES: {
        id: 'ritual-daily-fresh',
        name: 'Ritual de Perecíveis (Diário)',
        windowStart: 9,
        windowEnd: 11,
        responsible: 'kitchen',
        primaryChecklist: ['fresh-mozzarella', 'salad-mix']
    }
};
