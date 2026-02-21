// @ts-nocheck
// import type { InventoryItem } from './InventoryTypes';

// ------------------------------------------------------------------
// 🛒 PURCHASE RITUAL SCHEMAS
// ------------------------------------------------------------------
// "O Inventário não é democrático. Tem dono e testemunha."
// ------------------------------------------------------------------

export type PurchaseReason =
    | 'metabolic_hunger'   // System said: "We need this" (Low stock)
    | 'calendar_ritual'    // System said: "It's Wednesday" (Drinks)
    | 'event_prep'         // "We have a party tomorrow" (Valid manual)
    | 'impulse_panic';     // "I'm scared it will run out" (Invalid/Flagged)

export interface PurchaseItemDraft {
    itemId: string;
    quantity: number;
    unit: string;

    // The "Why"
    reason: PurchaseReason;
    signalId?: string; // If linked to a System Signal

    // Financials
    estimatedCostEur: number; // Integer cents (kept for compat, or moving to cents) -> keeping for now or mapping

    // 🧠 Meta-Reasoning (Transparent Logic)
    meta?: {
        overriddenBy?: 'maxSafeStock' | 'calendar_block'; // Why did the system change my reason?
        originalReason?: string;
    };
}

export interface PurchaseOrder {
    id: string; // 'po-2025-10-20-01'
    status: 'draft' | 'pending_approval' | 'ordered' | 'received';

    // Governance
    createdById: string; // The "Owner" (e.g. Kitchen Chef)
    createdAt: number;

    // The "Witness" Protocol (for high value or panic buys)
    requiresWitness: boolean;
    witnessLevel?: 'manager' | 'owner'; // Ajuste 3: Hierarquia de Aprovação
    witnessId?: string; // The Manager/Secondary responsible
    witnessedAt?: number;

    items: PurchaseItemDraft[];

    // Financial Impact
    totalEstimatedEur: number;
    panicWastePotentialEur: number; // Value of items marked 'impulse_panic'
}

// 🛡️ GOVERNANCE RULES
export const PURCHASE_GOVERNANCE = {
    // If an order has 'impulse_panic' items, it ALWAYS requires a witness.
    REQUIRE_WITNESS_IF_PANIC: true,

    // Financial Thresholds (Cents)
    WITNESS_THRESHOLD_MANAGER: 50000,   // > 500 EUR -> Manager
    WITNESS_THRESHOLD_OWNER: 200000,    // > 2000 EUR -> Owner (Ajuste 3)
};

export type ManualAddition = {
    item: import('./InventoryTypes').InventoryItem;
    qty: number;
    reason?: 'event_prep' | 'impulse_panic'; // Ajuste 1: Intenção explícita
};
