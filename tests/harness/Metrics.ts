/**
 * Metrics - Performance and audit metrics collection
 *
 * Tracks:
 * - Throughput (events/sec, seals/sec)
 * - Latency (p50, p95, p99)
 * - Error rates
 * - Resource utilization
 */

export interface Metrics {
    // Counters
    totalEvents: number;
    totalSeals: number;
    totalFiscalRecords: number;
    totalErrors: number;
    totalRetries: number;

    // Timing
    startTime: Date;
    endTime: Date | null;
    durationMs: number;

    // Throughput
    eventsPerSecond: number;
    sealsPerSecond: number;

    // Latency (in ms)
    latency: LatencyMetrics;

    // By category
    errorsByCategory: Record<string, number>;
    eventsByType: Record<string, number>;
    sealsByState: Record<string, number>;

    // Scenarios
    scenariosRun: number;
    scenariosPassed: number;
    scenariosFailed: number;

    // Concurrency
    peakConcurrency: number;
    avgConcurrency: number;
}

export interface LatencyMetrics {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    samples: number;
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

export class MetricsCollector {
    private startTime: Date = new Date();
    private endTime: Date | null = null;

    private eventCount = 0;
    private sealCount = 0;
    private fiscalCount = 0;
    private errorCount = 0;
    private retryCount = 0;

    private latencies: number[] = [];
    private errorsByCategory: Record<string, number> = {};
    private eventsByType: Record<string, number> = {};
    private sealsByState: Record<string, number> = {};

    private scenariosRun = 0;
    private scenariosPassed = 0;
    private scenariosFailed = 0;

    private concurrencyHistory: number[] = [];
    private currentConcurrency = 0;

    // Active timers for operations
    private operationTimers: Map<string, number> = new Map();

    start(): void {
        this.startTime = new Date();
        this.endTime = null;
    }

    end(): void {
        this.endTime = new Date();
    }

    // Event tracking
    recordEvent(type: string): void {
        this.eventCount++;
        this.eventsByType[type] = (this.eventsByType[type] || 0) + 1;
    }

    recordEvents(count: number, types?: Record<string, number>): void {
        this.eventCount += count;
        if (types) {
            for (const [type, n] of Object.entries(types)) {
                this.eventsByType[type] = (this.eventsByType[type] || 0) + n;
            }
        }
    }

    // Seal tracking
    recordSeal(state: string): void {
        this.sealCount++;
        this.sealsByState[state] = (this.sealsByState[state] || 0) + 1;
    }

    recordSeals(count: number, states?: Record<string, number>): void {
        this.sealCount += count;
        if (states) {
            for (const [state, n] of Object.entries(states)) {
                this.sealsByState[state] = (this.sealsByState[state] || 0) + n;
            }
        }
    }

    // Fiscal tracking
    recordFiscalEvent(): void {
        this.fiscalCount++;
    }

    recordFiscalEvents(count: number): void {
        this.fiscalCount += count;
    }

    // Error tracking
    recordError(category: string): void {
        this.errorCount++;
        this.errorsByCategory[category] = (this.errorsByCategory[category] || 0) + 1;
    }

    recordRetry(): void {
        this.retryCount++;
    }

    // Latency tracking
    startOperation(operationId: string): void {
        this.operationTimers.set(operationId, Date.now());
        this.currentConcurrency++;
        this.concurrencyHistory.push(this.currentConcurrency);
    }

    endOperation(operationId: string): void {
        const startTime = this.operationTimers.get(operationId);
        if (startTime) {
            const latency = Date.now() - startTime;
            this.latencies.push(latency);
            this.operationTimers.delete(operationId);
        }
        this.currentConcurrency = Math.max(0, this.currentConcurrency - 1);
    }

    recordLatency(ms: number): void {
        this.latencies.push(ms);
    }

    // Scenario tracking
    startScenario(_name: string): void {
        this.scenariosRun++;
    }

    endScenario(_name: string, success: boolean): void {
        if (success) {
            this.scenariosPassed++;
        } else {
            this.scenariosFailed++;
        }
    }

