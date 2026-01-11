/**
 * ScenarioRunner - Executes test scenarios with controlled concurrency
 *
 * Provides:
 * - Worker pool management
 * - Concurrent scenario execution
 * - Error collection and categorization
 * - Progress tracking
 */

import { WorldConfig, SeededRandom } from './WorldConfig';
import { GeneratedWorld, GeneratedOrder } from './WorldFactory';
import { Metrics, MetricsCollector } from './Metrics';

// ============================================================================
// SCENARIO TYPES
// ============================================================================

export interface Scenario {
    name: string;
    description: string;
    execute: (context: ScenarioContext) => Promise<ScenarioResult>;
}

export interface ScenarioContext {
    world: GeneratedWorld;
    config: WorldConfig;
    rng: SeededRandom;
    metrics: MetricsCollector;
    // Pluggable dependencies
    eventStore?: any;
    sealStore?: any;
    fiscalStore?: any;
    projections?: any;
    transactionManager?: any;
}

export interface ScenarioResult {
    success: boolean;
    scenarioName: string;
    errors: ScenarioError[];
    duration: number;
    eventsProcessed: number;
    sealsCreated: number;
    assertionsPassed: number;
    assertionsFailed: number;
}

export interface ScenarioError {
    gate: string;
    category: ErrorCategory;
    message: string;
    stack?: string;
    context?: Record<string, any>;
}

export type ErrorCategory =
    | 'INVARIANT_VIOLATION'
    | 'SEAL_INTEGRITY'
    | 'PERSISTENCE_FAILURE'
    | 'ATOMICITY_BREACH'
    | 'FISCAL_FAILURE'
    | 'PROJECTION_MISMATCH'
    | 'CONCURRENCY_CONFLICT'
    | 'IDEMPOTENCY_FAILURE'
    | 'SEQUENCE_GAP'
    | 'UNKNOWN';

// ============================================================================
// SCENARIO RUNNER
// ============================================================================

export class ScenarioRunner {
    private config: WorldConfig;
    private metrics: MetricsCollector;
    private activeTasks: number = 0;
    private results: ScenarioResult[] = [];

    constructor(config: WorldConfig, metrics: MetricsCollector) {
        this.config = config;
        this.metrics = metrics;
    }

    /**
     * Execute multiple scenarios with controlled concurrency
     */
    async runAll(
        scenarios: Scenario[],
        context: Omit<ScenarioContext, 'metrics'>
    ): Promise<ScenarioResult[]> {
        const fullContext: ScenarioContext = {
            ...context,
            metrics: this.metrics,
        };

        const results: ScenarioResult[] = [];

        for (const scenario of scenarios) {
            const result = await this.runScenario(scenario, fullContext);
            results.push(result);
        }

        this.results = results;
        return results;
    }

    /**
     * Execute scenarios in parallel with concurrency limit
     */
    async runParallel(
        scenarios: Scenario[],
        context: Omit<ScenarioContext, 'metrics'>,
        concurrency?: number
    ): Promise<ScenarioResult[]> {
        const limit = concurrency || this.config.concurrency;
        const fullContext: ScenarioContext = {
            ...context,
            metrics: this.metrics,
        };

        const results: ScenarioResult[] = [];
        const pending: Promise<void>[] = [];

        for (const scenario of scenarios) {
            if (this.activeTasks >= limit) {
                await Promise.race(pending);
            }

            const task = this.runScenario(scenario, fullContext)
                .then(result => {
                    results.push(result);
                    this.activeTasks--;
                })
                .catch(error => {
                    results.push({
                        success: false,
                        scenarioName: scenario.name,
                        errors: [{
                            gate: 'RUNNER',
                            category: 'UNKNOWN',
                            message: error.message,
                            stack: error.stack,
                        }],
                        duration: 0,
                        eventsProcessed: 0,
                        sealsCreated: 0,
                        assertionsPassed: 0,
                        assertionsFailed: 1,
                    });
                    this.activeTasks--;
                });

            this.activeTasks++;
            pending.push(task);
        }

        await Promise.all(pending);
        this.results = results;
        return results;
    }

    private async runScenario(
        scenario: Scenario,
        context: ScenarioContext
    ): Promise<ScenarioResult> {
        const startTime = Date.now();

        try {
            this.metrics.startScenario(scenario.name);
            const result = await scenario.execute(context);
            this.metrics.endScenario(scenario.name, result.success);
            return result;
        } catch (error: any) {
            this.metrics.endScenario(scenario.name, false);
            return {
                success: false,
                scenarioName: scenario.name,
                errors: [{
                    gate: 'EXECUTION',
                    category: 'UNKNOWN',
                    message: error.message,
                    stack: error.stack,
                }],
                duration: Date.now() - startTime,
                eventsProcessed: 0,
                sealsCreated: 0,
                assertionsPassed: 0,
                assertionsFailed: 1,
            };
        }
    }

