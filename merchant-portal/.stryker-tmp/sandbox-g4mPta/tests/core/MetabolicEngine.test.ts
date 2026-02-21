import { describe, it, expect } from 'vitest';
import { isZombie } from '../../src/core/inventory/MetabolicEngine';
import { InventoryItem, TaskRecipe, EquipmentOrgan } from '../../src/core/inventory/InventoryTypes';

// Mocks
const MOCK_ITEM: InventoryItem = {
    id: 'item_1',
    name: 'Steak',
    packaging: { type: 'cryovac', unit: 'kg', hasDispenser: false },
    currentStock: 10,
    lifecycle: { parLevel: 20 },
} as any;

const MOCK_RECIPE: TaskRecipe = {
    id: 'recipe_1',
    action: 'sous_vide',
    conditions: {
        requiresCapability: 'sous_vide',
        requiredPackaging: 'cryovac'
    }
} as any;

const MOCK_ORGA_ACTIVE: EquipmentOrgan = {
    id: 'sous_vide_1',
    name: 'Anova Pro',
    status: 'healthy',
    capabilities: { sous_vide: true }
} as any;

const MOCK_ORGA_BROKEN: EquipmentOrgan = {
    id: 'sous_vide_1',
    name: 'Anova Pro',
    status: 'maintenance',
    capabilities: { sous_vide: true }
} as any;

describe('MetabolicEngine (The Judge)', () => {

    it('should ALLOW task if conditions met and organ active', () => {
        const result = isZombie(MOCK_ITEM, MOCK_RECIPE, [MOCK_ORGA_ACTIVE]);
        expect(result).toBe(false); // Not a zombie
    });

    it('should KILL task (Zombie) if required capability is missing (Empty Organs)', () => {
        const result = isZombie(MOCK_ITEM, MOCK_RECIPE, []); // No organs
        expect(result).toBe(true);
    });

    it('should KILL task (Zombie) if organ exists but is BROKEN', () => {
        const result = isZombie(MOCK_ITEM, MOCK_RECIPE, [MOCK_ORGA_BROKEN]);
        expect(result).toBe(true);
    });

    it('should KILL task (Zombie) if packaging mismatches', () => {
        const wrongItem = { ...MOCK_ITEM, packaging: { ...MOCK_ITEM.packaging, type: 'box' } } as any;
        const result = isZombie(wrongItem, MOCK_RECIPE, [MOCK_ORGA_ACTIVE]);
        expect(result).toBe(true);
    });

    it('should KILL task (Zombie) if stock is FULL (Hunger Check)', () => {
        const fullItem = { ...MOCK_ITEM, currentStock: 25 }; // Par is 20
        const result = isZombie(fullItem, MOCK_RECIPE, [MOCK_ORGA_ACTIVE]);
        expect(result).toBe(true);
    });
});