    // Get computed metrics
    getMetrics(): Metrics {
        const endTime = this.endTime || new Date();
        const durationMs = endTime.getTime() - this.startTime.getTime();
        const durationSec = durationMs / 1000;

        return {
            totalEvents: this.eventCount,
            totalSeals: this.sealCount,
            totalFiscalRecords: this.fiscalCount,
            totalErrors: this.errorCount,
            totalRetries: this.retryCount,

            startTime: this.startTime,
            endTime: this.endTime,
            durationMs,

            eventsPerSecond: durationSec > 0 ? this.eventCount / durationSec : 0,
            sealsPerSecond: durationSec > 0 ? this.sealCount / durationSec : 0,

            latency: this.computeLatencyMetrics(),

            errorsByCategory: { ...this.errorsByCategory },
            eventsByType: { ...this.eventsByType },
            sealsByState: { ...this.sealsByState },

            scenariosRun: this.scenariosRun,
            scenariosPassed: this.scenariosPassed,
            scenariosFailed: this.scenariosFailed,

            peakConcurrency: this.concurrencyHistory.length > 0
                ? Math.max(...this.concurrencyHistory)
                : 0,
            avgConcurrency: this.concurrencyHistory.length > 0
                ? this.concurrencyHistory.reduce((a, b) => a + b, 0) / this.concurrencyHistory.length
                : 0,
        };
    }

    private computeLatencyMetrics(): LatencyMetrics {
        if (this.latencies.length === 0) {
            return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, samples: 0 };
        }

        const sorted = [...this.latencies].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);

        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / sorted.length,
            p50: this.percentile(sorted, 50),
            p95: this.percentile(sorted, 95),
            p99: this.percentile(sorted, 99),
            samples: sorted.length,
        };
    }

    private percentile(sorted: number[], p: number): number {
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    }

    reset(): void {
        this.startTime = new Date();
        this.endTime = null;
        this.eventCount = 0;
        this.sealCount = 0;
        this.fiscalCount = 0;
        this.errorCount = 0;
        this.retryCount = 0;
        this.latencies = [];
        this.errorsByCategory = {};
        this.eventsByType = {};
        this.sealsByState = {};
        this.scenariosRun = 0;
        this.scenariosPassed = 0;
        this.scenariosFailed = 0;
        this.concurrencyHistory = [];
        this.currentConcurrency = 0;
        this.operationTimers.clear();
    }
}

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

export interface Benchmark {
    name: string;
    iterations: number;
    warmup: number;
    run: () => Promise<void> | void;
}

export interface BenchmarkResult {
    name: string;
    iterations: number;
    totalMs: number;
    avgMs: number;
    opsPerSecond: number;
    latency: LatencyMetrics;
}

export async function runBenchmark(benchmark: Benchmark): Promise<BenchmarkResult> {
    // Warmup
    for (let i = 0; i < benchmark.warmup; i++) {
        await benchmark.run();
    }

    const latencies: number[] = [];
    const start = Date.now();

    for (let i = 0; i < benchmark.iterations; i++) {
        const opStart = Date.now();
        await benchmark.run();
        latencies.push(Date.now() - opStart);
    }

    const totalMs = Date.now() - start;
    const sorted = latencies.sort((a, b) => a - b);

    return {
        name: benchmark.name,
        iterations: benchmark.iterations,
        totalMs,
        avgMs: totalMs / benchmark.iterations,
        opsPerSecond: (benchmark.iterations / totalMs) * 1000,
        latency: {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            p50: percentile(sorted, 50),
            p95: percentile(sorted, 95),
            p99: percentile(sorted, 99),
            samples: sorted.length,
        },
    };
}

function percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

// ============================================================================
// RATE LIMITER (for controlled load testing)
// ============================================================================

export class RateLimiter {
    private lastExecution: number = 0;
    private minIntervalMs: number;

    constructor(opsPerSecond: number) {
        this.minIntervalMs = 1000 / opsPerSecond;
    }

    async throttle(): Promise<void> {
        const now = Date.now();
        const elapsed = now - this.lastExecution;

        if (elapsed < this.minIntervalMs) {
            await new Promise(resolve => setTimeout(resolve, this.minIntervalMs - elapsed));
        }

        this.lastExecution = Date.now();
    }
}