    /**
     * Execute concurrent operations simulating real-world load
     */
    async runConcurrentOperations<T>(
        operations: (() => Promise<T>)[],
        concurrency?: number
    ): Promise<{ results: T[]; errors: Error[] }> {
        const limit = concurrency || this.config.concurrency;
        const results: T[] = [];
        const errors: Error[] = [];

        // Use a simple semaphore pattern
        let running = 0;
        let index = 0;

        const runNext = async (): Promise<void> => {
            if (index >= operations.length) return;

            const currentIndex = index++;
            running++;

            try {
                const result = await operations[currentIndex]();
                results[currentIndex] = result;
            } catch (error: any) {
                errors.push(error);
            } finally {
                running--;
                await runNext();
            }
        };

        // Start initial batch
        const starters: Promise<void>[] = [];
        for (let i = 0; i < Math.min(limit, operations.length); i++) {
            starters.push(runNext());
        }

        await Promise.all(starters);

        // Wait for all to complete
        while (running > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return { results, errors };
    }

    getResults(): ScenarioResult[] {
        return this.results;
    }

    getSummary(): RunSummary {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;

        const totalEvents = this.results.reduce((sum, r) => sum + r.eventsProcessed, 0);
        const totalSeals = this.results.reduce((sum, r) => sum + r.sealsCreated, 0);
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        const errorsByGate: Record<string, number> = {};
        const errorsByCategory: Record<string, number> = {};

        for (const result of this.results) {
            for (const error of result.errors) {
                errorsByGate[error.gate] = (errorsByGate[error.gate] || 0) + 1;
                errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
            }
        }

        return {
            totalScenarios: total,
            passed,
            failed,
            totalEvents,
            totalSeals,
            totalDuration,
            eventsPerSecond: totalDuration > 0 ? (totalEvents / (totalDuration / 1000)) : 0,
            errorsByGate,
            errorsByCategory,
        };
    }
}

export interface RunSummary {
    totalScenarios: number;
    passed: number;
    failed: number;
    totalEvents: number;
    totalSeals: number;
    totalDuration: number;
    eventsPerSecond: number;
    errorsByGate: Record<string, number>;
    errorsByCategory: Record<string, number>;
}

// ============================================================================
// SCENARIO BUILDERS
// ============================================================================

export function createScenario(
    name: string,
    description: string,
    execute: (context: ScenarioContext) => Promise<ScenarioResult>
): Scenario {
    return { name, description, execute };
}

/**
 * Helper to wrap scenario execution with common error handling
 */
export async function withErrorHandling(
    scenarioName: string,
    gate: string,
    fn: () => Promise<{ eventsProcessed: number; sealsCreated: number; assertions: { passed: number; failed: number } }>
): Promise<ScenarioResult> {
    const startTime = Date.now();
    const errors: ScenarioError[] = [];

    try {
        const result = await fn();
        return {
            success: result.assertions.failed === 0,
            scenarioName,
            errors,
            duration: Date.now() - startTime,
            eventsProcessed: result.eventsProcessed,
            sealsCreated: result.sealsCreated,
            assertionsPassed: result.assertions.passed,
            assertionsFailed: result.assertions.failed,
        };
    } catch (error: any) {
        errors.push({
            gate,
            category: categorizeError(error),
            message: error.message,
            stack: error.stack,
        });

        return {
            success: false,
            scenarioName,
            errors,
            duration: Date.now() - startTime,
            eventsProcessed: 0,
            sealsCreated: 0,
            assertionsPassed: 0,
            assertionsFailed: 1,
        };
    }
}

function categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('invariant') || message.includes('invalid state')) {
        return 'INVARIANT_VIOLATION';
    }
    if (message.includes('seal') || message.includes('legal')) {
        return 'SEAL_INTEGRITY';
    }
    if (message.includes('persist') || message.includes('database') || message.includes('connection')) {
        return 'PERSISTENCE_FAILURE';
    }
    if (message.includes('atomic') || message.includes('transaction') || message.includes('rollback')) {
        return 'ATOMICITY_BREACH';
    }
    if (message.includes('fiscal') || message.includes('tax')) {
        return 'FISCAL_FAILURE';
    }
    if (message.includes('projection') || message.includes('mismatch')) {
        return 'PROJECTION_MISMATCH';
    }
    if (message.includes('concurrent') || message.includes('version') || message.includes('conflict')) {
        return 'CONCURRENCY_CONFLICT';
    }
    if (message.includes('idempoten') || message.includes('duplicate')) {
        return 'IDEMPOTENCY_FAILURE';
    }
    if (message.includes('sequence') || message.includes('gap')) {
        return 'SEQUENCE_GAP';
    }

    return 'UNKNOWN';
}

// ============================================================================
// STRESS TEST HELPERS
// ============================================================================

export interface StressTestOptions {
    duplicateProbability: number;
    delayMaxMs: number;
    concurrentWrites: number;
}

export class StressTestRunner {
    private rng: SeededRandom;
    private options: StressTestOptions;

    constructor(seed: number, options: StressTestOptions) {
        this.rng = new SeededRandom(seed);
        this.options = options;
    }

    /**
     * Generate duplicate webhook payloads for idempotency testing
     */
    generateDuplicateWebhooks<T>(
        payloads: T[]
    ): { payload: T; isDuplicate: boolean; delayMs: number }[] {
        const results: { payload: T; isDuplicate: boolean; delayMs: number }[] = [];

        for (const payload of payloads) {
            results.push({ payload, isDuplicate: false, delayMs: 0 });

            // Maybe add duplicate
            if (this.rng.shouldOccur(this.options.duplicateProbability)) {
                const delay = this.rng.nextInt(0, this.options.delayMaxMs);
                results.push({ payload, isDuplicate: true, delayMs: delay });
            }
        }

        // Shuffle to simulate out-of-order delivery
        return this.rng.shuffle(results);
    }

    /**
     * Simulate concurrent writes to the same stream
     */
    async simulateConcurrentStreamWrites(
        streamId: string,
        writeCount: number,
        writeFn: (version: number) => Promise<void>
    ): Promise<{ succeeded: number; conflicts: number }> {
        const writes = Array.from({ length: writeCount }, (_, i) => i + 1);
        const promises = writes.map(version =>
            writeFn(version)
                .then(() => ({ success: true }))
                .catch(() => ({ success: false }))
        );

        const results = await Promise.all(promises);
        const succeeded = results.filter(r => r.success).length;
        const conflicts = results.filter(r => !r.success).length;

        return { succeeded, conflicts };
    }
}
