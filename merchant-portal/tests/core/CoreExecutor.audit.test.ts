import { describe, it, expect, vi } from 'vitest';
import { CoreExecutor, SystemState } from '../../src/core/events/CoreExecutor';
import { EventEnvelope } from '../../src/core/events/SystemEvents';

describe('CoreExecutor Audit Enforcement', () => {

    const mkEvent = (type: any, payload: any, version?: number): EventEnvelope => ({
        eventId: 'ev_' + Math.random(),
        type,
        payload,
        stream_version: version, // 🔒 Version Injection
        meta: { timestamp: 1000, actorId: 'auditor' }
    });

    it('🔒 MUST BE Deeply Immutable (The "False Atomic" Fix)', () => {
        const initialState: SystemState = {
            orders: [
                { id: 'ord_1', status: 'new', items: [], total: 100 } as any
            ],
            inventory: {}
        };

        // Snapshot of original reference
        const originalOrderRef = initialState.orders[0];

        // Apply an update event
        const event = mkEvent('ORDER_UPDATED', { orderId: 'ord_1', action: 'send' });
        const nextState = CoreExecutor.reduce(initialState, event);

        // 1. Verify Outcome
        expect(nextState.orders[0].status).toBe('preparing');

        // 2. 🛡️ VERIFY ISOLATION (The Fix)
        // With structuredClone, nextState.orders[0] should be a DIFFERENT object than originalOrderRef
        expect(nextState.orders[0]).not.toBe(originalOrderRef);

        // 3. Verify Original State is Pristine
        expect(originalOrderRef.status).toBe('new');
        // ^ If this fails, we have "Mutation by Reference" (The Audit Finding)
    });

    it('🔒 SHOULD DETECT Optimistic Concurrency Conflict', () => {
        const state: SystemState = { orders: [], inventory: {} };
        const consoleSpy = vi.spyOn(console, 'warn');

        // Event with INVALID version (negative for now as per implementation placeholder)
        const event = mkEvent('ORDER_CREATED', { id: 'ord_bad' }, -5);

        CoreExecutor.reduce(state, event);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Stream Version -5 observed')
        );

        consoleSpy.mockRestore();
    });
});
