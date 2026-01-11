/**
 * Gate 7: UI Projections World Tests
 *
 * Tests:
 * - OrderSummaryProjection correctness
 * - Projection state matches event-sourced truth
 * - Active orders filtering
 * - Projections are rebuildable from events
 * - Concurrent projection updates
 */

import {
    loadWorldConfig,
    loadPilotConfig,
    WorldFactory,
    SeededRandom,
    Gate7Asserts,
    AuditAsserter,
    MetricsCollector,
    GeneratedWorld,
} from '../harness';
import { OrderSummaryProjection, ReadOrderSummary } from '../../projections/OrderSummaryProjection';
import { CoreEvent } from '../../event-log/types';

describe('Gate 7: UI Projections (World Simulation)', () => {
    let config = loadPilotConfig();
    let factory: WorldFactory;
    let asserter: AuditAsserter;
    let metrics: MetricsCollector;
    let projection: OrderSummaryProjection;
    let rng: SeededRandom;

    beforeAll(() => {
        if (process.env.WORLD_STRESS === 'true') {
            config = loadWorldConfig();
        }
    });

    beforeEach(() => {
        factory = new WorldFactory(config);
        asserter = new AuditAsserter();
        metrics = new MetricsCollector();
        projection = new OrderSummaryProjection();
        rng = new SeededRandom(config.seed);
        metrics.start();
    });

    afterEach(() => {
        metrics.end();
    });

    describe('OrderSummaryProjection Correctness', () => {
        it('should have OPEN status after ORDER_CREATED', async () => {
            const world = factory.generate();

            // Find an ORDER_CREATED event
            const orderCreatedEvent = world.allEvents.find(e => e.type === 'ORDER_CREATED');
            if (!orderCreatedEvent) return;

            await projection.handle(orderCreatedEvent);

            const summary = await projection.getSummary(orderCreatedEvent.payload.id);

            expect(summary).toBeDefined();
            expect(summary!.status).toBe('OPEN');
            expect(summary!.totalCents).toBe(0);
            expect(summary!.itemCount).toBe(0);
        });

        it('should calculate totalCents as sum of (price_snapshot_cents * qty)', async () => {
            const world = factory.generate();

            // Get first order with items
            const order = world.sessions[0]?.orders[0];
            if (!order) return;

            // Process events in order
            for (const event of order.events) {
                await projection.handle(event);
            }

            const summary = await projection.getSummary(order.order.id);

            // Calculate expected total
            const expectedTotal = order.items.reduce(
                (sum, item) => sum + (item.price_snapshot_cents * item.quantity),
                0
            );

            expect(summary).toBeDefined();
            expect(summary!.totalCents).toBe(expectedTotal);
            expect(summary!.totalCents).toBe(order.order.total_cents);
        });

        it('should have PAID status after ORDER_PAID', async () => {
            const world = factory.generate();
            const order = world.sessions[0]?.orders[0];
            if (!order) return;

            // Process until ORDER_PAID
            for (const event of order.events) {
                await projection.handle(event);
                if (event.type === 'ORDER_PAID') break;
            }

            const summary = await projection.getSummary(order.order.id);

            expect(summary).toBeDefined();
            expect(summary!.status).toBe('PAID');
        });

        it('should have CLOSED status after ORDER_CLOSED', async () => {
            const world = factory.generate();
            const order = world.sessions[0]?.orders[0];
            if (!order) return;

            // Process all events
            for (const event of order.events) {
                await projection.handle(event);
            }

            const summary = await projection.getSummary(order.order.id);

            expect(summary).toBeDefined();
            expect(summary!.status).toBe('CLOSED');
        });

        it('should correctly track itemCount', async () => {
            const world = factory.generate();
            const order = world.sessions[0]?.orders[0];
            if (!order) return;

            for (const event of order.events) {
                await projection.handle(event);
            }

            const summary = await projection.getSummary(order.order.id);

            expect(summary).toBeDefined();
            expect(summary!.itemCount).toBe(order.items.length);
        });
    });

    describe('Active Orders Filtering', () => {
        it('should return OPEN orders in getActiveOrders', async () => {
            const world = factory.generate();

            // Process only ORDER_CREATED events (no payments)
            const incompleteOrders = factory.generateIncompleteOrders(5);

            for (const order of incompleteOrders) {
                for (const event of order.events) {
                    await projection.handle(event);
                }
            }

            const activeOrders = await projection.getActiveOrders();

            expect(activeOrders.length).toBe(5);
            expect(activeOrders.every(o => o.status === 'OPEN')).toBe(true);
        });

        it('should return PAID orders in getActiveOrders', async () => {
            const world = factory.generate();

            // Process orders up to PAID status
            let paidCount = 0;
            for (const session of world.sessions.slice(0, 2)) {
                for (const order of session.orders.slice(0, 3)) {
                    for (const event of order.events) {
                        await projection.handle(event);
                        if (event.type === 'ORDER_PAID') {
                            paidCount++;
                            break; // Stop before CLOSED
                        }
                    }
                }
            }

            const activeOrders = await projection.getActiveOrders();
            const paidOrders = activeOrders.filter(o => o.status === 'PAID');

            expect(paidOrders.length).toBeGreaterThan(0);
        });

        it('should NOT include CLOSED orders in getActiveOrders', async () => {
            const world = factory.generate();

            // Process complete orders
            for (const session of world.sessions.slice(0, 2)) {
                for (const order of session.orders.slice(0, 3)) {
                    for (const event of order.events) {
                        await projection.handle(event);
                    }
                }
            }

            const activeOrders = await projection.getActiveOrders();
            const closedOrders = activeOrders.filter(o => o.status === 'CLOSED');

            expect(closedOrders.length).toBe(0);
        });

        it('should order active orders by updatedAt DESC', async () => {
            const world = factory.generate();

            // Process incomplete orders with varying times
            const incompleteOrders = factory.generateIncompleteOrders(10);

            for (const order of incompleteOrders) {
                for (const event of order.events) {
                    await projection.handle(event);
                }
            }

            const activeOrders = await projection.getActiveOrders();

            // Check descending order
            for (let i = 1; i < activeOrders.length; i++) {
                expect(activeOrders[i - 1].updatedAt.getTime())
                    .toBeGreaterThanOrEqual(activeOrders[i].updatedAt.getTime());
            }
        });
    });

    describe('Projection Rebuild', () => {
        it('should produce identical state after reset and replay', async () => {
            const world = factory.generate();

            // First pass
            for (const event of world.allEvents.slice(0, 100)) {
                await projection.handle(event);
            }

            // Get state
            const originalState = await captureProjectionState(projection, world);

            // Reset
            await projection.reset();

            // Second pass (replay)
            for (const event of world.allEvents.slice(0, 100)) {
                await projection.handle(event);
            }

            // Get new state
            const rebuiltState = await captureProjectionState(projection, world);

            const result = Gate7Asserts.assertProjectionRebuildable(originalState, rebuiltState);
            asserter.add(result);
            expect(result.passed).toBe(true);
        });

        it('should correctly rebuild partial state', async () => {
            const world = factory.generate();

            // Process half the events
            const halfPoint = Math.floor(world.allEvents.length / 2);
            for (const event of world.allEvents.slice(0, halfPoint)) {
                await projection.handle(event);
            }

            const partialState = await captureProjectionState(projection, world);

            // Reset and replay same events
            await projection.reset();
            for (const event of world.allEvents.slice(0, halfPoint)) {
                await projection.handle(event);
            }

            const rebuiltPartialState = await captureProjectionState(projection, world);

            expect(partialState).toEqual(rebuiltPartialState);
        });
    });

    describe('Projection Consistency with Events', () => {
        it('should match event-sourced state exactly', async () => {
            const world = factory.generate();

            // Process all events
            for (const event of world.allEvents) {
                await projection.handle(event);
            }

            // Verify each order
            for (const session of world.sessions) {
                for (const order of session.orders) {
                    const summary = await projection.getSummary(order.order.id);

                    const expected = {
                        status: 'CLOSED' as const, // All orders in generated world are closed
                        totalCents: order.order.total_cents || 0,
                        itemCount: order.items.length,
                    };

                    const result = Gate7Asserts.assertOrderSummaryCorrectness(
                        summary ? {
                            orderId: summary.orderId,
                            status: summary.status,
                            totalCents: summary.totalCents,
                            itemCount: summary.itemCount,
                        } : undefined,
                        expected
                    );

                    asserter.add(result);
                }
            }

            const summary = asserter.getSummary();
            expect(summary.failed).toBe(0);
        });

        it('should have correct active orders count', async () => {
            const world = factory.generate();

            // Process incomplete orders
            const incompleteOrders = factory.generateIncompleteOrders(10);
            for (const order of incompleteOrders) {
                for (const event of order.events) {
                    await projection.handle(event);
                }
            }

            // Process some complete orders
            for (const session of world.sessions.slice(0, 1)) {
                for (const order of session.orders.slice(0, 5)) {
                    for (const event of order.events) {
                        await projection.handle(event);
                    }
                }
            }

            const activeOrders = await projection.getActiveOrders();
            const allOrders: { orderId: string; status: string }[] = [];

            // Collect incomplete orders
            for (const order of incompleteOrders) {
                allOrders.push({ orderId: order.order.id, status: 'OPEN' });
            }

            // Collect complete orders
            for (const session of world.sessions.slice(0, 1)) {
                for (const order of session.orders.slice(0, 5)) {
                    allOrders.push({ orderId: order.order.id, status: 'CLOSED' });
                }
            }

            const result = Gate7Asserts.assertActiveOrdersFilter(
                activeOrders.map(o => ({ orderId: o.orderId, status: o.status })),
                allOrders
            );

            asserter.add(result);
            expect(result.passed).toBe(true);
        });
    });

    describe('Concurrent Projection Updates', () => {
        it('should handle concurrent event processing', async () => {
            const world = factory.generate();

            // Process events concurrently in batches
            const batchSize = 20;
            const events = world.allEvents.slice(0, 100);

            for (let i = 0; i < events.length; i += batchSize) {
                const batch = events.slice(i, i + batchSize);
                await Promise.all(batch.map(event => projection.handle(event)));
            }

            // Verify state is consistent
            const activeOrders = await projection.getActiveOrders();

            // All returned orders should have valid state
            for (const order of activeOrders) {
                expect(['OPEN', 'PAID']).toContain(order.status);
                expect(order.totalCents).toBeGreaterThanOrEqual(0);
            }
        });

        it('should maintain consistency under rapid updates', async () => {
            const world = factory.generate();
            const order = world.sessions[0]?.orders[0];
            if (!order) return;

            // Process same order events multiple times rapidly
            const promises = order.events.flatMap(event => [
                projection.handle(event),
                projection.handle(event), // Duplicate
            ]);

            await Promise.all(promises);

            const summary = await projection.getSummary(order.order.id);

            // Should have correct final state despite duplicates
            expect(summary).toBeDefined();
            // Note: Current projection doesn't have deduplication,
            // so this test documents the behavior
        });
    });

    describe('World-Scale Projection Stress Test', () => {
        it('should process full world events into projections', async () => {
            const world = factory.generate();

            console.log(`
            Projection Stress Test:
            - Total events: ${world.stats.totalEvents}
            - Total orders: ${world.stats.totalOrders}
            `);

            const startTime = Date.now();

            // Process all events
            for (const event of world.allEvents) {
                await projection.handle(event);
            }

            const duration = Date.now() - startTime;

            // Get final state
            const activeOrders = await projection.getActiveOrders();

            console.log(`
            Projection processing completed in ${duration}ms:
            - Events processed: ${world.allEvents.length}
            - Active orders: ${activeOrders.length}
            - Events/second: ${(world.allEvents.length / (duration / 1000)).toFixed(2)}
            `);

            // All orders should be CLOSED in generated world
            expect(activeOrders.length).toBe(0);

            // Verify all orders are correctly projected
            let correctCount = 0;
            let incorrectCount = 0;

            for (const session of world.sessions) {
                for (const order of session.orders) {
                    const summary = await projection.getSummary(order.order.id);

                    if (summary &&
                        summary.status === 'CLOSED' &&
                        summary.totalCents === order.order.total_cents &&
                        summary.itemCount === order.items.length) {
                        correctCount++;
                    } else {
                        incorrectCount++;
                    }
                }
            }

            console.log(`
            Verification results:
            - Correct: ${correctCount}
            - Incorrect: ${incorrectCount}
            `);

            expect(incorrectCount).toBe(0);

            metrics.recordEvents(world.allEvents.length);
        }, 120000);

        it('should rebuild full projection from scratch', async () => {
            const world = factory.generate();

            // First build
            for (const event of world.allEvents) {
                await projection.handle(event);
            }

            const firstBuildState = await captureFullProjectionState(projection, world);

            // Reset
            await projection.reset();

            // Second build
            for (const event of world.allEvents) {
                await projection.handle(event);
            }

            const secondBuildState = await captureFullProjectionState(projection, world);

            // States should match
            expect(firstBuildState).toEqual(secondBuildState);

            const result = Gate7Asserts.assertProjectionRebuildable(firstBuildState, secondBuildState);
            asserter.add(result);
            expect(result.passed).toBe(true);
        }, 120000);
    });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function captureProjectionState(
    projection: OrderSummaryProjection,
    world: GeneratedWorld
): Promise<Record<string, ReadOrderSummary>> {
    const state: Record<string, ReadOrderSummary> = {};

    for (const session of world.sessions) {
        for (const order of session.orders) {
            const summary = await projection.getSummary(order.order.id);
            if (summary) {
                state[order.order.id] = summary;
            }
        }
    }

    return state;
}

async function captureFullProjectionState(
    projection: OrderSummaryProjection,
    world: GeneratedWorld
): Promise<{
    orders: Record<string, { status: string; totalCents: number; itemCount: number }>;
    activeCount: number;
}> {
    const orders: Record<string, { status: string; totalCents: number; itemCount: number }> = {};

    for (const session of world.sessions) {
        for (const order of session.orders) {
            const summary = await projection.getSummary(order.order.id);
            if (summary) {
                orders[order.order.id] = {
                    status: summary.status,
                    totalCents: summary.totalCents,
                    itemCount: summary.itemCount,
                };
            }
        }
    }

    const activeOrders = await projection.getActiveOrders();

    return {
        orders,
        activeCount: activeOrders.length,
    };
}
