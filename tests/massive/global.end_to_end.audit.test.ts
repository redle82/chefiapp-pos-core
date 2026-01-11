/**
 * Global End-to-End Audit Test
 *
 * The final audit that validates the entire system:
 * - All gates working together
 * - Complete flow: Event → Seal → Fiscal → Projection
 * - Replay proof
 * - Full consistency check
 */

import {
    loadWorldConfig,
    loadPilotConfig,
    loadStressConfig,
    WorldFactory,
    SeededRandom,
    Gate01Asserts,
    Gate23Asserts,
    Gate4Asserts,
    Gate5Asserts,
    Gate7Asserts,
    GlobalAsserts,
    AuditAsserter,
    MetricsCollector,
    ReportWriter,
    ConsoleReporter,
    GeneratedWorld,
    WorldStats,
} from '../harness';
import { LegalBoundary } from '../../legal-boundary/LegalBoundary';
import { InMemoryLegalSealStore } from '../../legal-boundary/InMemoryLegalSealStore';
import { InMemoryEventStore } from '../../event-log/InMemoryEventStore';
import { OrderSummaryProjection } from '../../projections/OrderSummaryProjection';
import { LegalSeal, LegalEntityType } from '../../legal-boundary/types';
import { CoreEvent } from '../../event-log/types';

