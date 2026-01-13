import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostgresEventStore } from '../../../core-engine/persistence/PostgresEventStore';
import { PostgresLegalSealStore } from '../../../legal-boundary/persistence/PostgresLegalSealStore';
import { CoreEvent } from '../../../core-engine/event-log/types';

// Mock DB Client
const mockQuery = vi.fn();
const mockPool = {
    query: mockQuery,
} as any;

describe('Hardening P0: Persistence Logic', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset crypto.randomUUID mock if needed (Node 19+ has it native)
    });

    describe('P0-A: PostgresEventStore Concurrency', () => {
        const store = new PostgresEventStore({ pool: mockPool });
        const evt: CoreEvent = {
            event_id: 'ev_1',
            stream_id: 'order:123',
            stream_version: 5,
            type: 'OrderCreated',
            payload: {},
            occurred_at: new Date()
        } as any;

        it('SHOULD allow append if version matches expectation', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });
            await expect(store.append(evt, 4)).resolves.not.toThrow();
        });

        it('SHOULD THROW if version mismatch (Client-side Check)', async () => {
            // Expecting 10, but event is 5 -> Mismatch
            await expect(store.append(evt, 10))
                .rejects.toThrow('Concurrency Exception: Expected version 10, but trying to append 5');

            expect(mockQuery).not.toHaveBeenCalled();
        });

        it('SHOULD THROW if DB returns conflict (ON CONFLICT DO NOTHING)', async () => {
            mockQuery.mockResolvedValueOnce({ rowCount: 0 }); // Simulate conflict
            await expect(store.append(evt, 4))
                .rejects.toThrow('Concurrency Exception: Stream order:123 version 5 already exists (DB Conflict)');
        });
    });

    describe('P0-B: PostgresLegalSealStore Strictness', () => {
        const store = new PostgresLegalSealStore({ pool: mockPool });

        it('SHOULD THROW if seal_event_id is missing/TODO', async () => {
            const seal = {
                entity_type: 'ORDER',
                entity_id: '123',
                seal_event_id: 'TODO_LINK_TO_EVENT_ID' // Invalid
            } as any;

            await expect(store.createSeal(seal))
                .rejects.toThrow('P0 Violation');
        });

        it('SHOULD Auto-Generate UUID if missing', async () => {
            const seal = {
                entity_type: 'ORDER',
                entity_id: '123',
                seal_event_id: 'valid-uuid-123',
                // seal_id missing
            } as any;

            mockQuery.mockResolvedValueOnce({ rowCount: 1 });
            await store.createSeal(seal);

            // Verify query args
            const args = mockQuery.mock.calls[0][1]; // values array
            const generatedId = args[0]; // seal_id is first param
            expect(generatedId).toBeDefined();
            expect(generatedId).not.toBe('TODO_UUID');
            expect(generatedId.length).toBeGreaterThan(10); // Simple UUID check
        });
    });
});
