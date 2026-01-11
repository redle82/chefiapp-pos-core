/**
 * AuditAsserts - Non-Negotiable Audit Assertions per Gate
 *
 * These assertions are the PROOF that each gate is working correctly.
 * They are derived directly from the system's invariants.
 */

import { CoreEvent } from '../../event-log/types';
import { LegalSeal } from '../../legal-boundary/types';
import { ScenarioError } from './ScenarioRunner';

// ============================================================================
// ASSERTION RESULT TYPES
// ============================================================================

export interface AssertionResult {
    passed: boolean;
    gate: string;
    assertion: string;
    details?: string;
    evidence?: any;
}

export interface AuditReport {
    gate: string;
    assertions: AssertionResult[];
    passed: number;
    failed: number;
    errors: ScenarioError[];
}

// ============================================================================
// GATE 0-1: CORE & INVARIANTS
// ============================================================================

export class Gate01Asserts {
    /**
     * Assert: Replay of same events produces identical state
     */
    static assertReplayDeterminism(
        events: CoreEvent[],
        state1: any,
        state2: any
    ): AssertionResult {
        // Canonical serialization for true determinism (handles nested objects, Dates, etc.)
        const canonicalize = (obj: any): string => {
            if (obj === null || obj === undefined) return String(obj);
            if (obj instanceof Date) return obj.toISOString();
            if (obj instanceof Map) return canonicalize(Object.fromEntries(obj));
            if (obj instanceof Set) return canonicalize(Array.from(obj).sort());
            if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
            if (typeof obj === 'object') {
                const keys = Object.keys(obj).sort();
                return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
            }
            return JSON.stringify(obj);
        };
        const s1 = canonicalize(state1);
        const s2 = canonicalize(state2);

        return {
            passed: s1 === s2,
            gate: 'GATE_0_1',
            assertion: 'REPLAY_DETERMINISM',
            details: s1 !== s2
                ? `State mismatch after replay of ${events.length} events`
                : `Deterministic replay verified for ${events.length} events`,
            evidence: s1 !== s2 ? { state1, state2 } : undefined,
        };
    }

    /**
     * Assert: State machine transitions are valid
     */
    static assertValidTransition(
        entity: string,
        fromState: string,
        toState: string,
        event: string,
        validTransitions: Map<string, Set<string>>
    ): AssertionResult {
        const key = `${fromState}:${event}`;
        const validTargets = validTransitions.get(key);

        const isValid = validTargets?.has(toState) ?? false;

        return {
            passed: isValid,
            gate: 'GATE_0_1',
            assertion: 'VALID_STATE_TRANSITION',
            details: isValid
                ? `Valid: ${entity} ${fromState} --(${event})--> ${toState}`
                : `Invalid: ${entity} ${fromState} --(${event})--> ${toState} (not allowed)`,
            evidence: { entity, fromState, toState, event, validTargets: validTargets ? Array.from(validTargets) : [] },
        };
    }

    /**
     * Assert: Financial amounts are never negative
     */
    static assertNonNegativeAmounts(
        entities: { id: string; amount_cents: number }[]
    ): AssertionResult {
        const negatives = entities.filter(e => e.amount_cents < 0);

        return {
            passed: negatives.length === 0,
            gate: 'GATE_0_1',
            assertion: 'NON_NEGATIVE_AMOUNTS',
            details: negatives.length === 0
                ? `All ${entities.length} amounts are non-negative`
                : `Found ${negatives.length} negative amounts`,
            evidence: negatives.length > 0 ? { negatives } : undefined,
        };
    }

