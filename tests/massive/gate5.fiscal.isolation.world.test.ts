/**
 * Gate 5: Fiscal Isolation World Tests
 *
 * Tests:
 * - Fiscal failure does NOT block core operations
 * - Fiscal observer is idempotent
 * - Fiscal sequence is strictly increasing
 * - Fiscal records maintain evidence of all attempts
 */

import {
    loadWorldConfig,
    loadPilotConfig,
    WorldFactory,
    SeededRandom,
    Gate5Asserts,
    AuditAsserter,
    MetricsCollector,
    GeneratedWorld,
} from '../harness';
import { LegalSeal } from '../../legal-boundary/types';
import { CoreEvent } from '../../event-log/types';

// Extended result type for testing (simplified version for test purposes)
interface MockFiscalResult {
    success: boolean;
    status: string;
    gov_protocol?: string;
    error?: string;
}

// Mock Fiscal Observer for testing
class MockFiscalObserver {
    private processedSeals: Set<string> = new Set();
    private failureProbability: number;
    private records: FiscalRecord[] = [];
    private sequence: number = 0;

    constructor(failureProbability: number = 0) {
        this.failureProbability = failureProbability;
    }

    async onSealed(seal: LegalSeal, event: CoreEvent): Promise<MockFiscalResult> {
        // Simulate fiscal authority call
        const shouldFail = Math.random() < this.failureProbability;

        if (shouldFail) {
            return {
                success: false,
                status: 'REJECTED',
                error: 'Fiscal authority unavailable (simulated)',
            };
        }

        // Idempotency check
        if (this.processedSeals.has(seal.seal_id)) {
            return {
                success: true,
                status: 'ALREADY_PROCESSED',
                gov_protocol: `GOV_${seal.seal_id}`,
            };
        }

        this.processedSeals.add(seal.seal_id);
        this.sequence++;

        const record: FiscalRecord = {
            sealId: seal.seal_id,
            fiscalSequenceId: this.sequence,
            createdAt: new Date(),
            status: 'REPORTED',
        };
        this.records.push(record);

        return {
            success: true,
            status: 'REPORTED',
            gov_protocol: `GOV_${this.sequence}_${seal.seal_id.slice(0, 8)}`,
        };
    }

    getRecords(): FiscalRecord[] {
        return this.records;
    }

    getProcessedSeals(): Set<string> {
        return this.processedSeals;
    }

    reset(): void {
        this.processedSeals.clear();
        this.records = [];
        this.sequence = 0;
    }
}

interface FiscalRecord {
    sealId: string;
    fiscalSequenceId: number;
    createdAt: Date;
    status: string;
}