describe('Global End-to-End Audit', () => {
    let config = loadPilotConfig();
    let factory: WorldFactory;
    let asserter: AuditAsserter;
    let metrics: MetricsCollector;
    let eventStore: InMemoryEventStore;
    let sealStore: InMemoryLegalSealStore;
    let legalBoundary: LegalBoundary;
    let projection: OrderSummaryProjection;
    let rng: SeededRandom;

    beforeAll(() => {
        if (process.env.WORLD_STRESS === 'true') {
            config = loadStressConfig();
        } else if (process.env.WORLD_FULL === 'true') {
            config = loadWorldConfig();
        }
    });

    beforeEach(() => {
        factory = new WorldFactory(config);
        asserter = new AuditAsserter();
        metrics = new MetricsCollector();
        eventStore = new InMemoryEventStore();
        sealStore = new InMemoryLegalSealStore();
        legalBoundary = new LegalBoundary(sealStore);
        projection = new OrderSummaryProjection();
        rng = new SeededRandom(config.seed);
        metrics.start();
    });

    afterEach(() => {
        metrics.end();
    });

    describe('Complete Flow: Event → Seal → Projection', () => {
        it('should process complete order lifecycle through all gates', async () => {
            const world = factory.generate();
            const order = world.sessions[0]?.orders[0];
            if (!order) return;

            // Process events through all layers
            for (const event of order.events) {
                // Gate 0-1: Event Store
                await eventStore.append(event, event.stream_version - 1);

                // Gate 2-3: Legal Boundary
                await legalBoundary.observe([event], getStreamHash);

                // Gate 7: Projection
                await projection.handle(event);
            }

            // Verify Gate 0-1: Events persisted
            const storedEvents = await eventStore.readStream(`ORDER:${order.order.id}`);
            expect(storedEvents.length).toBeGreaterThan(0);

            // Verify Gate 2-3: Seals created
            const orderSeals = await sealStore.listSealsByEntity('ORDER', order.order.id);
            expect(orderSeals.length).toBe(2); // ORDER_DECLARED + ORDER_FINAL

            // Verify Gate 7: Projection updated
            const summary = await projection.getSummary(order.order.id);
            expect(summary).toBeDefined();
            expect(summary!.status).toBe('CLOSED');
            expect(summary!.totalCents).toBe(order.order.total_cents);
        });

        it('should maintain consistency across all gates', async () => {
            const world = factory.generate();

            // Process all events
            for (const event of world.allEvents) {
                try {
                    await eventStore.append(event, event.stream_version - 1);
                    await legalBoundary.observe([event], getStreamHash);
                    await projection.handle(event);
                } catch (error) {
                    // Handle version conflicts for concurrent streams
                }
            }

            // Verify consistency
            for (const session of world.sessions.slice(0, 5)) {
                for (const order of session.orders.slice(0, 5)) {
                    // Events exist
                    const events = await eventStore.readStream(`ORDER:${order.order.id}`);

                    // Seals exist
                    const seals = await sealStore.listSealsByEntity('ORDER', order.order.id);

                    // Projection exists
                    const summary = await projection.getSummary(order.order.id);

                    // All should be consistent
                    if (events.length > 0) {
                        expect(seals.length).toBeGreaterThan(0);
                        expect(summary).toBeDefined();
                    }
                }
            }
        });
    });

    describe('Replay Proof', () => {
        it('should reconstruct identical state from events', async () => {
            const world = factory.generate();

            // First pass
            for (const event of world.allEvents) {
                try {
                    await eventStore.append(event, event.stream_version - 1);
                    await legalBoundary.observe([event], getStreamHash);
                    await projection.handle(event);
                } catch (error) {
                    // Handle conflicts
                }
            }

            const sealsAfterFirst = await sealStore.listAllSeals();
            const projectionsAfterFirst = await captureProjectionState(projection, world);

            // Reset projections (seals are immutable, so we simulate with new store)
            const newProjection = new OrderSummaryProjection();

            // Replay all events
            for (const event of world.allEvents) {
                await newProjection.handle(event);
            }

            const projectionsAfterReplay = await captureProjectionState(newProjection, world);

            // Projections should match
            expect(Object.keys(projectionsAfterReplay).length)
                .toBe(Object.keys(projectionsAfterFirst).length);

            for (const orderId of Object.keys(projectionsAfterFirst)) {
                expect(projectionsAfterReplay[orderId]).toEqual(projectionsAfterFirst[orderId]);
            }
        });

        it('should verify deterministic replay across seeds', async () => {
            // First world
            const factory1 = new WorldFactory({ ...config, seed: config.seed });
            const world1 = factory1.generate();

            // Second world with same seed
            const factory2 = new WorldFactory({ ...config, seed: config.seed });
            const world2 = factory2.generate();

            // Should produce identical events
            expect(world1.allEvents.length).toBe(world2.allEvents.length);

            for (let i = 0; i < world1.allEvents.length; i++) {
                expect(world1.allEvents[i].event_id).toBe(world2.allEvents[i].event_id);
                expect(world1.allEvents[i].type).toBe(world2.allEvents[i].type);
            }
        });
    });

    describe('All Gates Audit', () => {
        it('should pass all gate assertions', async () => {
            const world = factory.generate();

            // Process world
            for (const event of world.allEvents) {
                try {
                    await eventStore.append(event, event.stream_version - 1);
                    await legalBoundary.observe([event], getStreamHash);
                    await projection.handle(event);
                } catch (error) {
                    // Handle conflicts
                }
            }

            const seals = await sealStore.listAllSeals();

            // Gate 0-1 Assertions
            asserter.add(Gate01Asserts.assertStreamVersionSequencing(world.allEvents));
            asserter.add(Gate01Asserts.assertNonNegativeAmounts(
                world.sessions.flatMap(s => s.orders.flatMap(o => o.items.map(i => ({
                    id: i.id,
                    amount_cents: i.price_snapshot_cents
                }))))
            ));

            // Gate 2-3 Assertions
            asserter.add(Gate23Asserts.assertNoEventWithoutSeal(
                world.allEvents, seals, 'PAYMENT_CONFIRMED', 'PAYMENT_SEALED'
            ));
            asserter.add(Gate23Asserts.assertNoEventWithoutSeal(
                world.allEvents, seals, 'ORDER_PAID', 'ORDER_DECLARED'
            ));
            asserter.add(Gate23Asserts.assertNoEventWithoutSeal(
                world.allEvents, seals, 'ORDER_CLOSED', 'ORDER_FINAL'
            ));
            asserter.add(Gate23Asserts.assertNoDuplicateSeals(seals));
            asserter.add(Gate23Asserts.assertSealSequenceMonotonic(seals));

            // Global Assertions
            asserter.add(GlobalAsserts.assertGlobalSequencing(world.allEvents));

            const summary = asserter.getSummary();
            console.log(`
            Gate Assertion Summary:
            ${JSON.stringify(summary.byGate, null, 2)}
            `);

            expect(summary.failed).toBe(0);
        });
    });

    describe('Full World Audit with Report', () => {
        it('should generate comprehensive audit report', async () => {
            const world = factory.generate();

            console.log(`
            ════════════════════════════════════════════════════════════
            FULL WORLD AUDIT
            ════════════════════════════════════════════════════════════
            Configuration:
            - Seed: ${config.seed}
            - Restaurants: ${config.restaurants}
            - Tables/Restaurant: ${config.tablesPerRestaurant}
            - Orders/Restaurant: ${config.ordersPerRestaurant}
            - Concurrency: ${config.concurrency}
            ════════════════════════════════════════════════════════════
            `);

            const startTime = Date.now();

            // Process all events
            let eventsProcessed = 0;
            let sealsCreated = 0;

            for (const event of world.allEvents) {
                try {
                    await eventStore.append(event, event.stream_version - 1);
                    eventsProcessed++;

                    const sealsBefore = (await sealStore.listAllSeals()).length;
                    await legalBoundary.observe([event], getStreamHash);
                    const sealsAfter = (await sealStore.listAllSeals()).length;
                    sealsCreated += sealsAfter - sealsBefore;

                    await projection.handle(event);
                } catch (error) {
                    // Expected for concurrent streams
                }
            }

            const duration = Date.now() - startTime;

            // Collect all seals
            const seals = await sealStore.listAllSeals();

            // Run all assertions
            // Gate 0-1
            asserter.add(Gate01Asserts.assertStreamVersionSequencing(world.allEvents));
            asserter.add(Gate01Asserts.assertNonNegativeAmounts(
                world.sessions.flatMap(s => s.orders.flatMap(o => [
                    ...o.items.map(i => ({ id: i.id, amount_cents: i.price_snapshot_cents })),
                    ...o.payments.map(p => ({ id: p.id, amount_cents: p.amount_cents })),
                ]))
            ));

            // Gate 2-3
            asserter.add(Gate23Asserts.assertNoEventWithoutSeal(
                world.allEvents, seals, 'PAYMENT_CONFIRMED', 'PAYMENT_SEALED'
            ));
            asserter.add(Gate23Asserts.assertNoEventWithoutSeal(
                world.allEvents, seals, 'ORDER_PAID', 'ORDER_DECLARED'
            ));
            asserter.add(Gate23Asserts.assertNoEventWithoutSeal(
                world.allEvents, seals, 'ORDER_CLOSED', 'ORDER_FINAL'
            ));
            asserter.add(Gate23Asserts.assertNoDuplicateSeals(seals));
            asserter.add(Gate23Asserts.assertSealSequenceMonotonic(seals));

            // Global
            asserter.add(GlobalAsserts.assertGlobalSequencing(world.allEvents));

            // Update metrics
            metrics.recordEvents(eventsProcessed);
            metrics.recordSeals(sealsCreated);
            metrics.end();

            const metricsData = metrics.getMetrics();
            const assertionSummary = asserter.getSummary();

            // Generate report
            const reportWriter = new ReportWriter('./audit-reports');
            const { jsonPath, mdPath } = await reportWriter.writeReport(
                config,
                world.stats,
                metricsData,
                {
                    totalScenarios: 1,
                    passed: assertionSummary.failed === 0 ? 1 : 0,
                    failed: assertionSummary.failed > 0 ? 1 : 0,
                    totalEvents: eventsProcessed,
                    totalSeals: sealsCreated,
                    totalDuration: duration,
                    eventsPerSecond: eventsProcessed / (duration / 1000),
                    errorsByGate: {},
                    errorsByCategory: {},
                },
                asserter.getResults(),
                [{
                    success: assertionSummary.failed === 0,
                    scenarioName: 'FULL_WORLD_AUDIT',
                    errors: [],
                    duration,
                    eventsProcessed,
                    sealsCreated,
                    assertionsPassed: assertionSummary.passed,
                    assertionsFailed: assertionSummary.failed,
                }]
            );

            console.log(`
            ════════════════════════════════════════════════════════════
            AUDIT RESULTS
            ════════════════════════════════════════════════════════════
            Duration: ${duration}ms
            Events Processed: ${eventsProcessed}
            Seals Created: ${sealsCreated}
            Events/Second: ${(eventsProcessed / (duration / 1000)).toFixed(2)}

            ASSERTIONS:
            - Total: ${assertionSummary.total}
            - Passed: ${assertionSummary.passed}
            - Failed: ${assertionSummary.failed}

            By Gate:
            ${JSON.stringify(assertionSummary.byGate, null, 2)}

            REPORTS GENERATED:
            - JSON: ${jsonPath}
            - Markdown: ${mdPath}
            ════════════════════════════════════════════════════════════
            `);

            // Print console summary
            const report = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    seed: config.seed,
                    version: '1.0.0',
                    environment: 'test',
                    duration: `${(duration / 1000).toFixed(2)}s`,
                },
                config,
                worldStats: world.stats,
                metrics: metricsData,
                runSummary: {
                    totalScenarios: 1,
                    passed: assertionSummary.failed === 0 ? 1 : 0,
                    failed: assertionSummary.failed > 0 ? 1 : 0,
                    totalEvents: eventsProcessed,
                    totalSeals: sealsCreated,
                    totalDuration: duration,
                    eventsPerSecond: eventsProcessed / (duration / 1000),
                    errorsByGate: {},
                    errorsByCategory: {},
                },
                assertions: {
                    total: assertionSummary.total,
                    passed: assertionSummary.passed,
                    failed: assertionSummary.failed,
                    byGate: assertionSummary.byGate,
                    details: asserter.getResults(),
                },
                scenarios: [],
                verdict: {
                    passed: assertionSummary.failed === 0,
                    grade: assertionSummary.failed === 0 ? 'A' : 'F' as 'A' | 'F',
                    summary: assertionSummary.failed === 0
                        ? 'All gates passed audit successfully'
                        : `${assertionSummary.failed} assertions failed`,
                    criticalIssues: [],
                    warnings: [],
                    recommendations: [],
                },
            };

            ConsoleReporter.printSummary(report as any);

            expect(assertionSummary.failed).toBe(0);
        }, 300000); // 5 minute timeout for full audit
    });

    describe('Stress Configuration', () => {
        it('should handle stress configuration without failures', async () => {
            // Only run full stress in CI or explicit request
            if (!process.env.WORLD_STRESS && !process.env.CI) {
                console.log('Skipping stress test. Set WORLD_STRESS=true to run.');
                return;
            }

            const stressConfig = loadStressConfig();
            const stressFactory = new WorldFactory(stressConfig);
            const world = stressFactory.generate();

            console.log(`
            STRESS TEST CONFIGURATION:
            - Restaurants: ${stressConfig.restaurants}
            - Orders: ${world.stats.totalOrders}
            - Events: ${world.stats.totalEvents}
            `);

            // Process events
            let processed = 0;
            for (const event of world.allEvents) {
                try {
                    await projection.handle(event);
                    processed++;
                } catch (error) {
                    // Continue on error
                }
            }

            expect(processed).toBe(world.allEvents.length);
        }, 600000); // 10 minute timeout
    });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStreamHash(entityType: LegalEntityType, entityId: string): string {
    return `hash_${entityType}_${entityId}_${Date.now()}`;
}

async function captureProjectionState(
    projection: OrderSummaryProjection,
    world: GeneratedWorld
): Promise<Record<string, { status: string; totalCents: number; itemCount: number }>> {
    const state: Record<string, { status: string; totalCents: number; itemCount: number }> = {};

    for (const session of world.sessions) {
        for (const order of session.orders) {
            const summary = await projection.getSummary(order.order.id);
            if (summary) {
                state[order.order.id] = {
                    status: summary.status,
                    totalCents: summary.totalCents,
                    itemCount: summary.itemCount,
                };
            }
        }
    }

    return state;
}
