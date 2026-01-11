/**
 * Gate 0-1: Core Invariants & State Machine World Tests
 *
 * Tests:
 * - State machine determinism
 * - Replay produces identical results
 * - Financial invariants (non-negative amounts)
 * - Stream version sequencing
 */

import {
    loadWorldConfig,
    loadPilotConfig,
    WorldFactory,
    SeededRandom,
    Gate01Asserts,
    AuditAsserter,
    MetricsCollector,
    createScenario,
    ScenarioRunner,
    ScenarioContext,
} from '../harness';

// State machine valid transitions
const ORDER_TRANSITIONS = new Map<string, Set<string>>([
    ['OPEN:FINALIZE', new Set(['LOCKED'])],
    ['OPEN:CANCEL', new Set(['CANCELED'])],
    ['LOCKED:PAY', new Set(['PAID'])],
    ['LOCKED:CANCEL', new Set(['CANCELED'])],
    ['PAID:CLOSE', new Set(['CLOSED'])],
]);

const PAYMENT_TRANSITIONS = new Map<string, Set<string>>([
    ['PENDING:CONFIRM', new Set(['CONFIRMED'])],
    ['PENDING:FAIL', new Set(['FAILED'])],
    ['PENDING:CANCEL', new Set(['CANCELED'])],
    ['FAILED:RETRY', new Set(['PENDING'])],
]);

const SESSION_TRANSITIONS = new Map<string, Set<string>>([
    ['INACTIVE:START', new Set(['ACTIVE'])],
    ['ACTIVE:CLOSE', new Set(['CLOSED'])],
]);