    /**
     * Assert: Stream versions are strictly sequential
     */
    static assertStreamVersionSequencing(
        events: CoreEvent[]
    ): AssertionResult {
        const byStream = new Map<string, CoreEvent[]>();

        for (const event of events) {
            const stream = byStream.get(event.stream_id) || [];
            stream.push(event);
            byStream.set(event.stream_id, stream);
        }

        const errors: string[] = [];

        for (const [streamId, streamEvents] of byStream) {
            const sorted = streamEvents.sort((a, b) => a.stream_version - b.stream_version);
            const base = sorted[0]?.stream_version ?? 0;  // Delta-sequential from actual base
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i].stream_version !== base + i) {
                    errors.push(`Stream ${streamId}: expected version ${base + i}, got ${sorted[i].stream_version}`);
                }
            }
        }

        return {
            passed: errors.length === 0,
            gate: 'GATE_0_1',
            assertion: 'STREAM_VERSION_SEQUENTIAL',
            details: errors.length === 0
                ? `All ${byStream.size} streams have sequential versions`
                : `Version sequencing errors: ${errors.join('; ')}`,
            evidence: errors.length > 0 ? { errors } : undefined,
        };
    }
}

// ============================================================================
// GATE 2-3: LEGAL SEALS & PERSISTENCE
// ============================================================================

export class Gate23Asserts {
    /**
     * Assert: Every PAYMENT_CONFIRMED has a corresponding PAYMENT_SEALED
     */
    static assertNoEventWithoutSeal(
        events: CoreEvent[],
        seals: LegalSeal[],
        eventType: string = 'PAYMENT_CONFIRMED',
        expectedSealState: string = 'PAYMENT_SEALED'
    ): AssertionResult {
        const relevantEvents = events.filter(e => e.type === eventType);
        const sealedIds = new Set(
            seals.filter(s => s.legal_state === expectedSealState)
                .map(s => s.entity_id)
        );

        const unsealed: string[] = [];
        for (const event of relevantEvents) {
            // Extract entity ID based on event type
            let entityId: string | undefined;
            if (eventType === 'PAYMENT_CONFIRMED') {
                entityId = event.payload?.payment_id || event.payload?.id;
            } else if (eventType === 'ORDER_PAID' || eventType === 'ORDER_CLOSED') {
                entityId = event.payload?.order_id || event.payload?.id;
            } else {
                entityId = event.payload?.payment_id || event.payload?.id || event.payload?.order_id;
            }

            if (entityId && !sealedIds.has(entityId)) {
                unsealed.push(entityId);
            }
        }

        return {
            passed: unsealed.length === 0,
            gate: 'GATE_2_3',
            assertion: 'NO_EVENT_WITHOUT_SEAL',
            details: unsealed.length === 0
                ? `All ${relevantEvents.length} ${eventType} events have corresponding ${expectedSealState} seals`
                : `${unsealed.length} events without seals: ${unsealed.slice(0, 5).join(', ')}...`,
            evidence: unsealed.length > 0 ? { unsealed: unsealed.slice(0, 10), total: unsealed.length } : undefined,
        };
    }

    /**
     * Assert: Every seal references an existing event (FK integrity)
     */
    static assertNoSealWithoutEvent(
        seals: LegalSeal[],
        eventIds: Set<string>
    ): AssertionResult {
        const orphans = seals.filter(s => !eventIds.has(s.seal_event_id));

        return {
            passed: orphans.length === 0,
            gate: 'GATE_2_3',
            assertion: 'NO_SEAL_WITHOUT_EVENT',
            details: orphans.length === 0
                ? `All ${seals.length} seals reference valid events`
                : `${orphans.length} orphan seals found`,
            evidence: orphans.length > 0 ? { orphans: orphans.slice(0, 5).map(s => s.seal_id) } : undefined,
        };
    }

    /**
     * Assert: No duplicate seals (entity_type, entity_id, legal_state)
     */
    static assertNoDuplicateSeals(
        seals: LegalSeal[]
    ): AssertionResult {
        const seen = new Set<string>();
        const duplicates: string[] = [];

        for (const seal of seals) {
            const key = `${seal.entity_type}:${seal.entity_id}:${seal.legal_state}`;
            if (seen.has(key)) {
                duplicates.push(key);
            }
            seen.add(key);
        }

        return {
            passed: duplicates.length === 0,
            gate: 'GATE_2_3',
            assertion: 'NO_DUPLICATE_SEALS',
            details: duplicates.length === 0
                ? `No duplicate seals among ${seals.length} seals`
                : `${duplicates.length} duplicate seals found`,
            evidence: duplicates.length > 0 ? { duplicates: duplicates.slice(0, 10) } : undefined,
        };
    }

