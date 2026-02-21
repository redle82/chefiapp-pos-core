export type Unit = 'kg' | 'L' | 'un' | 'pack';

export interface InventoryItem {
    id: string; // 'ketchup-heinz-bulk'
    name: string;
    category: 'raw_material' | 'consumable' | 'equipment';

    // 🧠 Context (Functional Metadata)
    packaging: {
        type: 'bulk_bag' | 'squeeze_bottle' | 'can' | 'box' | 'crate';
        hasDispenser: boolean; // If true, eliminates "serve in ramekin" task
        volumePerUnit: number;
        unit: Unit;
    };

    lifecycle: {
        requiresPrep: boolean; // Needs decanting/processing?
        shelfLifeAfterPrep: number; // Hours
        parLevel: number; // Ideal level
        criticalLevel: number; // Hunger level
        maxSafeStock?: number; // Ajuste 2: "Teto Metabólico" (Anti-Estoque Absurdo)
        // Metabolic Rules (The "Why" of buying)
        restockRule:
        | { type: 'threshold'; min: number; max: number } // "Buy when < 10, up to 50"
        | { type: 'calendar'; dayOfWeek: number; cutOffHour: number }; // "Buy on Wed (3) by 14h"

        // 🔍 Physical Count Ritual (The "Reality Check")
        auditRule?: {
            type: 'daily' | 'weekly' | 'pre_purchase'; // 'pre_purchase' means "Count before ordering"
            frequencyDays?: number; // For cyclical audits
            requiredAccuracy: 'high' | 'medium' | 'low'; // High = count by unit, Low = visual check
        };
        lastCountedAt?: number;
        responsibleRole: 'kitchen' | 'bar' | 'manager'; // "Owner is responsible" is usually Manager in code
    };

    // Current State (Physical Truth)
    currentStock: number;
    lastUpdated?: Date; // Phase 11.2 Metabolic Loop
    lastRestockedAt: number;
}

export interface TaskRecipe {
    id: string; // 'decant-ketchup'
    targetItemId: string; // 'ketchup-heinz-bulk'

    // 🛡️ The Anti-Zombie Filter
    conditions: {
        requiredPackaging?: 'bulk_bag' | 'can'; // Only exists if Bulk
        requiresDispenser?: boolean; // Only exists if NO dispenser
        stockBelow?: number; // Only exists if hungry
        requiresCapability?: string; // Law 9: Only exists if Organ has this capability
    };

    // The Task Definition
    definition: {
        title: string;
        description: string;
        role: 'kitchen' | 'waiter';
        estimatedTime: number; // Seconds
        priority: 'low' | 'medium' | 'high';
    };
}

export interface EquipmentOrgan {
    id: string;
    type: 'bottle_warmer' | 'sous_vide' | 'pump_station';
    status: 'active' | 'broken';
    capabilities: string[]; // ['heat', 'pump', 'seal']
}
