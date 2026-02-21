/**
 * Hunger Engine — Generate Inventory Hunger Signals
 * 
 * Analyzes inventory levels and generates hunger signals
 * when stock falls below critical thresholds.
 * 
 * This is the "metabolic intelligence" that drives automatic
 * purchase recommendations.
 * 
 * @module HungerEngine
 * @since Phase 11.2 (ORDER→INVENTORY Integration)
 */
// @ts-nocheck


import type { InventoryItem } from './InventoryTypes';

export interface HungerSignal {
    kind: 'HUNGER';
    itemId: string;
    itemName: string;
    currentLevel: number;
    parLevel: number;
    criticalLevel: number;
    severity: number;  // 0-100 (100 = empty)
    urgency: 'low' | 'medium' | 'high' | 'critical';
    recommendedAction: string;
}

/**
 * Generates hunger signals for all provided inventory items
 */
export function generateHungerSignals(
    items: InventoryItem[]
): HungerSignal[] {
    const signals: HungerSignal[] = [];

    for (const item of items) {
        const { currentStock, lifecycle } = item;
        const { parLevel, criticalLevel, restockRule } = lifecycle;

        let isHungry = false;

        // 1. Threshold rule
        if (restockRule.type === 'threshold') {
            isHungry = currentStock < restockRule.min;
        }

        // 2. Calendar rule (always hungry on ritual day)
        if (restockRule.type === 'calendar') {
            const now = new Date();
            const isRitualDay = now.getDay() === restockRule.dayOfWeek;
            const isBeforeCutoff = now.getHours() < restockRule.cutOffHour;
            isHungry = isRitualDay && isBeforeCutoff;
        }

        // Also force hungry if below critical level regardless of rule
        if (currentStock < criticalLevel) {
            isHungry = true;
        }

        if (!isHungry) continue;

        // Calculate severity
        const deficit = Math.max(0, parLevel - currentStock); // Ensure no negative deficit
        const severity = parLevel > 0
            ? Math.min(100, Math.round((deficit / parLevel) * 100))
            : 100;

        // Determine urgency
        let urgency: HungerSignal['urgency'] = 'low';
        if (currentStock <= 0) urgency = 'critical';
        else if (currentStock < criticalLevel * 0.5) urgency = 'high';
        else if (currentStock < criticalLevel) urgency = 'medium';

        // Recommended action
        const qtyToOrder = Math.ceil(parLevel - currentStock);
        const unitLabel = item.packaging.volumePerUnit > 1 ? 'unidades' : 'un';
        const recommendedAction = `Purchase ${qtyToOrder} ${unitLabel}`;

        signals.push({
            kind: 'HUNGER',
            itemId: item.id,
            itemName: item.name,
            currentLevel: currentStock,
            parLevel,
            criticalLevel,
            severity,
            urgency,
            recommendedAction
        });
    }

    // Sort by severity (most urgent first)
    return signals.sort((a, b) => b.severity - a.severity);
}

/**
 * filters signals by minimum urgency
 */
export function filterSignalsByUrgency(
    signals: HungerSignal[],
    minUrgency: 'low' | 'medium' | 'high' | 'critical'
): HungerSignal[] {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    const minLevel = levels[minUrgency];

    return signals.filter(s => levels[s.urgency] >= minLevel);
}

/**
 * Groups signals by urgency for dashboard display
 */
export function groupSignalsByUrgency(signals: HungerSignal[]): Record<string, HungerSignal[]> {
    return {
        critical: signals.filter(s => s.urgency === 'critical'),
        high: signals.filter(s => s.urgency === 'high'),
        medium: signals.filter(s => s.urgency === 'medium'),
        low: signals.filter(s => s.urgency === 'low')
    };
}
