/**
 * Test Harness - Main Entry Point
 *
 * Exports all harness components for use in massive tests.
 */

// Configuration
export {
    WorldConfig,
    loadWorldConfig,
    loadPilotConfig,
    loadStressConfig,
    SeededRandom,
    PaymentChannel,
} from './WorldConfig';

// World Generation
export {
    WorldFactory,
    GeneratedWorld,
    GeneratedOrder,
    GeneratedSession,
    Restaurant,
    Table,
    WorldStats,
} from './WorldFactory';

// Scenario Execution
export {
    ScenarioRunner,
    Scenario,
    ScenarioContext,
    ScenarioResult,
    ScenarioError,
    ErrorCategory,
    RunSummary,
    createScenario,
    withErrorHandling,
    StressTestRunner,
    StressTestOptions,
} from './ScenarioRunner';

// Failpoint Injection
export {
    FailpointInjector,
    FailpointError,
    isFailpointError,
    WithFailpoint,
} from './FailpointInjector';

// Audit Assertions
export {
    AssertionResult,
    AuditReport,
    Gate01Asserts,
    Gate23Asserts,
    Gate4Asserts,
    Gate5Asserts,
    Gate7Asserts,
    Gate8Asserts,
    GlobalAsserts,
    AuditAsserter,
} from './AuditAsserts';

// Metrics
export {
    Metrics,
    LatencyMetrics,
    MetricsCollector,
    Benchmark,
    BenchmarkResult,
    runBenchmark,
    RateLimiter,
} from './Metrics';

// Reporting
export {
    FullAuditReport,
    ReportMetadata,
    AuditVerdict,
    ReportWriter,
    ConsoleReporter,
} from './ReportWriter';
