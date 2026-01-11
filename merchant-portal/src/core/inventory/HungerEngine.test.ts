/**
 * HungerEngine Tests
 * 
 * Tests hunger signal generation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    generateHungerSignals,
    filterSignalsByUrgency,
    groupSignalsByUrgency
} from './HungerEngine';
import type { InventoryItem } from './InventoryTypes';

describe('HungerEngine', () => {

    let mockInventory: InventoryItem[];

    beforeEach(() => {
        mockInventory = [
            {
                id: 'item-1',
                name: 'Mozzarella',
                category: 'raw_material',
                packaging: { type: 'box', hasDispenser: false, volumePerUnit: 1, unit: 'kg' },
                lifecycle: {
                    requiresPrep: false,
                    shelfLifeAfterPrep: 0,
                    parLevel: 10,
                    criticalLevel: 2,
                    restockRule: { type: 'threshold', min: 2, max: 10 },
                    responsibleRole: 'kitchen'
                },
                currentStock: 10,
                lastRestockedAt: 0
            },
            {
                id: 'item-2',
                name: 'Beer Keg',
                category: 'consumable',
                packaging: { type: 'box', hasDispenser: false, volumePerUnit: 1, unit: 'un' },
                lifecycle: {
                    requiresPrep: false,
                    shelfLifeAfterPrep: 0,
                    parLevel: 5,
                    criticalLevel: 1,
                    restockRule: { type: 'calendar', dayOfWeek: 3, cutOffHour: 14 }, // Wed < 14h
                    responsibleRole: 'bar'
                },
                currentStock: 5,
                lastRestockedAt: 0
            }
        ];
    });

    it('generates no signals when stock is healthy', () => {
        const signals = generateHungerSignals(mockInventory);
        expect(signals).toHaveLength(0);
    });

    it('generates signal when stock drops below min threshold', () => {
        mockInventory[0].currentStock = 1.5; // Below min 2
        const signals = generateHungerSignals(mockInventory);

        expect(signals).toHaveLength(1);
        expect(signals[0].itemId).toBe('item-1');
        expect(signals[0].kind).toBe('HUNGER');
    });

    it('generates signal on calendar day (simulation)', () => {
        // Mock Date to be Wednesday 10am
        const MockDate = class extends Date {
            getDay() { return 3; } // Wed
            getHours() { return 10; } // 10am
        } as any;

        const originalDate = global.Date;
        global.Date = MockDate;

        const signals = generateHungerSignals(mockInventory);

        expect(signals).toHaveLength(1); // Beer Keg
        expect(signals[0].itemId).toBe('item-2');

        global.Date = originalDate;
    });

    it('assigns CRITICAL urgency when stock is 0', () => {
        mockInventory[0].currentStock = 0;
        const signals = generateHungerSignals(mockInventory);

        expect(signals[0].urgency).toBe('critical');
    });

    it('assigns HIGH urgency when stock < critical * 0.5', () => {
        mockInventory[0].currentStock = 0.5; // Critical is 2, 0.5 < 1
        const signals = generateHungerSignals(mockInventory);
        expect(signals[0].urgency).toBe('high');
    });

    it('filters signals by urgency', () => {
        const signals: any[] = [
            { urgency: 'low' },
            { urgency: 'medium' },
            { urgency: 'high' },
            { urgency: 'critical' }
        ];

        const output = filterSignalsByUrgency(signals, 'high');
        expect(output).toHaveLength(2); // High + Critical
    });
});
