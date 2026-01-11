/**
 * ReportWriter - Generates audit reports in JSON and Markdown formats
 *
 * Produces:
 * - audit-report.json (machine-readable)
 * - audit-report.md (human-readable)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Metrics } from './Metrics';
import { AssertionResult, AuditReport } from './AuditAsserts';
import { RunSummary, ScenarioResult } from './ScenarioRunner';
import { WorldConfig } from './WorldConfig';
import { WorldStats } from './WorldFactory';

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface FullAuditReport {
    metadata: ReportMetadata;
    config: WorldConfig;
    worldStats: WorldStats;
    metrics: Metrics;
    runSummary: RunSummary;
    assertions: {
        total: number;
        passed: number;
        failed: number;
        byGate: Record<string, { passed: number; failed: number }>;
        details: AssertionResult[];
    };
    scenarios: ScenarioResult[];
    verdict: AuditVerdict;
}

export interface ReportMetadata {
    generatedAt: string;
    seed: number;
    version: string;
    environment: string;
    duration: string;
}

export interface AuditVerdict {
    passed: boolean;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
    criticalIssues: string[];
    warnings: string[];
    recommendations: string[];
}

// ============================================================================
// REPORT WRITER
// ============================================================================

export class ReportWriter {
    private outputDir: string;

    constructor(outputDir: string = './audit-reports') {
        this.outputDir = outputDir;
    }

    async writeReport(
        config: WorldConfig,
        worldStats: WorldStats,
        metrics: Metrics,
        runSummary: RunSummary,
        assertions: AssertionResult[],
        scenarios: ScenarioResult[]
    ): Promise<{ jsonPath: string; mdPath: string }> {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = path.join(this.outputDir, `audit-report-${timestamp}.json`);
        const mdPath = path.join(this.outputDir, `audit-report-${timestamp}.md`);

        // Build full report
        const report = this.buildReport(config, worldStats, metrics, runSummary, assertions, scenarios);

        // Write JSON
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // Write Markdown
        fs.writeFileSync(mdPath, this.generateMarkdown(report));

        // Also write to standard names for easy access
        fs.writeFileSync(path.join(this.outputDir, 'audit-report.json'), JSON.stringify(report, null, 2));
        fs.writeFileSync(path.join(this.outputDir, 'audit-report.md'), this.generateMarkdown(report));

        return { jsonPath, mdPath };
    }

    private buildReport(
        config: WorldConfig,
        worldStats: WorldStats,
        metrics: Metrics,
        runSummary: RunSummary,
        assertions: AssertionResult[],
        scenarios: ScenarioResult[]
    ): FullAuditReport {
        const assertionsByGate: Record<string, { passed: number; failed: number }> = {};

        for (const assertion of assertions) {
            if (!assertionsByGate[assertion.gate]) {
                assertionsByGate[assertion.gate] = { passed: 0, failed: 0 };
            }
            if (assertion.passed) {
                assertionsByGate[assertion.gate].passed++;
            } else {
                assertionsByGate[assertion.gate].failed++;
            }
        }

        const verdict = this.computeVerdict(assertions, scenarios, metrics);

        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                seed: config.seed,
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'test',
                duration: `${(metrics.durationMs / 1000).toFixed(2)}s`,
            },
            config,
            worldStats,
            metrics,
            runSummary,
            assertions: {
                total: assertions.length,
                passed: assertions.filter(a => a.passed).length,
                failed: assertions.filter(a => !a.passed).length,
                byGate: assertionsByGate,
                details: assertions,
            },
            scenarios,
            verdict,
        };
    }

    private computeVerdict(
        assertions: AssertionResult[],
        scenarios: ScenarioResult[],
        metrics: Metrics
    ): AuditVerdict {
        const failedAssertions = assertions.filter(a => !a.passed);
        const failedScenarios = scenarios.filter(s => !s.success);

        const criticalIssues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for critical gate failures
        const criticalGates = ['GATE_0_1', 'GATE_2_3', 'GATE_4'];
        for (const gate of criticalGates) {
            const gateFailures = failedAssertions.filter(a => a.gate === gate);
            if (gateFailures.length > 0) {
                criticalIssues.push(`${gate}: ${gateFailures.length} critical assertion(s) failed`);
            }
        }

        // Check for non-critical failures (includes Gate 8 - Stripe)
        const nonCriticalGates = ['GATE_5', 'GATE_7', 'GATE_8', 'GLOBAL'];
        for (const gate of nonCriticalGates) {
            const gateFailures = failedAssertions.filter(a => a.gate === gate);
            if (gateFailures.length > 0) {
                warnings.push(`${gate}: ${gateFailures.length} assertion(s) failed`);
            }
        }

        // Performance recommendations
        if (metrics.eventsPerSecond < 100) {
            recommendations.push('Consider optimizing event throughput (current: ' +
                metrics.eventsPerSecond.toFixed(1) + ' events/sec)');
        }
        if (metrics.latency.p99 > 1000) {
            recommendations.push('P99 latency is high (' + metrics.latency.p99.toFixed(0) + 'ms). Review bottlenecks.');
        }
        if (metrics.totalRetries > metrics.totalEvents * 0.1) {
            recommendations.push('High retry rate. Review concurrency handling.');
        }

        // Compute grade
        let grade: 'A' | 'B' | 'C' | 'D' | 'F';
        const passRate = assertions.length > 0
            ? (assertions.length - failedAssertions.length) / assertions.length
            : 1;

        if (criticalIssues.length > 0) {
            grade = 'F';
        } else if (passRate >= 0.99 && warnings.length === 0) {
            grade = 'A';
        } else if (passRate >= 0.95) {
            grade = 'B';
        } else if (passRate >= 0.90) {
            grade = 'C';
        } else if (passRate >= 0.80) {
            grade = 'D';
        } else {
            grade = 'F';
        }

        const passed = criticalIssues.length === 0 && failedScenarios.length === 0;

        return {
            passed,
            grade,
            summary: passed
                ? `Audit PASSED with grade ${grade}. ${assertions.length} assertions, ${scenarios.length} scenarios.`
                : `Audit FAILED. ${criticalIssues.length} critical issues, ${warnings.length} warnings.`,
            criticalIssues,
            warnings,
            recommendations,
        };
    }

    private generateMarkdown(report: FullAuditReport): string {
        const lines: string[] = [];

        // Header
        lines.push('# CHEFIAPP POS CORE - Massive Audit Report');
        lines.push('');
        lines.push(`**Generated:** ${report.metadata.generatedAt}`);
        lines.push(`**Seed:** ${report.metadata.seed}`);
        lines.push(`**Duration:** ${report.metadata.duration}`);
        lines.push('');

        // Verdict Banner
        const verdictEmoji = report.verdict.passed ? '🟢' : '🔴';
        lines.push(`## ${verdictEmoji} Verdict: ${report.verdict.grade}`);
        lines.push('');
        lines.push(report.verdict.summary);
        lines.push('');

        // Critical Issues
        if (report.verdict.criticalIssues.length > 0) {
            lines.push('### Critical Issues');
            for (const issue of report.verdict.criticalIssues) {
                lines.push(`- ❌ ${issue}`);
            }
            lines.push('');
        }

        // Warnings
        if (report.verdict.warnings.length > 0) {
            lines.push('### Warnings');
            for (const warning of report.verdict.warnings) {
                lines.push(`- ⚠️ ${warning}`);
            }
            lines.push('');
        }

        // World Statistics
        lines.push('## World Simulation Statistics');
        lines.push('');
        lines.push('| Metric | Value |');
        lines.push('|--------|-------|');
        lines.push(`| Restaurants | ${report.worldStats.totalRestaurants} |`);
        lines.push(`| Tables | ${report.worldStats.totalTables} |`);
        lines.push(`| Sessions | ${report.worldStats.totalSessions} |`);
        lines.push(`| Orders | ${report.worldStats.totalOrders} |`);
        lines.push(`| Items | ${report.worldStats.totalItems} |`);
        lines.push(`| Payments | ${report.worldStats.totalPayments} |`);
        lines.push(`| Events | ${report.worldStats.totalEvents} |`);
        lines.push(`| Total Value | ${this.formatCurrency(report.worldStats.totalValueCents)} |`);
        lines.push('');

        // Performance Metrics
        lines.push('## Performance Metrics');
        lines.push('');
        lines.push('| Metric | Value |');
        lines.push('|--------|-------|');
        lines.push(`| Total Events | ${report.metrics.totalEvents.toLocaleString()} |`);
        lines.push(`| Total Seals | ${report.metrics.totalSeals.toLocaleString()} |`);
        lines.push(`| Total Fiscal Records | ${report.metrics.totalFiscalRecords.toLocaleString()} |`);
        lines.push(`| Events/Second | ${report.metrics.eventsPerSecond.toFixed(2)} |`);
        lines.push(`| Seals/Second | ${report.metrics.sealsPerSecond.toFixed(2)} |`);
        lines.push(`| Errors | ${report.metrics.totalErrors} |`);
        lines.push(`| Retries | ${report.metrics.totalRetries} |`);
        lines.push('');

        // Latency
        lines.push('### Latency Distribution');
        lines.push('');
        lines.push('| Percentile | Latency (ms) |');
        lines.push('|------------|--------------|');
        lines.push(`| Min | ${report.metrics.latency.min.toFixed(2)} |`);
        lines.push(`| P50 | ${report.metrics.latency.p50.toFixed(2)} |`);
        lines.push(`| P95 | ${report.metrics.latency.p95.toFixed(2)} |`);
        lines.push(`| P99 | ${report.metrics.latency.p99.toFixed(2)} |`);
        lines.push(`| Max | ${report.metrics.latency.max.toFixed(2)} |`);
        lines.push('');

        // Gate Assertions Summary
        lines.push('## Gate Assertions Summary');
        lines.push('');
        lines.push('| Gate | Passed | Failed | Status |');
        lines.push('|------|--------|--------|--------|');

        for (const [gate, stats] of Object.entries(report.assertions.byGate)) {
            const status = stats.failed === 0 ? '✅' : '❌';
            lines.push(`| ${gate} | ${stats.passed} | ${stats.failed} | ${status} |`);
        }
        lines.push('');

        // Failed Assertions Detail
        const failed = report.assertions.details.filter(a => !a.passed);
        if (failed.length > 0) {
            lines.push('## Failed Assertions');
            lines.push('');
            for (const assertion of failed.slice(0, 20)) { // Limit to 20
                lines.push(`### ${assertion.gate} - ${assertion.assertion}`);
                lines.push('');
                lines.push(`> ${assertion.details}`);
                if (assertion.evidence) {
                    lines.push('');
                    lines.push('```json');
                    lines.push(JSON.stringify(assertion.evidence, null, 2).slice(0, 500));
                    lines.push('```');
                }
                lines.push('');
            }
            if (failed.length > 20) {
                lines.push(`_... and ${failed.length - 20} more failures_`);
                lines.push('');
            }
        }

        // Scenario Results
        lines.push('## Scenario Results');
        lines.push('');
        lines.push(`- **Total:** ${report.runSummary.totalScenarios}`);
        lines.push(`- **Passed:** ${report.runSummary.passed}`);
        lines.push(`- **Failed:** ${report.runSummary.failed}`);
        lines.push('');

        // Errors by Category
        if (Object.keys(report.runSummary.errorsByCategory).length > 0) {
            lines.push('### Errors by Category');
            lines.push('');
            lines.push('| Category | Count |');
            lines.push('|----------|-------|');
            for (const [category, count] of Object.entries(report.runSummary.errorsByCategory)) {
                lines.push(`| ${category} | ${count} |`);
            }
            lines.push('');
        }

        // Recommendations
        if (report.verdict.recommendations.length > 0) {
            lines.push('## Recommendations');
            lines.push('');
            for (const rec of report.verdict.recommendations) {
                lines.push(`- 💡 ${rec}`);
            }
            lines.push('');
        }

        // Config Summary
        lines.push('## Test Configuration');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify({
            seed: report.config.seed,
            restaurants: report.config.restaurants,
            tablesPerRestaurant: report.config.tablesPerRestaurant,
            ordersPerRestaurant: report.config.ordersPerRestaurant,
            concurrency: report.config.concurrency,
            timezones: report.config.timezones,
            currencies: report.config.currencies,
        }, null, 2));
        lines.push('```');
        lines.push('');

        // Footer
        lines.push('---');
        lines.push('');
        lines.push('*Generated by CHEFIAPP Massive Audit Protocol*');
        lines.push('');
        lines.push('**How to reproduce:**');
        lines.push('```bash');
        lines.push(`WORLD_SEED=${report.config.seed} npm run test:massive`);
        lines.push('```');

        return lines.join('\n');
    }

    private formatCurrency(cents: number): string {
        return `€${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
}

// ============================================================================
// CONSOLE REPORTER
// ============================================================================

export class ConsoleReporter {
    static printSummary(report: FullAuditReport): void {
        console.log('\n' + '='.repeat(60));
        console.log('CHEFIAPP POS CORE - MASSIVE AUDIT SUMMARY');
        console.log('='.repeat(60));

        const verdictColor = report.verdict.passed ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';

        console.log(`\n${verdictColor}VERDICT: ${report.verdict.grade}${reset}`);
        console.log(report.verdict.summary);

        console.log('\n📊 METRICS:');
        console.log(`   Events: ${report.metrics.totalEvents.toLocaleString()} (${report.metrics.eventsPerSecond.toFixed(1)}/sec)`);
        console.log(`   Seals: ${report.metrics.totalSeals.toLocaleString()} (${report.metrics.sealsPerSecond.toFixed(1)}/sec)`);
        console.log(`   Duration: ${report.metadata.duration}`);
        console.log(`   P99 Latency: ${report.metrics.latency.p99.toFixed(2)}ms`);

        console.log('\n✅ ASSERTIONS:');
        console.log(`   Passed: ${report.assertions.passed}/${report.assertions.total}`);

        if (report.verdict.criticalIssues.length > 0) {
            console.log('\n❌ CRITICAL ISSUES:');
            for (const issue of report.verdict.criticalIssues) {
                console.log(`   - ${issue}`);
            }
        }

        if (report.verdict.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            for (const warning of report.verdict.warnings) {
                console.log(`   - ${warning}`);
            }
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }
}