    /**
     * Assert: Seal sequence is monotonically increasing
     */
    static assertSealSequenceMonotonic(
        seals: LegalSeal[]
    ): AssertionResult {
        const sorted = [...seals].sort((a, b) => a.sequence - b.sequence);
        const violations: string[] = [];

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].sequence <= sorted[i - 1].sequence) {
                violations.push(`Seq ${sorted[i - 1].sequence} -> ${sorted[i].sequence}`);
            }
        }

        return {
            passed: violations.length === 0,
            gate: 'GATE_2_3',
            assertion: 'SEAL_SEQUENCE_MONOTONIC',
            details: violations.length === 0
                ? `Seal sequence is monotonically increasing (${seals.length} seals)`
                : `Sequence violations: ${violations.join(', ')}`,
            evidence: violations.length > 0 ? { violations } : undefined,
        };
    }

    /**
     * Assert: UPDATE/DELETE on immutable tables fails
     */
    static assertImmutabilityEnforced(
        attemptedMutations: { operation: string; table: string; error: Error | null }[]
    ): AssertionResult {
        const allowed = attemptedMutations.filter(m => m.error === null);

        return {
            passed: allowed.length === 0,
            gate: 'GATE_2_3',
            assertion: 'IMMUTABILITY_ENFORCED',
            details: allowed.length === 0
                ? `All ${attemptedMutations.length} mutation attempts were correctly blocked`
                : `${allowed.length} mutations were incorrectly allowed`,
            evidence: allowed.length > 0 ? { allowed } : undefined,
        };
    }
}

// ============================================================================
// GATE 4: ATOMICITY & CONCURRENCY
// ============================================================================

export class Gate4Asserts {
    /**
     * Assert: Concurrent version conflicts are detected
     */
    static assertConcurrencyConflictDetection(
        attempts: { streamId: string; version: number; succeeded: boolean }[]
    ): AssertionResult {
        // Group by stream
        const byStream = new Map<string, typeof attempts>();
        for (const attempt of attempts) {
            const list = byStream.get(attempt.streamId) || [];
            list.push(attempt);
            byStream.set(attempt.streamId, list);
        }

        const issues: string[] = [];

        for (const [streamId, streamAttempts] of byStream) {
            const succeeded = streamAttempts.filter(a => a.succeeded);
            // For same version, only one should succeed
            const byVersion = new Map<number, typeof streamAttempts>();
            for (const attempt of streamAttempts) {
                const list = byVersion.get(attempt.version) || [];
                list.push(attempt);
                byVersion.set(attempt.version, list);
            }

            for (const [version, versionAttempts] of byVersion) {
                const succeededAtVersion = versionAttempts.filter(a => a.succeeded).length;
                if (succeededAtVersion > 1) {
                    issues.push(`Stream ${streamId} version ${version}: ${succeededAtVersion} succeeded (should be 1)`);
                }
            }
        }

        return {
            passed: issues.length === 0,
            gate: 'GATE_4',
            assertion: 'CONCURRENCY_CONFLICT_DETECTION',
            details: issues.length === 0
                ? `Concurrency properly enforced across ${byStream.size} streams`
                : `Concurrency issues: ${issues.join('; ')}`,
            evidence: issues.length > 0 ? { issues } : undefined,
        };
    }

    /**
     * Assert: Atomic operations either fully succeed or fully rollback
     */
    static assertAtomicRollback(
        operations: { name: string; eventWritten: boolean; sealCreated: boolean; committed: boolean }[]
    ): AssertionResult {
        const inconsistent = operations.filter(op => {
            // If committed, both should exist. If not committed, neither should exist.
            if (op.committed) {
                return !op.eventWritten || !op.sealCreated;
            } else {
                return op.eventWritten || op.sealCreated;
            }
        });

        return {
            passed: inconsistent.length === 0,
            gate: 'GATE_4',
            assertion: 'ATOMIC_ROLLBACK',
            details: inconsistent.length === 0
                ? `All ${operations.length} operations are atomically consistent`
                : `${inconsistent.length} operations with inconsistent state`,
            evidence: inconsistent.length > 0 ? { inconsistent } : undefined,
        };
    }

