// @ts-nocheck
// import { LeakType } from '../leak-map/LeakMapTypes';
// import type { VoidReasonCategory } from './FinanceTypes';

// 🌉 THE BRIDGE: IMMUNOLOGICAL EXPORT CONTRACT
// "We send the truth. You calculate the tax."

export interface DailyImmunologicalReport {
    organizationId: string;
    date: string; // YYYY-MM-DD
    generatedAt: string; // ISO Timestamp

    // 1. NARRATIVE SUMMARY (The Sales)
    sales: {
        totalGrossCents: number;
        totalNetCents: number; // After discounts
        totalDiscountCents: number;
        transactionCount: number;
    };

    // 2. PHYSICAL REALITY (The Cash)
    cash: {
        systemExpectedCents: number; // Narrative
        physicallyCountedCents: number; // Truth
        divergenceCents: number; // Leak
        status: 'perfect' | 'leak' | 'surplus';
    };

    // 3. IMMUNE SYSTEM EVENTS (The Value)
    // Things that went WRONG or were PREVENTED
    immuneEvents: {
        // Purchases blocked by the system (Panic Buys)
        panicBuysBlockedCount: number;

        // Receiving divergences (Supplier Errors)
        supplierDivergences: {
            supplierName: string;
            type: 'quantity_mismatch' | 'price_inflation' | 'unsolicited';
            deltaValueCents: number;
        }[];

        // Cash Divergences (Staff/Process Errors)
        cashBreaks: {
            sessionId: string;
            amountCents: number;
        }[];
    };

    // 4. GOVERNANCE LOG (The Audit)
    // Why did money leave/disappear?
    voidsAndRefunds: {
        timestamp: string;
        amountCents: number;
        // reason: VoidReasonCategory;
        reasonLabel: string;
        actorId: string;
        authorizedBy?: string; // Manager
    }[];

    // 5. COMMERCIAL VALUE METRIC
    // To remind the owner/accountant why they pay for ChefIApp
    valueCreated: {
        capitalProtectedCents: number; // Money saved by blocks + detected leaks
        efficiencyScore: number; // 0-100 (Operational Health)
    };
}