describe('Gate 0-1: Core Invariants & State Machine (World Simulation)', () => {
    let config = loadPilotConfig(); // Start with pilot config for faster tests
    let factory: WorldFactory;
    let asserter: AuditAsserter;
    let metrics: MetricsCollector;

    beforeAll(() => {
        // Use full config if WORLD_STRESS is set
        if (process.env.WORLD_STRESS === 'true') {
            config = loadWorldConfig();
        }
    });

    beforeEach(() => {
        factory = new WorldFactory(config);
        asserter = new AuditAsserter();
        metrics = new MetricsCollector();
        metrics.start();
    });

    afterEach(() => {
        metrics.end();
    });

    describe('Deterministic Replay', () => {
        it('should produce identical state from same seed', () => {
            // Generate world twice with same seed
            const factory1 = new WorldFactory(config);
            const factory2 = new WorldFactory(config);

            const world1 = factory1.generate();
            const world2 = factory2.generate();

            // Events should be identical
            expect(world1.allEvents.length).toBe(world2.allEvents.length);

            for (let i = 0; i < world1.allEvents.length; i++) {
                expect(world1.allEvents[i].event_id).toBe(world2.allEvents[i].event_id);
                expect(world1.allEvents[i].type).toBe(world2.allEvents[i].type);
                expect(world1.allEvents[i].stream_id).toBe(world2.allEvents[i].stream_id);
            }

            // Stats should be identical
            expect(world1.stats).toEqual(world2.stats);

            // Record metrics
            metrics.recordEvents(world1.allEvents.length);
        });

        it('should replay events to same state', () => {
            const world = factory.generate();

            // Simulate state reconstruction from events
            const reconstructedState = replayEvents(world.allEvents);

            // Generate expected state from factory
            const expectedState = buildExpectedState(world);

            const result = Gate01Asserts.assertReplayDeterminism(
                world.allEvents,
                reconstructedState,
                expectedState
            );

            asserter.add(result);
            expect(result.passed).toBe(true);

            metrics.recordEvents(world.allEvents.length);
        });

        it('should produce consistent results across multiple replays', () => {
            const world = factory.generate();
            const replays: any[] = [];

            // Replay 5 times
            for (let i = 0; i < 5; i++) {
                replays.push(replayEvents(world.allEvents));
            }

            // All replays should be identical
            for (let i = 1; i < replays.length; i++) {
                const result = Gate01Asserts.assertReplayDeterminism(
                    world.allEvents,
                    replays[0],
                    replays[i]
                );
                asserter.add(result);
                expect(result.passed).toBe(true);
            }
        });
    });

    describe('State Machine Validity', () => {
        it('should only allow valid ORDER transitions', () => {
            const world = factory.generate();

            for (const session of world.sessions) {
                for (const order of session.orders) {
                    // Trace state through events
                    let currentState = 'OPEN';

                    for (const event of order.events) {
                        if (event.stream_id.startsWith('ORDER:')) {
                            const transition = mapEventToTransition(event.type);
                            if (transition) {
                                const result = Gate01Asserts.assertValidTransition(
                                    'ORDER',
                                    currentState,
                                    getNextState(event.type, currentState),
                                    transition,
                                    ORDER_TRANSITIONS
                                );
                                asserter.add(result);
                                expect(result.passed).toBe(true);

                                currentState = getNextState(event.type, currentState);
                            }
                        }
                    }
                }
            }
        });

        it('should only allow valid PAYMENT transitions', () => {
            const world = factory.generate();

            for (const session of world.sessions) {
                for (const order of session.orders) {
                    for (const payment of order.payments) {
                        // Payment should go PENDING -> CONFIRMED
                        let currentState = 'PENDING';

                        for (const event of order.events) {
                            if (event.stream_id === `PAYMENT:${payment.id}`) {
                                if (event.type === 'PAYMENT_CONFIRMED') {
                                    const result = Gate01Asserts.assertValidTransition(
                                        'PAYMENT',
                                        currentState,
                                        'CONFIRMED',
                                        'CONFIRM',
                                        PAYMENT_TRANSITIONS
                                    );
                                    asserter.add(result);
                                    expect(result.passed).toBe(true);
                                    currentState = 'CONFIRMED';
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    describe('Financial Invariants', () => {
        it('should never have negative amounts', () => {
            const world = factory.generate();

            // Collect all financial amounts
            const amounts: { id: string; amount_cents: number }[] = [];

            for (const session of world.sessions) {
                for (const order of session.orders) {
                    amounts.push({
                        id: order.order.id,
                        amount_cents: order.order.total_cents || 0
                    });

                    for (const item of order.items) {
                        amounts.push({
                            id: item.id,
                            amount_cents: item.price_snapshot_cents
                        });
                        amounts.push({
                            id: `${item.id}_subtotal`,
                            amount_cents: item.subtotal_cents
                        });
                    }

                    for (const payment of order.payments) {
                        amounts.push({
                            id: payment.id,
                            amount_cents: payment.amount_cents
                        });
                    }
                }
            }

            const result = Gate01Asserts.assertNonNegativeAmounts(amounts);
            asserter.add(result);
            expect(result.passed).toBe(true);
        });

        it('should have order total equal to sum of items', () => {
            const world = factory.generate();

            for (const session of world.sessions) {
                for (const order of session.orders) {
                    const itemsTotal = order.items.reduce((sum, item) => sum + item.subtotal_cents, 0);
                    expect(order.order.total_cents).toBe(itemsTotal);
                }
            }
        });

        it('should have payment amount equal to order total', () => {
            const world = factory.generate();

            for (const session of world.sessions) {
                for (const order of session.orders) {
                    const totalPayments = order.payments.reduce((sum, p) => sum + p.amount_cents, 0);
                    expect(totalPayments).toBe(order.order.total_cents);
                }
            }
        });
    });

    describe('Stream Version Sequencing', () => {
        it('should have strictly sequential stream versions', () => {
            const world = factory.generate();

            const result = Gate01Asserts.assertStreamVersionSequencing(world.allEvents);
            asserter.add(result);
            expect(result.passed).toBe(true);
        });

        it('should start each stream at version 0', () => {
            const world = factory.generate();

            const byStream = new Map<string, number[]>();
            for (const event of world.allEvents) {
                const versions = byStream.get(event.stream_id) || [];
                versions.push(event.stream_version);
                byStream.set(event.stream_id, versions);
            }

            for (const [streamId, versions] of byStream) {
                const sorted = versions.sort((a, b) => a - b);
                expect(sorted[0]).toBe(0);  // Streams start at version 0
            }
        });
    });

    describe('World-Scale Stress Test', () => {
        it('should handle configured load without invariant violations', async () => {
            const world = factory.generate();

            // Log stats
            console.log(`
            World Generated:
            - Restaurants: ${world.stats.totalRestaurants}
            - Tables: ${world.stats.totalTables}
            - Orders: ${world.stats.totalOrders}
            - Events: ${world.stats.totalEvents}
            - Total Value: €${(world.stats.totalValueCents / 100).toFixed(2)}
            `);

            // Run all invariant checks
            const amounts: { id: string; amount_cents: number }[] = [];
            for (const session of world.sessions) {
                for (const order of session.orders) {
                    for (const item of order.items) {
                        amounts.push({ id: item.id, amount_cents: item.price_snapshot_cents });
                    }
                }
            }

            asserter.add(Gate01Asserts.assertNonNegativeAmounts(amounts));
            asserter.add(Gate01Asserts.assertStreamVersionSequencing(world.allEvents));

            const summary = asserter.getSummary();
            console.log(`
            Assertions Summary:
            - Total: ${summary.total}
            - Passed: ${summary.passed}
            - Failed: ${summary.failed}
            `);

            expect(summary.failed).toBe(0);
            metrics.recordEvents(world.stats.totalEvents);
        }, 60000); // 60 second timeout for stress
    });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function replayEvents(events: any[]): any {
    const state: Record<string, any> = {
        orders: new Map(),
        payments: new Map(),
        sessions: new Map(),
    };

    for (const event of events) {
        switch (event.type) {
            case 'SESSION_STARTED':
                state.sessions.set(event.payload.id, { state: 'ACTIVE' });
                break;
            case 'SESSION_CLOSED':
                const session = state.sessions.get(event.payload.id);
                if (session) session.state = 'CLOSED';
                break;
            case 'ORDER_CREATED':
                state.orders.set(event.payload.id, {
                    state: 'OPEN',
                    total_cents: 0,
                    items: []
                });
                break;
            case 'ORDER_ITEM_ADDED':
                const order = state.orders.get(event.payload.order_id);
                if (order) {
                    order.items.push(event.payload.item);
                    order.total_cents += event.payload.item.price_snapshot_cents * event.payload.item.quantity;
                }
                break;
            case 'ORDER_LOCKED':
                const lockedOrder = state.orders.get(event.payload.order_id);
                if (lockedOrder) lockedOrder.state = 'LOCKED';
                break;
            case 'ORDER_PAID':
                const paidOrder = state.orders.get(event.payload.order_id);
                if (paidOrder) paidOrder.state = 'PAID';
                break;
            case 'ORDER_CLOSED':
                const closedOrder = state.orders.get(event.payload.order_id);
                if (closedOrder) closedOrder.state = 'CLOSED';
                break;
            case 'PAYMENT_CREATED':
                state.payments.set(event.payload.id, { state: 'PENDING' });
                break;
            case 'PAYMENT_CONFIRMED':
                const payment = state.payments.get(event.payload.payment_id);
                if (payment) payment.state = 'CONFIRMED';
                break;
        }
    }

    // Convert Maps to plain objects for comparison
    return {
        orders: Object.fromEntries(state.orders),
        payments: Object.fromEntries(state.payments),
        sessions: Object.fromEntries(state.sessions),
    };
}

function buildExpectedState(world: any): any {
    const orders: Record<string, any> = {};
    const payments: Record<string, any> = {};
    const sessions: Record<string, any> = {};

    for (const session of world.sessions) {
        sessions[session.session.id] = { state: session.session.state };

        for (const order of session.orders) {
            orders[order.order.id] = {
                state: order.order.state,
                total_cents: order.order.total_cents,
                items: order.items.map((i: any) => ({
                    id: i.id,
                    product_id: i.product_id,
                    name: i.name,
                    quantity: i.quantity,
                    price_snapshot_cents: i.price_snapshot_cents,
                })),
            };

            for (const payment of order.payments) {
                payments[payment.id] = { state: payment.state };
            }
        }
    }

    return { orders, payments, sessions };
}

function mapEventToTransition(eventType: string): string | null {
    const map: Record<string, string> = {
        'ORDER_LOCKED': 'FINALIZE',
        'ORDER_PAID': 'PAY',
        'ORDER_CLOSED': 'CLOSE',
        'ORDER_CANCELED': 'CANCEL',
        'PAYMENT_CONFIRMED': 'CONFIRM',
        'PAYMENT_FAILED': 'FAIL',
        'PAYMENT_CANCELED': 'CANCEL',
        'SESSION_STARTED': 'START',
        'SESSION_CLOSED': 'CLOSE',
    };
    return map[eventType] || null;
}

function getNextState(eventType: string, currentState: string): string {
    const map: Record<string, string> = {
        'ORDER_LOCKED': 'LOCKED',
        'ORDER_PAID': 'PAID',
        'ORDER_CLOSED': 'CLOSED',
        'ORDER_CANCELED': 'CANCELED',
        'PAYMENT_CONFIRMED': 'CONFIRMED',
        'PAYMENT_FAILED': 'FAILED',
        'PAYMENT_CANCELED': 'CANCELED',
        'SESSION_STARTED': 'ACTIVE',
        'SESSION_CLOSED': 'CLOSED',
    };
    return map[eventType] || currentState;
}