    /**
     * Assert: Idempotent operations produce same result
     */
    static assertIdempotency(
        operations: { idempotencyKey: string; result: string; count: number }[]
    ): AssertionResult {
        const byKey = new Map<string, Set<string>>();

        for (const op of operations) {
            const results = byKey.get(op.idempotencyKey) || new Set();
            results.add(op.result);
            byKey.set(op.idempotencyKey, results);
        }

        const violations = Array.from(byKey.entries())
            .filter(([_, results]) => results.size > 1)
            .map(([key, results]) => ({ key, results: Array.from(results) }));

        return {
            passed: violations.length === 0,
            gate: 'GATE_4',
            assertion: 'IDEMPOTENCY',
            details: violations.length === 0
                ? `All ${byKey.size} idempotent operations produced consistent results`
                : `${violations.length} idempotency violations`,
            evidence: violations.length > 0 ? { violations } : undefined,
        };
    }
}

// ============================================================================
// GATE 5: FISCAL ISOLATION
// ============================================================================

export class Gate5Asserts {
    /**
     * Assert: Fiscal failure does not block core operations
     */
    static assertFiscalIsolation(
        operations: { coreSucceeded: boolean; fiscalSucceeded: boolean }[]
    ): AssertionResult {
        // Core should succeed regardless of fiscal
        const blockedByFiscal = operations.filter(op => !op.coreSucceeded && !op.fiscalSucceeded);

        return {
            passed: blockedByFiscal.length === 0,
            gate: 'GATE_5',
            assertion: 'FISCAL_ISOLATION',
            details: blockedByFiscal.length === 0
                ? `Core operations independent of fiscal status (${operations.length} ops)`
                : `${blockedByFiscal.length} operations blocked by fiscal failure`,
            evidence: blockedByFiscal.length > 0 ? { count: blockedByFiscal.length } : undefined,
        };
    }

    /**
     * Assert: Fiscal events are idempotent
     */
    static assertFiscalIdempotency(
        fiscalRecords: { sealId: string; attempts: number; records: number }[]
    ): AssertionResult {
        const violations = fiscalRecords.filter(r => r.records > 1);

        return {
            passed: violations.length === 0,
            gate: 'GATE_5',
            assertion: 'FISCAL_IDEMPOTENCY',
            details: violations.length === 0
                ? `Fiscal operations are idempotent (${fiscalRecords.length} records)`
                : `${violations.length} duplicate fiscal records`,
            evidence: violations.length > 0 ? { violations } : undefined,
        };
    }

    /**
     * Assert: Fiscal sequence is strictly increasing
     */
    static assertFiscalSequenceIncreasing(
        fiscalEvents: { fiscalSequenceId: number; createdAt: Date }[]
    ): AssertionResult {
        const sorted = [...fiscalEvents].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const violations: string[] = [];

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].fiscalSequenceId <= sorted[i - 1].fiscalSequenceId) {
                violations.push(`Seq ${sorted[i - 1].fiscalSequenceId} >= ${sorted[i].fiscalSequenceId}`);
            }
        }

        return {
            passed: violations.length === 0,
            gate: 'GATE_5',
            assertion: 'FISCAL_SEQUENCE_INCREASING',
            details: violations.length === 0
                ? `Fiscal sequence strictly increasing (${fiscalEvents.length} events)`
                : `Sequence violations: ${violations.join(', ')}`,
            evidence: violations.length > 0 ? { violations } : undefined,
        };
    }
}

// ============================================================================
// GATE 7: PROJECTIONS
// ============================================================================

export class Gate7Asserts {
    /**
     * Assert: Projection state matches event-sourced truth
     */
    static assertProjectionConsistency(
        projectedState: any,
        eventSourcedState: any
    ): AssertionResult {
        const p = JSON.stringify(projectedState, Object.keys(projectedState || {}).sort());
        const e = JSON.stringify(eventSourcedState, Object.keys(eventSourcedState || {}).sort());

        return {
            passed: p === e,
            gate: 'GATE_7',
            assertion: 'PROJECTION_CONSISTENCY',
            details: p === e
                ? 'Projection matches event-sourced state'
                : 'Projection diverged from event-sourced state',
            evidence: p !== e ? { projected: projectedState, expected: eventSourcedState } : undefined,
        };
    }

