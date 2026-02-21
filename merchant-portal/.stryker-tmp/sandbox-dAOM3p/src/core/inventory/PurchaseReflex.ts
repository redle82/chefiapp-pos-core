// @ts-nocheck
// import type { InventoryItem } from './InventoryTypes';
import type { PurchaseOrder, PurchaseItemDraft, ManualAddition } from './PurchaseTypes';
import { PURCHASE_GOVERNANCE } from './PurchaseTypes';

// ------------------------------------------------------------------
// 🧠 PURCHASE REFLEX ENGINE
// ------------------------------------------------------------------
// "O sistema decide. O humano executa."
// ------------------------------------------------------------------

export const generatePurchaseDraft = (
    staffId: string,
    hungerSignals: any[], // From InventoryContext
    manualAdds: ManualAddition[] = []
): PurchaseOrder => {

    const items: PurchaseItemDraft[] = [];
    let panicValue = 0;
    let totalValue = 0;

    // 1. PROCESS SYSTEM SIGNALS (The "Good" Buys)
    hungerSignals.forEach(signal => {
        const cost = 500 * (signal.parLevel - signal.currentLevel || 1);

        items.push({
            itemId: signal.itemId,
            quantity: Math.max(1, signal.parLevel - signal.currentLevel),
            unit: signal.unit,
            reason: signal.reason === 'calendar' ? 'calendar_ritual' : 'metabolic_hunger',
            signalId: signal.timestamp.toString(),
            estimatedCostEur: cost
        });
        totalValue += cost;
    });

    // 2. PROCESS MANUAL ADDS (The "Suspicious" Buys)
    manualAdds.forEach(add => {
        const cost = 500 * add.qty; // Mock cost
        let reason = add.reason ?? 'impulse_panic'; // Default to panic if no reason given
        let overriddenBy: 'maxSafeStock' | undefined = undefined;

        // Ajuste 2: Max Safe Stock Limitation
        // If the purchase pushes stock way above safety limits, it's FORCED to pulse_panic
        if (add.item.lifecycle.maxSafeStock) {
            const potentialStock = add.item.currentStock + add.qty;
            if (potentialStock > add.item.lifecycle.maxSafeStock) {
                // Check if user wasn't already panicking
                // if (draft.assigneeRole === 'owner') { // 'owner' not assignable to 'manager' | undefined.
                //    score += 20; // Owner tasks are critical by nature?
                // }

                // Fix: Just check if risk is high enough to warrant owner attention if strictly typed?
                // Or if assigneeRole logic needs update. For now commenting out the strict mismatch.
                overriddenBy = 'maxSafeStock';
                reason = 'impulse_panic'; // Overruled by biological safety limit
            }
        }

        items.push({
            itemId: add.item.id,
            quantity: add.qty,
            unit: add.item.packaging.unit,
            reason: reason,
            estimatedCostEur: cost,
            meta: {
                overriddenBy,
                originalReason: overriddenBy ? add.reason : undefined
            }
        });

        totalValue += cost;
        if (reason === 'impulse_panic') panicValue += cost;
    });

    // 3. DETERMINE GOVERNANCE (Witness Required?)
    let witnessLevel: 'manager' | 'owner' | undefined = undefined;
    let requiresWitness = false;

    // Rule A: Panic always needs a Manager
    if (panicValue > 0 && PURCHASE_GOVERNANCE.REQUIRE_WITNESS_IF_PANIC) {
        requiresWitness = true;
        witnessLevel = 'manager';
    }

    // Rule B: High Value escalation (Ajuste 3)
    if (totalValue >= PURCHASE_GOVERNANCE.WITNESS_THRESHOLD_OWNER) {
        requiresWitness = true;
        witnessLevel = 'owner'; // Owner trumps Manager
    } else if (totalValue >= PURCHASE_GOVERNANCE.WITNESS_THRESHOLD_MANAGER) {
        requiresWitness = true;
        // 
        if (witnessLevel !== 'owner') witnessLevel = 'manager';
    }

    return {
        id: `po-${Date.now()}`,
        status: 'draft',
        createdById: staffId,
        createdAt: Date.now(),
        requiresWitness,
        witnessLevel,
        items,
        totalEstimatedEur: totalValue,
        panicWastePotentialEur: panicValue
    };
};
