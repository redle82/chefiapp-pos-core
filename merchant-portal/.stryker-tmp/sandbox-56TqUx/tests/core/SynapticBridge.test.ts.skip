import { describe, it, expect } from 'vitest';
import { computeOrderState, ReplayEvent } from '../../src/core/queue/OrderReplayEngine';
import { Order } from '../../src/pages/TPV/context/OrderContext';

describe('OrderReplayEngine (The Synaptic Bridge)', () => {

    it('should replay CREATE -> UPDATE sequence correctly', () => {
        const base: Order[] = [];
        const events: ReplayEvent[] = [
            {
                type: 'ORDER_CREATE',
                status: 'queued',
                createdAt: 1000,
                payload: { id: 'ord_1', tableNumber: 5, items: [] }
            },
            {
                type: 'ORDER_UPDATE',
                status: 'queued',
                createdAt: 2000,
                payload: { orderId: 'ord_1', action: 'send' }
            }
        ];

        const result = computeOrderState(base, events);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('ord_1');
        expect(result[0].status).toBe('preparing'); // Mapped from 'send'
    });

    it('should handle Case Insensitivity in Actions (Risk #3)', () => {
        const base: Order[] = [];
        const events: ReplayEvent[] = [
            {
                type: 'ORDER_CREATE',
                status: 'queued',
                createdAt: 1000,
                payload: { id: 'ord_1', tableNumber: 5 }
            },
            {
                type: 'ORDER_UPDATE',
                status: 'queued',
                createdAt: 2000,
                payload: { orderId: 'ord_1', action: 'Send' } // Capitalized "Send"
            }
        ];

        const result = computeOrderState(base, events);
        expect(result[0].status).toBe('preparing'); // Should still map
    });

    it('should respect Time Travel (Sorting)', () => {
        // Events in WRONG order
        const base: Order[] = [];
        const events: ReplayEvent[] = [
            {
                type: 'ORDER_UPDATE',
                status: 'queued',
                createdAt: 2000,
                payload: { orderId: 'ord_1', action: 'send' }
            },
            {
                type: 'ORDER_CREATE',
                status: 'queued',
                createdAt: 1000,
                payload: { id: 'ord_1', tableNumber: 5 }
            }
        ];

        const result = computeOrderState(base, events);

        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('preparing');
        // If sort failed, update would run before create and simply fail silently, leaving status as 'new'
    });

    it('should be Idempotent (Ignore duplicates)', () => {
        const base: Order[] = [];
        const events: ReplayEvent[] = [
            {
                type: 'ORDER_CREATE',
                status: 'queued',
                createdAt: 1000,
                payload: { id: 'ord_1', tableNumber: 5 }
            },
            {
                type: 'ORDER_CREATE',
                status: 'queued',
                createdAt: 1000,
                payload: { id: 'ord_1', tableNumber: 5 } // Duplicate
            }
        ];

        const result = computeOrderState(base, events);
        expect(result).toHaveLength(1);
    });
});