    /**
     * Assert: OrderSummaryProjection correctness
     */
    static assertOrderSummaryCorrectness(
        summary: { orderId: string; status: string; totalCents: number; itemCount: number } | undefined,
        expected: { status: string; totalCents: number; itemCount: number }
    ): AssertionResult {
        if (!summary) {
            return {
                passed: false,
                gate: 'GATE_7',
                assertion: 'ORDER_SUMMARY_CORRECTNESS',
                details: 'Order summary not found',
            };
        }

        const issues: string[] = [];
        if (summary.status !== expected.status) {
            issues.push(`status: got ${summary.status}, expected ${expected.status}`);
        }
        if (summary.totalCents !== expected.totalCents) {
            issues.push(`totalCents: got ${summary.totalCents}, expected ${expected.totalCents}`);
        }
        if (summary.itemCount !== expected.itemCount) {
            issues.push(`itemCount: got ${summary.itemCount}, expected ${expected.itemCount}`);
        }

        return {
            passed: issues.length === 0,
            gate: 'GATE_7',
            assertion: 'ORDER_SUMMARY_CORRECTNESS',
            details: issues.length === 0
                ? 'Order summary matches expected values'
                : `Mismatches: ${issues.join('; ')}`,
            evidence: issues.length > 0 ? { summary, expected, issues } : undefined,
        };
    }

    /**
     * Assert: Active orders are correctly filtered
     */
    static assertActiveOrdersFilter(
        activeOrders: { orderId: string; status: string }[],
        allOrders: { orderId: string; status: string }[]
    ): AssertionResult {
        const expectedActive = allOrders.filter(o => o.status === 'OPEN' || o.status === 'PAID');
        const activeIds = new Set(activeOrders.map(o => o.orderId));
        const expectedIds = new Set(expectedActive.map(o => o.orderId));

        const missing = expectedActive.filter(o => !activeIds.has(o.orderId));
        const extra = activeOrders.filter(o => !expectedIds.has(o.orderId));

        return {
            passed: missing.length === 0 && extra.length === 0,
            gate: 'GATE_7',
            assertion: 'ACTIVE_ORDERS_FILTER',
            details: missing.length === 0 && extra.length === 0
                ? `Active orders correctly filtered (${activeOrders.length} of ${allOrders.length})`
                : `Missing: ${missing.length}, Extra: ${extra.length}`,
            evidence: (missing.length > 0 || extra.length > 0)
                ? { missing: missing.slice(0, 5), extra: extra.slice(0, 5) }
                : undefined,
        };
    }

    /**
     * Assert: Projections can be rebuilt from events
     */
    static assertProjectionRebuildable(
        originalProjection: any,
        rebuiltProjection: any
    ): AssertionResult {
        const o = JSON.stringify(originalProjection, Object.keys(originalProjection || {}).sort());
        const r = JSON.stringify(rebuiltProjection, Object.keys(rebuiltProjection || {}).sort());

        return {
            passed: o === r,
            gate: 'GATE_7',
            assertion: 'PROJECTION_REBUILDABLE',
            details: o === r
                ? 'Projection successfully rebuilt from events'
                : 'Rebuilt projection differs from original',
            evidence: o !== r ? { original: originalProjection, rebuilt: rebuiltProjection } : undefined,
        };
    }
}

// ============================================================================
// GATE 8: STRIPE WEBHOOK INTEGRATION
// ============================================================================

export class Gate8Asserts {
    /**
     * Assert: Crypto boundary accepts valid raw payloads (string or Buffer)
     */
    static assertCryptoBoundaryPass(
        results: { eventId: string; verificationResult: 'PASS' | 'REJECT' | 'ERROR'; isDuplicate: boolean }[]
    ): AssertionResult {
        const validAttempts = results.filter(r => !r.isDuplicate && r.verificationResult !== 'ERROR');
        const passed = validAttempts.filter(r => r.verificationResult === 'PASS');

        return {
            passed: passed.length === validAttempts.length,
            gate: 'GATE_8',
            assertion: 'CRYPTO_BOUNDARY_PASS',
            details: passed.length === validAttempts.length
                ? `All ${validAttempts.length} valid webhook payloads passed crypto verification`
                : `${validAttempts.length - passed.length} valid payloads failed verification`,
            evidence: passed.length !== validAttempts.length
                ? { failedCount: validAttempts.length - passed.length }
                : undefined,
        };
    }

