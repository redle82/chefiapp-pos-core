import { describe, it, expect } from 'vitest';
import { CoreExecutor, SystemState } from '../../src/core/events/CoreExecutor';
import { EventEnvelope } from '../../src/core/events/SystemEvents';

describe('CoreExecutor (The Reducer)', () => {

    const mkEvent = (type: any, payload: any, ts = 100): EventEnvelope => ({
        eventId: 'ev_' + Math.random(),
        type,
        payload,
        meta: { timestamp: ts, actorId: 'u1', version: 1 }
    });

    it('should Create Order', () => {
        const state: SystemState = { orders: [], inventory: {} };
        const event = mkEvent('ORDER_CREATED', { id: 'ord_1', totalCents: 1000 });

        const next = CoreExecutor.reduce(state, event);
        expect(next.orders).toHaveLength(1);
        expect(next.orders[0].id).toBe('ord_1');
        expect(next.orders[0].status).toBe('new');
    });

    it('should Update Status (Send -> Preparing)', () => {
        const state: SystemState = {
            orders: [{ id: 'ord_1', status: 'new' } as any],
            inventory: {}
        };
        const event = mkEvent('ORDER_UPDATED', { orderId: 'ord_1', action: 'send' });

        const next = CoreExecutor.reduce(state, event);
        expect(next.orders[0].status).toBe('preparing');
    });

    it('should Handle Payment Explicitly', () => {
        const state: SystemState = {
            orders: [{ id: 'ord_1', status: 'served' } as any],
            inventory: {}
        };
        const event = mkEvent('ORDER_PAID', { orderId: 'ord_1', amountCents: 1000 });

        const next = CoreExecutor.reduce(state, event);
        expect(next.orders[0].status).toBe('paid');
    });

    it('should Ignore Updates for Unknown Orders', () => {
        const state: SystemState = { orders: [], inventory: {} };
        const event = mkEvent('ORDER_UPDATED', { orderId: 'ghost_1', action: 'send' });

        const next = CoreExecutor.reduce(state, event);
        expect(next.orders).toHaveLength(0); // No crash, no ghost state
    });

    it('should be Idempotent (Create x2)', () => {
        const state: SystemState = { orders: [], inventory: {} };
        const event = mkEvent('ORDER_CREATED', { id: 'ord_1' });

        const s1 = CoreExecutor.reduce(state, event);
        const s2 = CoreExecutor.reduce(s1, event); // Replay

        expect(s2.orders).toHaveLength(1);
    });
});
