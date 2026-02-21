import { describe, it, expect } from 'vitest';
import { OnboardingEngine } from '../onboarding-core/engine';
import { OnboardingSession } from '../onboarding-core/contracts';

/**
 * 🛡️ CONTRACT GOVERNANCE SUITE
 * 
 * "The Onboarding Core does not 'speak' to other cores.
 * It produces a Contract. Other cores consume this Contract."
 * 
 * These tests ensure the Contract is generated correctly and immutably.
 */

// Mock LocalStorage for Node Environment
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    length: 0,
    key: () => null,
} as any;

describe('Initial Operational Contract (v1)', () => {

    it('should generate a valid contract for a Restaurant', async () => {
        // 1. SETUP: Mimic the "Ritual" (Scenes 1-5)
        const engine = new OnboardingEngine();

        // Scene 1: Hook
        engine.submitScene1({ readyToStart: true });

        // Scene 2: Identity
        engine.submitScene2({
            name: "O Tasco do Zé",
            slug: "o-tasco-do-ze",
            businessType: "restaurant",
            brandGroup: "none"
        });

        // Scene 3: Skeleton
        engine.submitScene3({ categories: ['starters', 'mains', 'desserts'] });

        // Scene 4: Beverages (Mock)
        engine.submitScene4({ items: [{ id: 'coca', name: 'Coca Cola' }] });

        // Scene 5: Cuisine (Mock)
        engine.submitScene5({ items: [{ id: 'bitoque', name: 'Bitoque' }] });

        // User implicitly sets staff & tasks via flexible bucket (SceneStaffDistribution)
        engine.updateSession((s) => {
            s.data.staff = {
                totalCount: 5,
                kitchen: 2,
                floor: 2,
                bar: 1
            };
            s.data.tasks = { enabled: true };
            s.data.menu = {
                hasDrinks: true,
                hasFood: true,
                drinkTemplates: ['soft_drinks']
            };
        });

        // 2. EXECUTE: The "Signature" (Scene 6)
        const output = await engine.submitScene6({ acceptedTerms: true });

        // 3. GOVERNANCE: Validate the Contract
        const contract = output.contract;

        // Rule: Contract must exist
        expect(contract).toBeDefined();

        // Rule: Immutable Meta
        expect(contract.contractVersion).toBe('v1');
        expect(contract.country).toBe('PT'); // Default
        expect(contract.currency).toBe('EUR');

        // Rule: Identity
        expect(contract.name).toBe("O Tasco do Zé");
        expect(contract.businessType).toBe("restaurant");

        // Rule: Menu Profile (Digital Sommelier)
        expect(contract.menuProfile).toEqual(expect.objectContaining({
            hasDrinks: true,
            // hasFood: true, // REMOVED: Not in strict schema anymore (replaced by hasKitchen)
            hasAlcohol: true, // Inferred from 'restaurant'
            hasKitchen: true, // Inferred vs Computed
        }));

        // Rule: Staff Profile (The Manager)
        expect(contract.staffProfile.roles).toContain('KITCHEN');
        expect(contract.staffProfile.roles).toContain('FLOOR');
        expect(contract.staffProfile.roles).toContain('BAR');
        expect(contract.staffProfile.autopilotEnabled).toBe(true);
        expect(contract.staffProfile.distribution).toEqual({
            kitchen: 2, floor: 2, bar: 1
        });

        // Rule: Compliance (The Lawyer)
        expect(contract.complianceContext).toEqual(expect.objectContaining({
            country: 'PT',
            fiscalRequired: true
        }));

        console.log("📜 Contract Signed & Validated:", JSON.stringify(contract, null, 2));
    });

    it('should generate a valid contract for a Small Bar', async () => {
        const engine = new OnboardingEngine();

        // Shortcut: Direct State Injection (Whitebox Testing)
        engine.updateSession(s => {
            s.step = 5;
            s.country = 'ES';
            s.businessType = 'bar';
            s.data.identity = { name: 'Chiringuito', slug: 'chiringuito' };
            s.data.staff = { totalCount: 1, bar: 1, floor: 0, kitchen: 0 };
            s.data.menu = { hasDrinks: true, hasFood: false };
        });

        // Sign
        const output = await engine.submitScene6({ acceptedTerms: true });
        const contract = output.contract;

        // Validate
        expect(contract.country).toBe('ES');
        expect(contract.businessType).toBe('bar');

        // Verifactu Check (Spain Specific)
        expect(contract.complianceContext.verifactuRequired).toBe(true);

        // Menu Check
        expect(contract.menuProfile.hasKitchen).toBe(false);
        expect(contract.menuProfile.hasAlcohol).toBe(true);
    });

});