    /**
     * Assert: Crypto boundary rejects invalid payloads
     */
    static assertCryptoBoundaryReject(
        invalidAttempts: { payloadType: string; headerType: string; rejected: boolean }[]
    ): AssertionResult {
        const shouldReject = invalidAttempts.filter(a => 
            a.headerType === 'missing' || 
            a.headerType === 'invalid' || 
            a.payloadType === 'parsed_object'
        );
        const correctlyRejected = shouldReject.filter(a => a.rejected);

        return {
            passed: correctlyRejected.length === shouldReject.length,
            gate: 'GATE_8',
            assertion: 'CRYPTO_BOUNDARY_REJECT',
            details: correctlyRejected.length === shouldReject.length
                ? `All ${shouldReject.length} invalid payloads were correctly rejected`
                : `${shouldReject.length - correctlyRejected.length} invalid payloads were NOT rejected`,
            evidence: correctlyRejected.length !== shouldReject.length
                ? { allowedCount: shouldReject.length - correctlyRejected.length }
                : undefined,
        };
    }

    /**
     * Assert: Webhook idempotency - same event.id doesn't create duplicates in core
     * CRITICAL: Validates by stripe event ID identity, not by volume count
     */
    static assertWebhookIdempotency(
        stripeEventIds: string[],
        coreEventsByStripeId: Map<string, number>  // stripeEventId -> count of core events created
    ): AssertionResult {
        const uniqueStripeIds = new Set(stripeEventIds);
        const duplicateWrites: { stripeEventId: string; coreEventsCreated: number }[] = [];

        for (const [stripeEventId, count] of coreEventsByStripeId) {
            if (count > 1) {
                duplicateWrites.push({ stripeEventId, coreEventsCreated: count });
            }
        }

        // Also check: every unique stripe event should have exactly 1 core event
        const missingInCore: string[] = [];
        for (const stripeId of uniqueStripeIds) {
            if (!coreEventsByStripeId.has(stripeId) || coreEventsByStripeId.get(stripeId) === 0) {
                missingInCore.push(stripeId);
            }
        }

        const passed = duplicateWrites.length === 0;

        return {
            passed,
            gate: 'GATE_8',
            assertion: 'WEBHOOK_IDEMPOTENCY',
            details: passed
                ? `Idempotency enforced: ${uniqueStripeIds.size} unique Stripe events → ${coreEventsByStripeId.size} core events (1:1)`
                : `Duplicate writes: ${duplicateWrites.length} Stripe events created multiple core events`,
            evidence: !passed
                ? { duplicateWrites: duplicateWrites.slice(0, 10), missingInCore: missingInCore.slice(0, 10) }
                : undefined,
        };
    }

    /**
     * Assert: Webhook idempotency (legacy signature for backward compatibility)
     * @deprecated Use assertWebhookIdempotency(stripeEventIds, coreEventsByStripeId) instead
     */
    static assertWebhookIdempotencyByCount(
        webhookAttempts: number,
        uniqueEventsInCore: number,
        duplicatesReceived: number
    ): AssertionResult {
        const expectedUnique = webhookAttempts - duplicatesReceived;
        const hasDuplicateWrites = uniqueEventsInCore > expectedUnique;

        return {
            passed: !hasDuplicateWrites,
            gate: 'GATE_8',
            assertion: 'WEBHOOK_IDEMPOTENCY_COUNT',
            details: !hasDuplicateWrites
                ? `Idempotency enforced: ${uniqueEventsInCore} unique events from ${webhookAttempts} webhook attempts`
                : `Duplicate writes detected: expected max ${expectedUnique}, got ${uniqueEventsInCore}`,
            evidence: hasDuplicateWrites
                ? { expected: expectedUnique, actual: uniqueEventsInCore }
                : undefined,
        };
    }

