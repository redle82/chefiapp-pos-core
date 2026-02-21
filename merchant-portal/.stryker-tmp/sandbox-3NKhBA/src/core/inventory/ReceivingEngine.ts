// @ts-nocheck
import type { IngestionSession, ReceivedItem, TruthUpdate } from './ReceivingTypes';
import type { PurchaseOrder } from './PurchaseTypes';
import type { InventoryItem } from './InventoryTypes';

// ------------------------------------------------------------------
// 🧬 RECEIVING ENGINE (THE IMMUNE GATEWAY)
// ------------------------------------------------------------------
// "A validação da realidade antes da digestão."
// ------------------------------------------------------------------

export const reconcileIngestion = (
    session: IngestionSession,
    po: PurchaseOrder | undefined,
    _inventory: InventoryItem[]
): IngestionSession => {

    const reconciledItems: ReceivedItem[] = session.items.map(item => {
        // const invItem = inventory.find(i => i.id === item.itemId);
        const poItem = po?.items.find((poi: any) => poi.itemId === item.itemId);

        const newItem = { ...item };

        // 1. CHECK QUANTITY DIVERGENCE
        if (poItem) {
            if (item.quantityReceived !== poItem.quantity) {
                newItem.divergence = {
                    type: 'quantity_mismatch',
                    severity: Math.abs(item.quantityReceived - poItem.quantity) > 5 ? 'high' : 'low',
                    deltaValue: item.quantityReceived - poItem.quantity
                };
            }
        } else if (po) {
            // Item not in PO (Unsolicited)
            newItem.divergence = {
                type: 'unsolicited_item',
                severity: 'medium',
                deltaValue: item.totalPriceCents
            };
        }

        // 2. CHECK PRICE DIVERGENCE (Simplified mock logic)
        // If we had historical cost, we would compare here.
        // For now, assuming "expected" was what was in PO estimatedCost
        if (poItem) {
            const expectedUnitCost = poItem.estimatedCostEur / poItem.quantity; // Assuming consistency
            const diff = Math.abs(item.unitPriceCents - expectedUnitCost);
            if (diff > (expectedUnitCost * 0.1)) { // > 10% change
                newItem.divergence = {
                    type: 'price_change',
                    severity: 'high',
                    deltaValue: item.unitPriceCents - expectedUnitCost
                };
            }
        }

        return newItem;
    });

    return {
        ...session,
        items: reconciledItems,
        status: 'reconciling'
    };
};

export const commitReality = (session: IngestionSession, inventory: InventoryItem[]): TruthUpdate[] => {
    if (session.status !== 'reconciling') throw new Error("Session not ready to commit");

    return session.items.map(recItem => {
        const invItem = inventory.find(i => i.id === recItem.itemId);
        if (!invItem) return null;

        // Simple addition logic (Stock + Received)
        // In real life, might be "Stock set to X" if blind count, but receiving usually ADDS.
        const newStock = invItem.currentStock + recItem.quantityReceived;

        return {
            itemId: invItem.id,
            newStockLevel: newStock,
            newAverageCostCents: recItem.unitPriceCents, // Simplified
            lastRestockedAt: Date.now()
        };
    }).filter(Boolean) as TruthUpdate[];
};
