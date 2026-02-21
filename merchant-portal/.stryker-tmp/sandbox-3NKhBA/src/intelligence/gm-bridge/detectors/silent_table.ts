// @ts-nocheck
import { emitPulseEvent } from '../../../core/adapter/empire-pulse';
import { type GMEventType, type GMSeverity } from '../types';

/**
 * Silent Table Detector
 * 
 * "The Silence is Dangerous."
 * Detects tables that are occupied but have had no interaction
 * for a period that suggests customer neglect.
 */

export interface TrackedTable {
    id: string;
    status: 'open' | 'closed' | 'available';
    lastInteractionAt?: number; // timestamp
    openedAt?: number; // timestamp
    staffId?: string;
    orderTotal?: number;
}

export class SilentTableDetector {
    // Config: 12 minutes without interaction is a risk
    private static SILENCE_THRESHOLD_MS = 12 * 60 * 1000;

    // Config: 25 minutes is critical
    private static CRITICAL_THRESHOLD_MS = 25 * 60 * 1000;

    public static check(table: TrackedTable): { type: GMEventType, severity: GMSeverity, payload: any } | null {
        if (table.status !== 'open') return null;
        if (!table.lastInteractionAt) return null;

        const now = Date.now();
        const silenceDuration = now - table.lastInteractionAt;

        if (silenceDuration > this.SILENCE_THRESHOLD_MS) {
            const isCritical = silenceDuration > this.CRITICAL_THRESHOLD_MS;

            // 📡 GENESIS CONNECTION
            emitPulseEvent({
                domain: "operations",
                signal: "TABLE_SILENCE_RISK",
                severity: isCritical ? "error" : "warning",
                restaurant_id: "sofia-gastrobar",
                table_id: table.id,
                duration: silenceDuration,
                meta: {
                    minutes: Math.floor(silenceDuration / 60000),
                    orderTotal: table.orderTotal || 0,
                    staff: table.staffId || 'unassigned'
                }
            });

            return {
                type: 'TABLE_SILENCE_RISK',
                severity: isCritical ? 'error' : 'warning',
                payload: {
                    tableId: table.id,
                    minutesWithoutInteraction: Math.floor(silenceDuration / 60000),
                    staffAssigned: table.staffId || 'unassigned',
                    orderTotal: table.orderTotal || 0
                }
            };
        }

        return null;
    }
}
