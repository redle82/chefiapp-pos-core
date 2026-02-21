import { emitPulseEvent } from '../../../core/adapter/empire-pulse';
import { type GMEventType, type GMSeverity } from '../types';

/**
 * Staff Vanish Detector
 * 
 * "The Ghosting Protocol."
 * Detects when staff fail to respond to explicit customer signals.
 * 
 * Risks:
 * 1. Unanswered Call: Customer pressed "Call Waiter" and no one came > 5 min.
 */

export interface TrackedCall {
    id: string;
    tableId: string;
    createdAt: number;
    status: 'open' | 'acknowledged' | 'resolved';
    assignedStaffId?: string;
}

export class StaffVanishDetector {
    // 5 minutes without ACK is dangerous
    private static IGNORE_THRESHOLD_MS = 5 * 60 * 1000;

    public static check(call: TrackedCall): { type: GMEventType, severity: GMSeverity, payload: any } | null {
        if (call.status !== 'open') return null;

        const now = Date.now();
        const duration = now - call.createdAt;

        if (duration > this.IGNORE_THRESHOLD_MS) {

            // 📡 GENESIS CONNECTION
            // "The ChefApp feels, the Empire sees."
            emitPulseEvent({
                domain: "operations",
                signal: "STAFF_NO_RESPONSE",
                severity: "error",
                restaurant_id: "sofia-gastrobar", // Context-aware in V2
                table_id: call.tableId,
                duration: duration,
                meta: { assigned: call.assignedStaffId || 'pool' }
            });

            return {
                type: 'STAFF_NO_RESPONSE',
                severity: 'error',
                payload: {
                    callId: call.id,
                    tableId: call.tableId,
                    minutesUnanswered: Math.floor(duration / 60000),
                    assignedStaffId: call.assignedStaffId || 'pool'
                }
            };
        }

        return null;
    }
}
