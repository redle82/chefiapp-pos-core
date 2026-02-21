// @ts-nocheck
import { emitPulseEvent } from '../../../core/adapter/empire-pulse';
import { type GMEventType, type GMSeverity } from '../types';

/**
 * Forgotten Item Detector
 * 
 * "The Lost Alioli."
 * Detects items that are stalled in a state for too long.
 * 
 * Risks:
 * 1. Draft Stagnation: Item added to cart but not sent (Waiter forgot to fire).
 * 2. Kitchen Limbo: Item sent but not marked ready (Kitchen lost the ticket).
 */

export interface TrackedItem {
    id: string;
    orderId: string;
    name: string;
    status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
    updatedAt: number; // timestamp of last status change
}

export class ForgottenItemDetector {
    // 10 mins in cart without sending is suspicious
    private static DRAFT_THRESHOLD_MS = 10 * 60 * 1000;

    // 25 mins in kitchen without being ready is a risk (for standard items)
    private static KITCHEN_THRESHOLD_MS = 25 * 60 * 1000;

    public static check(item: TrackedItem): { type: GMEventType, severity: GMSeverity, payload: any } | null {
        const now = Date.now();
        const duration = now - item.updatedAt;

        // Case A: Forgot to Send (Draft Stagnation)
        if (item.status === 'new' && duration > this.DRAFT_THRESHOLD_MS) {
            emitPulseEvent({
                domain: "operations",
                signal: "ITEM_FORGOTTEN_DRAFT",
                severity: "warning",
                restaurant_id: "sofia-gastrobar",
                table_id: "unknown", // Order context needed for full resolution
                duration: duration,
                meta: { orderId: item.orderId, item: item.name }
            });

            return {
                type: 'ITEM_FORGOTTEN_RISK',
                severity: 'warning',
                payload: {
                    orderId: item.orderId,
                    itemName: item.name,
                    timeSinceAdded: Math.floor(duration / 60000),
                    riskType: 'draft_stagnation'
                }
            };
        }

        // Case B: Forgot to Cook (Kitchen Limbo)
        if (item.status === 'preparing' && duration > this.KITCHEN_THRESHOLD_MS) {
            emitPulseEvent({
                domain: "operations",
                signal: "ITEM_FORGOTTEN_KITCHEN",
                severity: "error",
                restaurant_id: "sofia-gastrobar",
                table_id: "unknown",
                duration: duration,
                meta: { orderId: item.orderId, item: item.name }
            });

            return {
                type: 'ITEM_FORGOTTEN_RISK',
                severity: 'error',
                payload: {
                    orderId: item.orderId,
                    itemName: item.name,
                    timeSinceAdded: Math.floor(duration / 60000),
                    riskType: 'kitchen_limbo'
                }
            };
        }

        return null;
    }
}