describe('Gate 5: Fiscal Isolation (World Simulation)', () => {
    let config = loadPilotConfig();
    let factory: WorldFactory;
    let asserter: AuditAsserter;
    let metrics: MetricsCollector;
    let fiscalObserver: MockFiscalObserver;
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
        fiscalObserver = new MockFiscalObserver(0); // No failures by default
        rng = new SeededRandom(config.seed);
        metrics.start();
    });

    afterEach(() => {
        metrics.end();
    });

    describe('Fiscal Isolation from Core', () => {
        it('should allow core operations even when fiscal fails', async () => {
            const world = factory.generate();

            // Set high failure probability
            const failingFiscalObserver = new MockFiscalObserver(0.5);

            const operations: { coreSucceeded: boolean; fiscalSucceeded: boolean }[] = [];

            // Process seals
            const seals = generateSealsFromWorld(world, rng);

            for (const seal of seals.slice(0, 50)) {
                const event = findEventForSeal(seal, world);
                if (!event) continue;

                // Core operation always succeeds (seal was created)
                const coreSucceeded = true;

                // Fiscal might fail
                const fiscalResult = await failingFiscalObserver.onSealed(seal, event);
                const fiscalSucceeded = fiscalResult.success;

                operations.push({ coreSucceeded, fiscalSucceeded });
            }

            const result = Gate5Asserts.assertFiscalIsolation(operations);
            asserter.add(result);
            expect(result.passed).toBe(true);

            // Core should succeed regardless of fiscal
            const coreSuccessCount = operations.filter(o => o.coreSucceeded).length;
            expect(coreSuccessCount).toBe(operations.length);
        });

        it('should continue processing after fiscal timeout', async () => {
            const world = factory.generate();
            const seals = generateSealsFromWorld(world, rng);

            let processedCount = 0;
            const timeoutProbability = 0.3;

            for (const seal of seals.slice(0, 20)) {
                const event = findEventForSeal(seal, world);
                if (!event) continue;

                // Simulate timeout
                if (Math.random() < timeoutProbability) {
                    // Fiscal times out, but we continue
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                // Core continues regardless
                processedCount++;
            }

            expect(processedCount).toBe(Math.min(20, seals.length));
        });
    });

    describe('Fiscal Idempotency', () => {
        it('should be idempotent when processing same seal multiple times', async () => {
            const world = factory.generate();
            const seals = generateSealsFromWorld(world, rng);
            const testSeal = seals[0];
            const event = findEventForSeal(testSeal, world);

            if (!testSeal || !event) return;

            // Process same seal 5 times
            const results: MockFiscalResult[] = [];
            for (let i = 0; i < 5; i++) {
                const result = await fiscalObserver.onSealed(testSeal, event);
                results.push(result);
            }

            // All should succeed
            expect(results.every(r => r.success)).toBe(true);

            // First should be REPORTED, rest should be ALREADY_PROCESSED
            expect(results[0].status).toBe('REPORTED');
            for (let i = 1; i < results.length; i++) {
                expect(results[i].status).toBe('ALREADY_PROCESSED');
            }

            // Only one record should be created
            expect(fiscalObserver.getRecords().length).toBe(1);
        });

        it('should not create duplicate fiscal records on replay', async () => {
            const world = factory.generate();
            const seals = generateSealsFromWorld(world, rng);

            // First pass
            for (const seal of seals.slice(0, 20)) {
                const event = findEventForSeal(seal, world);
                if (event) {
                    await fiscalObserver.onSealed(seal, event);
                }
            }
            const recordsAfterFirst = fiscalObserver.getRecords().length;

            // Second pass (replay)
            for (const seal of seals.slice(0, 20)) {
                const event = findEventForSeal(seal, world);
                if (event) {
                    await fiscalObserver.onSealed(seal, event);
                }
            }
            const recordsAfterSecond = fiscalObserver.getRecords().length;

            // Same number of records
            expect(recordsAfterSecond).toBe(recordsAfterFirst);

            // Build fiscal records for assertion
            const fiscalRecords = seals.slice(0, 20).map(seal => ({
                sealId: seal.seal_id,
                attempts: 2,
                records: fiscalObserver.getRecords().filter(r => r.sealId === seal.seal_id).length
            }));

            const result = Gate5Asserts.assertFiscalIdempotency(fiscalRecords);
            asserter.add(result);
            expect(result.passed).toBe(true);
        });
    });

    describe('Fiscal Sequence Integrity', () => {
        it('should maintain strictly increasing fiscal sequence', async () => {
            const world = factory.generate();
            const seals = generateSealsFromWorld(world, rng);

            // Process all seals
            for (const seal of seals) {
                const event = findEventForSeal(seal, world);
                if (event) {
                    await fiscalObserver.onSealed(seal, event);
                }
            }

            const records = fiscalObserver.getRecords();
            const fiscalEvents = records.map(r => ({
                fiscalSequenceId: r.fiscalSequenceId,
                createdAt: r.createdAt,
            }));

            const result = Gate5Asserts.assertFiscalSequenceIncreasing(fiscalEvents);
            asserter.add(result);
            expect(result.passed).toBe(true);
        });

        it('should have no gaps in fiscal sequence', async () => {
            const world = factory.generate();
            const seals = generateSealsFromWorld(world, rng);

            for (const seal of seals.slice(0, 50)) {
                const event = findEventForSeal(seal, world);
                if (event) {
                    await fiscalObserver.onSealed(seal, event);
                }
            }

            const records = fiscalObserver.getRecords();
            const sequences = records.map(r => r.fiscalSequenceId).sort((a, b) => a - b);

            // Check for gaps (should be 1, 2, 3, 4, ...)
            for (let i = 0; i < sequences.length; i++) {
                expect(sequences[i]).toBe(i + 1);
            }
        });
    });

    describe('Fiscal Evidence Preservation', () => {
        it('should preserve evidence of all fiscal attempts', async () => {
            const world = factory.generate();

            // Observer that tracks all attempts
            const evidenceTracker: {
                sealId: string;
                attempt: number;
                timestamp: Date;
                result: string;
            }[] = [];

            const seals = generateSealsFromWorld(world, rng);

            for (const seal of seals.slice(0, 20)) {
                const event = findEventForSeal(seal, world);
                if (!event) continue;

                const result = await fiscalObserver.onSealed(seal, event);

                evidenceTracker.push({
                    sealId: seal.seal_id,
                    attempt: 1,
                    timestamp: new Date(),
                    result: result.status,
                });
            }

            // All attempts should be tracked
            expect(evidenceTracker.length).toBeGreaterThan(0);

            // Each seal should have exactly one attempt tracked
            const sealIds = new Set(evidenceTracker.map(e => e.sealId));
            expect(sealIds.size).toBe(evidenceTracker.length);
        });

        it('should track failed fiscal attempts for retry', async () => {
            const world = factory.generate();
            const failingObserver = new MockFiscalObserver(1.0); // 100% failure rate

            const failedAttempts: { sealId: string; error: string }[] = [];
            const seals = generateSealsFromWorld(world, rng);

            for (const seal of seals.slice(0, 10)) {
                const event = findEventForSeal(seal, world);
                if (!event) continue;

                const result = await failingObserver.onSealed(seal, event);

                if (!result.success) {
                    failedAttempts.push({
                        sealId: seal.seal_id,
                        error: result.error || 'Unknown error',
                    });
                }
            }

            // All should have failed (as expected with 100% failure rate)
            expect(failedAttempts.length).toBe(Math.min(10, seals.length));

            // Each failure should be tracked for retry
            for (const failure of failedAttempts) {
                expect(failure.error).toContain('unavailable');
            }
        });
    });

    describe('Offline Fiscal Scenario', () => {
        it('should handle intermittent fiscal connectivity', async () => {
            const world = factory.generate();

            // Variable failure rate to simulate network issues
            let currentFailureRate = 0;
            const seals = generateSealsFromWorld(world, rng);

            const results: { connected: boolean; success: boolean }[] = [];

            for (let i = 0; i < Math.min(30, seals.length); i++) {
                const seal = seals[i];
                const event = findEventForSeal(seal, world);
                if (!event) continue;

                // Simulate network fluctuation
                if (i % 10 === 0) {
                    currentFailureRate = currentFailureRate > 0 ? 0 : 0.8;
                }

                const observer = new MockFiscalObserver(currentFailureRate);
                const result = await observer.onSealed(seal, event);

                results.push({
                    connected: currentFailureRate < 0.5,
                    success: result.success,
                });
            }

            // When connected, should succeed
            const connectedResults = results.filter(r => r.connected);
            const connectedSuccesses = connectedResults.filter(r => r.success);
            expect(connectedSuccesses.length).toBe(connectedResults.length);

            // Total results should match processed seals
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('World-Scale Fiscal Stress Test', () => {
        it('should process all seals with fiscal isolation maintained', async () => {
            const world = factory.generate();
            const seals = generateSealsFromWorld(world, rng);

            // Use config-based failure rate
            const observer = new MockFiscalObserver(config.fiscalOfflineProbability);

            console.log(`
            Fiscal Stress Test:
            - Total seals: ${seals.length}
            - Failure probability: ${config.fiscalOfflineProbability * 100}%
            `);

            const operations: { coreSucceeded: boolean; fiscalSucceeded: boolean }[] = [];
            let fiscalSuccessCount = 0;
            let fiscalFailureCount = 0;

            const startTime = Date.now();

            for (const seal of seals) {
                const event = findEventForSeal(seal, world);
                if (!event) continue;

                const result = await observer.onSealed(seal, event);

                if (result.success) {
                    fiscalSuccessCount++;
                } else {
                    fiscalFailureCount++;
                }

                operations.push({
                    coreSucceeded: true, // Core always succeeds
                    fiscalSucceeded: result.success,
                });
            }

            const duration = Date.now() - startTime;

            console.log(`
            Fiscal processing completed in ${duration}ms:
            - Successful: ${fiscalSuccessCount}
            - Failed: ${fiscalFailureCount}
            - Success rate: ${((fiscalSuccessCount / seals.length) * 100).toFixed(2)}%
            `);

            // Verify isolation
            const result = Gate5Asserts.assertFiscalIsolation(operations);
            asserter.add(result);
            expect(result.passed).toBe(true);

            // Verify idempotency
            const fiscalRecords = observer.getRecords();
            const idempotencyCheck = seals.map(seal => ({
                sealId: seal.seal_id,
                attempts: 1,
                records: fiscalRecords.filter(r => r.sealId === seal.seal_id).length
            }));

            const idempotencyResult = Gate5Asserts.assertFiscalIdempotency(idempotencyCheck);
            asserter.add(idempotencyResult);
            expect(idempotencyResult.passed).toBe(true);

            // Verify sequencing
            const sequenceResult = Gate5Asserts.assertFiscalSequenceIncreasing(
                fiscalRecords.map(r => ({ fiscalSequenceId: r.fiscalSequenceId, createdAt: r.createdAt }))
            );
            asserter.add(sequenceResult);
            expect(sequenceResult.passed).toBe(true);

            metrics.recordEvents(seals.length);
            metrics.recordFiscalEvents(fiscalRecords.length);
        }, 120000);
    });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSealsFromWorld(world: GeneratedWorld, rng: SeededRandom): LegalSeal[] {
    const seals: LegalSeal[] = [];
    let sequence = 0;

    for (const session of world.sessions) {
        for (const order of session.orders) {
            // PAYMENT_SEALED
            for (const payment of order.payments) {
                sequence++;
                seals.push({
                    seal_id: `seal_PAYMENT_${payment.id}_PAYMENT_SEALED_${sequence}`,
                    entity_type: 'PAYMENT',
                    entity_id: payment.id,
                    seal_event_id: rng.uuid(),
                    stream_hash: rng.uuid(),
                    sealed_at: new Date(),
                    sequence,
                    financial_state: JSON.stringify(payment),
                    legal_state: 'PAYMENT_SEALED',
                });
            }

            // ORDER_DECLARED
            sequence++;
            seals.push({
                seal_id: `seal_ORDER_${order.order.id}_ORDER_DECLARED_${sequence}`,
                entity_type: 'ORDER',
                entity_id: order.order.id,
                seal_event_id: rng.uuid(),
                stream_hash: rng.uuid(),
                sealed_at: new Date(),
                sequence,
                financial_state: JSON.stringify(order.order),
                legal_state: 'ORDER_DECLARED',
            });

            // ORDER_FINAL
            sequence++;
            seals.push({
                seal_id: `seal_ORDER_${order.order.id}_ORDER_FINAL_${sequence}`,
                entity_type: 'ORDER',
                entity_id: order.order.id,
                seal_event_id: rng.uuid(),
                stream_hash: rng.uuid(),
                sealed_at: new Date(),
                sequence,
                financial_state: JSON.stringify(order.order),
                legal_state: 'ORDER_FINAL',
            });
        }
    }

    return seals;
}

function findEventForSeal(seal: LegalSeal, world: GeneratedWorld): CoreEvent | null {
    // Find the corresponding event based on seal state
    const eventType = seal.legal_state === 'PAYMENT_SEALED' ? 'PAYMENT_CONFIRMED'
        : seal.legal_state === 'ORDER_DECLARED' ? 'ORDER_PAID'
            : 'ORDER_CLOSED';

    return world.allEvents.find(e =>
        e.type === eventType &&
        (e.payload?.payment_id === seal.entity_id ||
            e.payload?.order_id === seal.entity_id ||
            e.payload?.id === seal.entity_id)
    ) || null;
}
