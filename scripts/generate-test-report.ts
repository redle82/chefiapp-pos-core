#!/usr/bin/env npx ts-node
/**
 * GENERATE TEST REPORT - ChefIApp
 * 
 * Consolidates test results from seed, stress, and chaos tests into a single report.
 * 
 * Usage:
 *   npx ts-node scripts/generate-test-report.ts
 *   npx ts-node scripts/generate-test-report.ts --output=docs/testing/MASSIVE_TEST_RESULTS.md
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// =============================================================================
// TYPES
// =============================================================================

interface SeedResults {
  restaurants: Array<{ id: string; name: string }>;
  totalStaff: number;
  totalTables: number;
  totalProducts: number;
  duration: number;
  errors: string[];
}

interface StressTestResults {
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  totalItems: number;
  totalRevenueCents: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  p95LatencyMs: number;
  ordersPerSecond: number;
  duration: number;
  errors: string[];
}

interface ChaosTestResult {
  scenario: string;
  passed: boolean;
  details: string;
  metrics: Record<string, number>;
  errors: string[];
}

interface ChaosTestSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  results: ChaosTestResult[];
  duration: number;
}

interface ConsolidatedReport {
  generatedAt: string;
  overallStatus: '✅ PASS' | '⚠️ PARTIAL' | '❌ FAIL';
  summary: {
    restaurants: number;
    totalOrders: number;
    ordersLost: number;
    avgLatency: number;
    chaosScenarios: string;
  };
  seedResults?: SeedResults;
  stressResults?: StressTestResults;
  chaosResults?: ChaosTestSummary;
  recommendations: string[];
  errors: string[];
  successCriteria: Record<string, boolean>;
}

// =============================================================================
// FILE READING
// =============================================================================

function findLatestFile(directory: string, pattern: RegExp): string | null {
  if (!existsSync(directory)) return null;

  const files = readdirSync(directory)
    .filter(f => pattern.test(f))
    .map(f => ({
      name: f,
      path: join(directory, f),
      mtime: readFileSync(join(directory, f), { encoding: 'utf8' }).length, // Simple heuristic
    }))
    .sort((a, b) => {
      // Extract timestamp from filename if available
      const aMatch = a.name.match(/(\d+)/);
      const bMatch = b.name.match(/(\d+)/);
      if (aMatch && bMatch) {
        return parseInt(bMatch[1], 10) - parseInt(aMatch[1], 10);
      }
      return 0;
    });

  return files.length > 0 ? files[0].path : null;
}

function loadSeedResults(): SeedResults | null {
  const testResultsDir = join(process.cwd(), 'test-results');
  const seedFile = findLatestFile(testResultsDir, /massive-seed-.*\.json$/);

  if (!seedFile) {
    console.warn('⚠️  No seed results found');
    return null;
  }

  try {
    const content = readFileSync(seedFile, 'utf8');
    return JSON.parse(content) as SeedResults;
  } catch (error) {
    console.error(`Error reading seed results: ${error}`);
    return null;
  }
}

function loadStressResults(): StressTestResults | null {
  const testResultsDir = join(process.cwd(), 'test-results');
  // Try both old format (stress-orders-*) and new format (massive-concurrent-*)
  const stressFile = findLatestFile(testResultsDir, /(stress-orders-|massive-concurrent-).*\.json$/) ||
                     findLatestFile(testResultsDir, /massive-concurrent-.*\.json$/);

  if (!stressFile) {
    console.warn('⚠️  No stress test results found');
    return null;
  }

  try {
    const content = readFileSync(stressFile, 'utf8');
    const data = JSON.parse(content);
    
    // Adapt new format (massive-concurrent-test) to old format
    if (data.phase) {
      return {
        totalOrders: data.totalOrders,
        successfulOrders: data.successfulOrders,
        failedOrders: data.failedOrders,
        totalItems: data.orderResults?.reduce((sum: number, r: any) => sum + (r.itemCount || 0), 0) || 0,
        totalRevenueCents: data.orderResults?.reduce((sum: number, r: any) => sum + (r.totalCents || 0), 0) || 0,
        avgLatencyMs: data.avgLatencyMs,
        maxLatencyMs: data.maxLatencyMs,
        minLatencyMs: 0,
        p95LatencyMs: data.p95LatencyMs,
        ordersPerSecond: data.ordersPerSecond,
        duration: data.duration,
        errors: data.errors || [],
      } as StressTestResults;
    }
    
    return data as StressTestResults;
  } catch (error) {
    console.error(`Error reading stress results: ${error}`);
    return null;
  }
}

function loadChaosResults(): ChaosTestSummary | null {
  const testResultsDir = join(process.cwd(), 'test-results');
  // Try both old format and new docker format
  const chaosFile = findLatestFile(testResultsDir, /chaos-test-.*\.json$/);

  if (!chaosFile) {
    console.warn('⚠️  No chaos test results found');
    return null;
  }

  try {
    const content = readFileSync(chaosFile, 'utf8');
    return JSON.parse(content) as ChaosTestSummary;
  } catch (error) {
    console.error(`Error reading chaos results: ${error}`);
    return null;
  }
}

function loadLifecycleResults(): any | null {
  const testResultsDir = join(process.cwd(), 'test-results');
  const lifecycleFile = findLatestFile(testResultsDir, /order-lifecycle-.*\.json$/);

  if (!lifecycleFile) {
    return null;
  }

  try {
    const content = readFileSync(lifecycleFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateReport(): ConsolidatedReport {
  const seedResults = loadSeedResults();
  const stressResults = loadStressResults();
  const chaosResults = loadChaosResults();
  const lifecycleResults = loadLifecycleResults();

  const report: ConsolidatedReport = {
    generatedAt: new Date().toISOString(),
    overallStatus: '✅ PASS',
    summary: {
      restaurants: seedResults?.restaurants.length || 0,
      totalOrders: stressResults?.totalOrders || 0,
      ordersLost: stressResults ? stressResults.totalOrders - stressResults.successfulOrders : 0,
      avgLatency: stressResults?.avgLatencyMs || 0,
      chaosScenarios: chaosResults 
        ? `${chaosResults.passedScenarios}/${chaosResults.totalScenarios} passed`
        : '0/0 passed',
    },
    seedResults: seedResults || undefined,
    stressResults: stressResults || undefined,
    chaosResults: chaosResults || undefined,
    recommendations: [],
    errors: [],
    successCriteria: {},
  };

  // Collect errors
  if (seedResults?.errors) {
    report.errors.push(...seedResults.errors.map(e => `Seed: ${e}`));
  }
  if (stressResults?.errors) {
    report.errors.push(...stressResults.errors.map(e => `Stress: ${e}`));
  }
  if (chaosResults?.results) {
    chaosResults.results.forEach(r => {
      if (!r.passed) {
        report.errors.push(`Chaos ${r.scenario}: ${r.details}`);
      }
      if (r.errors.length > 0) {
        report.errors.push(...r.errors.map(e => `Chaos ${r.scenario}: ${e}`));
      }
    });
  }

  // Evaluate success criteria
  report.successCriteria = {
    '5+ restaurants operating': (seedResults?.restaurants.length || 0) >= 5,
    '50+ orders created': (stressResults?.totalOrders || 0) >= 50,
    '0 orders lost': (stressResults?.failedOrders || 0) === 0,
    'Avg latency < 500ms': (stressResults?.avgLatencyMs || 0) < 500,
    'All chaos scenarios pass': (chaosResults?.failedScenarios || 0) === 0,
  };

  // Generate recommendations
  if (stressResults && stressResults.failedOrders > 0) {
    const failureRate = (stressResults.failedOrders / stressResults.totalOrders) * 100;
    if (failureRate > 1) {
      report.recommendations.push(
        `Order failure rate (${failureRate.toFixed(1)}%) exceeds 1% - check database constraints and RLS policies`
      );
    }
  }

  if (stressResults && stressResults.avgLatencyMs >= 500) {
    report.recommendations.push(
      `Average latency (${stressResults.avgLatencyMs.toFixed(0)}ms) exceeds 500ms - optimize database queries and indexes`
    );
  }

  if (chaosResults) {
    const failedScenarios = chaosResults.results.filter(r => !r.passed);
    if (failedScenarios.some(r => r.scenario === 'OFFLINE_MODE')) {
      report.recommendations.push('Offline mode test failed - implement better queue persistence');
    }
    if (failedScenarios.some(r => r.scenario === 'CONCURRENT_MODIFICATIONS')) {
      report.recommendations.push('Concurrent modification issues - consider optimistic locking');
    }
    if (failedScenarios.some(r => r.scenario === 'RACE_CONDITIONS')) {
      report.recommendations.push('Race conditions detected - add proper transaction isolation');
    }
  }

  // Determine overall status
  const criteriaPassed = Object.values(report.successCriteria).filter(Boolean).length;
  const totalCriteria = Object.keys(report.successCriteria).length;

  if (criteriaPassed === totalCriteria) {
    report.overallStatus = '✅ PASS';
  } else if (criteriaPassed > 0) {
    report.overallStatus = '⚠️ PARTIAL';
  } else {
    report.overallStatus = '❌ FAIL';
  }

  return report;
}

// =============================================================================
// MARKDOWN FORMATTING
// =============================================================================

function formatReportAsMarkdown(report: ConsolidatedReport): string {
  const lines: string[] = [];

  lines.push('# ChefIApp Massive Test Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push('');
  lines.push(`## Overall Status: ${report.overallStatus}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Restaurants | ${report.summary.restaurants} |`);
  lines.push(`| Total Orders | ${report.summary.totalOrders} |`);
  lines.push(`| Orders Lost | ${report.summary.ordersLost} |`);
  lines.push(`| Avg Latency | ${report.summary.avgLatency.toFixed(0)}ms |`);
  lines.push(`| Chaos Scenarios | ${report.summary.chaosScenarios} |`);
  lines.push('');

  // Seed Results
  if (report.seedResults) {
    lines.push('## Seed Results');
    lines.push('');
    lines.push(`- **Restaurants Created:** ${report.seedResults.restaurants.length}`);
    lines.push(`- **Total Staff:** ${report.seedResults.totalStaff}`);
    lines.push(`- **Total Tables:** ${report.seedResults.totalTables}`);
    lines.push(`- **Total Products:** ${report.seedResults.totalProducts}`);
    lines.push(`- **Duration:** ${(report.seedResults.duration / 1000).toFixed(2)}s`);
    lines.push('');
  }

  // Stress Test Results
  if (report.stressResults) {
    lines.push('## Stress Test Results');
    lines.push('');
    lines.push('### Orders');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Orders | ${report.stressResults.totalOrders} |`);
    const successRate = (report.stressResults.successfulOrders / report.stressResults.totalOrders) * 100;
    lines.push(`| Successful | ${report.stressResults.successfulOrders} (${successRate.toFixed(1)}%) |`);
    lines.push(`| Failed | ${report.stressResults.failedOrders} |`);
    lines.push(`| Total Items | ${report.stressResults.totalItems} |`);
    lines.push(`| Total Revenue | €${(report.stressResults.totalRevenueCents / 100).toFixed(2)} |`);
    lines.push('');
    lines.push('### Latency');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Average | ${report.stressResults.avgLatencyMs.toFixed(0)}ms |`);
    lines.push(`| Min | ${report.stressResults.minLatencyMs}ms |`);
    lines.push(`| Max | ${report.stressResults.maxLatencyMs}ms |`);
    lines.push(`| P95 | ${report.stressResults.p95LatencyMs.toFixed(0)}ms |`);
    lines.push('');
    lines.push('### Throughput');
    lines.push('');
    lines.push(`- **Orders/Second:** ${report.stressResults.ordersPerSecond.toFixed(2)}`);
    lines.push(`- **Duration:** ${(report.stressResults.duration / 1000).toFixed(2)}s`);
    lines.push('');
  }

  // Chaos Test Results
  if (report.chaosResults) {
    lines.push('## Chaos Test Results');
    lines.push('');
    lines.push('| Scenario | Status | Details |');
    lines.push('|----------|--------|---------|');
    report.chaosResults.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      lines.push(`| ${result.scenario} | ${status} | ${result.details} |`);
    });
    lines.push('');
    lines.push('### Metrics by Scenario');
    lines.push('');
    report.chaosResults.results.forEach(result => {
      lines.push(`**${result.scenario}:**`);
      lines.push('');
      if (Object.keys(result.metrics).length === 0) {
        lines.push('*(No metrics available)*');
      } else {
        Object.entries(result.metrics).forEach(([key, value]) => {
          lines.push(`- ${key}: ${value}`);
        });
      }
      lines.push('');
    });
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  // Errors
  if (report.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    report.errors.forEach(error => {
      lines.push(`- ${error}`);
    });
    lines.push('');
  }

  // Success Criteria
  lines.push('## Success Criteria');
  lines.push('');
  lines.push('| Criteria | Status |');
  lines.push('|----------|--------|');
  Object.entries(report.successCriteria).forEach(([criterion, passed]) => {
    const status = passed ? '✅' : '❌';
    lines.push(`| ${criterion} | ${status} |`);
  });
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by ChefIApp Massive Test Suite*');

  return lines.join('\n');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

function main() {
  console.log('📊 Generating Consolidated Test Report...');
  console.log('');

  const report = generateReport();
  const markdown = formatReportAsMarkdown(report);

  // Determine output path
  const outputPath = process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : join(process.cwd(), 'docs', 'testing', 'MASSIVE_TEST_RESULTS.md');

  // Ensure directory exists
  const outputDir = require('path').dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  writeFileSync(outputPath, markdown, 'utf8');

  console.log('✅ Report generated successfully!');
  console.log(`📄 Output: ${outputPath}`);
  console.log('');
  console.log(`Overall Status: ${report.overallStatus}`);
  console.log(`Restaurants: ${report.summary.restaurants}`);
  console.log(`Total Orders: ${report.summary.totalOrders}`);
  console.log(`Orders Lost: ${report.summary.ordersLost}`);
  console.log(`Chaos Scenarios: ${report.summary.chaosScenarios}`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateReport, formatReportAsMarkdown };