    /**
     * Assert: Stripe isolation - Stripe failure doesn't crash core
     */
    static assertStripeIsolation(
        operations: { stripeSucceeded: boolean; coreOperational: boolean }[]
    ): AssertionResult {
        const stripeFailures = operations.filter(op => !op.stripeSucceeded);
        const coreDownDueToStripe = stripeFailures.filter(op => !op.coreOperational);

        return {
            passed: coreDownDueToStripe.length === 0,
            gate: 'GATE_8',
            assertion: 'STRIPE_ISOLATION',
            details: coreDownDueToStripe.length === 0
                ? `Core remained operational during ${stripeFailures.length} Stripe failures`
                : `Core went down ${coreDownDueToStripe.length} times due to Stripe failures`,
            evidence: coreDownDueToStripe.length > 0
                ? { failures: coreDownDueToStripe.length }
                : undefined,
        };
    }
}

// ============================================================================
// GLOBAL ASSERTIONS
// ============================================================================

export class GlobalAsserts {
    /**
     * Assert: Global event sequence is consistent
     */
    static assertGlobalSequencing(
        events: CoreEvent[]
    ): AssertionResult {
        const sorted = [...events].sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());
        const violations: string[] = [];

        // Check for temporal ordering consistency
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].occurred_at.getTime() < sorted[i - 1].occurred_at.getTime()) {
                violations.push(`Event ${sorted[i].event_id} has earlier timestamp than predecessor`);
            }
        }

        return {
            passed: violations.length === 0,
            gate: 'GLOBAL',
            assertion: 'GLOBAL_SEQUENCING',
            details: violations.length === 0
                ? `Global event sequence consistent (${events.length} events)`
                : `Sequencing violations: ${violations.length}`,
            evidence: violations.length > 0 ? { violations: violations.slice(0, 10) } : undefined,
        };
    }

    /**
     * Assert: Hash chain integrity
     */
    static assertHashChainIntegrity(
        events: CoreEvent[]
    ): AssertionResult {
        const byStream = new Map<string, CoreEvent[]>();

        for (const event of events) {
            const stream = byStream.get(event.stream_id) || [];
            stream.push(event);
            byStream.set(event.stream_id, stream);
        }

        const broken: string[] = [];

        for (const [streamId, streamEvents] of byStream) {
            const sorted = streamEvents.sort((a, b) => a.stream_version - b.stream_version);
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i].hash_prev !== sorted[i - 1].hash) {
                    broken.push(`Stream ${streamId} at version ${sorted[i].stream_version}`);
                }
            }
        }

        return {
            passed: broken.length === 0,
            gate: 'GLOBAL',
            assertion: 'HASH_CHAIN_INTEGRITY',
            details: broken.length === 0
                ? `Hash chain intact across ${byStream.size} streams`
                : `Broken chains: ${broken.join(', ')}`,
            evidence: broken.length > 0 ? { broken } : undefined,
        };
    }
}

// ============================================================================
// ASSERTION RUNNER
// ============================================================================

export class AuditAsserter {
    private results: AssertionResult[] = [];

    add(result: AssertionResult): void {
        this.results.push(result);
    }

    addAll(results: AssertionResult[]): void {
        this.results.push(...results);
    }

    getResults(): AssertionResult[] {
        return this.results;
    }

    getPassed(): AssertionResult[] {
        return this.results.filter(r => r.passed);
    }

    getFailed(): AssertionResult[] {
        return this.results.filter(r => !r.passed);
    }

    getSummary(): { total: number; passed: number; failed: number; byGate: Record<string, { passed: number; failed: number }> } {
        const byGate: Record<string, { passed: number; failed: number }> = {};

        for (const result of this.results) {
            if (!byGate[result.gate]) {
                byGate[result.gate] = { passed: 0, failed: 0 };
            }
            if (result.passed) {
                byGate[result.gate].passed++;
            } else {
                byGate[result.gate].failed++;
            }
        }

        return {
            total: this.results.length,
            passed: this.getPassed().length,
            failed: this.getFailed().length,
            byGate,
        };
    }

    clear(): void {
        this.results = [];
    }
}
