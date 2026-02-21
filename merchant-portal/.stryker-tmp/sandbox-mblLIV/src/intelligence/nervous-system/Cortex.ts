import type { InventoryItem } from '../../core/inventory/InventoryTypes';
import { MetabolicBrain } from './MetabolicBrain';
import type { InventorySignal } from './InventoryReflexEngine';

// 🧠 THE CORTEX
// "The Executive Function."
// Decides *when* to trigger hunger, overruling static par levels if necessary.

const DEFAULT_LEAD_TIME_HOURS = 48; // Standard delivery window
const SAFETY_FACTOR = 1.5; // Biological buffer

export const Cortex = {
    // 1. Evaluate Item Logic
    async evaluate(item: InventoryItem): Promise<InventorySignal | null> {
        // A) Intelligence Check
        const insight = await MetabolicBrain.analyzeItem(item.id, item.currentStock);

        // B) Physiology Check (Static)
        const staticPar = item.lifecycle.maxSafeStock || 10;

        // C) Dynamic Par Calculation (The Cortex)
        // If we burn 1 unit/hour, and lead time is 48h, we need 48 units + Safety.
        let dynamicPar = staticPar;

        if (insight.burnRatePerHour > 0) {
            const projectedNeed = insight.burnRatePerHour * DEFAULT_LEAD_TIME_HOURS * SAFETY_FACTOR;
            // The Cortex is cautious: it picks the HIGHER protection level.
            dynamicPar = Math.max(staticPar, Math.ceil(projectedNeed));
        }

        // Logic: Is it time to eat?
        if (item.currentStock < dynamicPar) {
            const severity = Math.min(100, Math.floor(((dynamicPar - item.currentStock) / dynamicPar) * 100));


            return {
                kind: 'HUNGER',
                itemId: item.id,
                itemName: item.name,
                organId: 'cortex_executive', // Virtual Organ
                organName: 'Cortex (Predictive)',
                currentLevel: item.currentStock,
                parLevel: dynamicPar, // INTELLIGENT PAR LEVEL
                unit: item.packaging.unit,
                severity,
                timestamp: Date.now(),
                context: insight.burnRatePerHour > 0 ? `Burn Rate: ${insight.burnRatePerHour}/h` : 'Static limit hit'
            };
        }

        return null;
    }
};
