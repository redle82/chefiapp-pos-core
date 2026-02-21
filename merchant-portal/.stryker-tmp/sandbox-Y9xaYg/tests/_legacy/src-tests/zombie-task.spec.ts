
import { test, expect } from '@playwright/test';
import { generateLatentObligations } from '../intelligence/nervous-system/LatentObligationGenerator';
import type { EquipmentOrgan } from '../pages/AppStaff/context/StaffCoreTypes';
import { now as getNow } from '../intelligence/nervous-system/Clock';

test.describe('🧟 Law 8: Contextual Validity (Zombie Task Detection)', () => {

    test('Case A: The Old World (Bottles require Decanting)', async () => {
        // 1. Setup: Old Ketchup Bottles
        const now = getNow();
        // They need daily cleaning AND daily decanting.
        const ketchupBottles: EquipmentOrgan = {
            id: 'ketchup-bottles-legacy',
            name: 'Ketchup Bottles',
            type: 'condiments' as any,
            status: 'healthy',
            metabolism: {
                cleaningCycle: 'daily',
                maintenanceCycle: 'monthly',
                lastCleanedAt: now - (25 * 60 * 60 * 1000), // 25h ago (Needs action)
                lastMaintainedAt: now
            },
            capabilities: {
                requiresDecanting: true // 👈 THE TRIGGER
            }
        };

        // 2. Execution: Generate Obligations
        const obligations = generateLatentObligations([ketchupBottles], now);

        // 3. Verification: Should see TWO obligations
        // - One for standard cleaning (hygiene)
        // - One for DECANTING (ritual)

        console.log('Old World Obligations:', obligations.map(o => o.id));

        const hasCleaning = obligations.some(o => o.type === 'cleaning');
        const hasDecanting = obligations.some(o => o.title.includes('Decantar'));

        expect(hasCleaning).toBe(true);
        expect(hasDecanting).toBe(true);
    });

    test('Case B: The New World (Dispensers kill the Task)', async () => {
        // 1. Setup: New Fancy Dispensers
        const now = getNow();
        // They need daily cleaning, but ZERO decanting.
        const ketchupDispenser: EquipmentOrgan = {
            id: 'ketchup-dispenser-modern',
            name: 'Ketchup Giant Dispenser',
            type: 'condiments' as any,
            status: 'healthy',
            metabolism: {
                cleaningCycle: 'daily',
                maintenanceCycle: 'monthly',
                lastCleanedAt: now - (25 * 60 * 60 * 1000), // 25h ago
                lastMaintainedAt: now
            },
            capabilities: {
                requiresDecanting: false // 👈 THE ANTIDOTE
            }
        };

        // 2. Execution: Generate Obligations
        const obligations = generateLatentObligations([ketchupDispenser], now);

        // 3. Verification: Should see ONLY cleaning. 
        // The "Decant" task must be DEAD (Zombie).

        console.log('New World Obligations:', obligations.map(o => o.id));

        const hasCleaning = obligations.some(o => o.type === 'cleaning');
        const hasDecanting = obligations.some(o => o.title.includes('Decantar'));

        expect(hasCleaning).toBe(true);
        expect(hasDecanting).toBe(false); // 🧟 ZOMBIE KILLED
    });

});
