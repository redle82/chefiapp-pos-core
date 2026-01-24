#!/usr/bin/env npx ts-node
/**
 * TEST REPORT GENERATOR - ChefIApp
 * 
 * Aggregates results from seed, stress, and chaos tests into a comprehensive report.
 * 
 * Usage:
 *   npx ts-node scripts/generate-test-report.ts
 *   npx ts-node scripts/generate-test-report.ts --output=custom-report.md
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TYPES
// =============================================================================

interface SeedResults {
  restaurants: Array<{
    id: string;
    name: string;
    staff: Array<{ id: string; name: string; role: string }>;
    tables: string[];
    products: string[];
  }>;
  totalStaff: number;
  totalTables: number;
  totalProducts: number;
  duration: number;
  errors: string[];
}

interface StressResults {
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

interface ChaosResults {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  results: Array<{
    scenario: string;
    passed: boolean;
    details: string;
    metrics: Record<string, number>;
    errors: string[];
  }>;
  duration: number;
}

interface TestReport {
  generatedAt: string;
  seed?: SeedResults;
  stress?: StressResults;
  chaos?: ChaosResults;
  summary: {
    overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
    restaurantCount: number;
    totalOrders: number;
    ordersLost: number;
    avgLatency: number;
    chaosScenariosPassed: number;
    chaosScenariosTotal: number;
    errors: string[];
    recommendations: string[];
  };
}

// =============================================================================
// FILE DISCOVERY
// =============================================================================

function findLatestFile(pattern: RegExp, directory: string): string | null {
  if (!fs.existsSync(directory)) return null;

  const files = fs.readdirSync(directory)
    .filter(f => pattern.test(f))
    .map(f => ({
      name: f,
      path: path.join(directory, f),
      mtime: fs.statSync(path.join(directory, f)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

function loadJsonFile<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateMarkdownReport(report: TestReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# ChefIApp Massive Test Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push('');

  // Overall Status
  const statusEmoji = report.summary.overallStatus === 'PASS' ? '✅' : 
                      report.summary.overallStatus === 'PARTIAL' ? '⚠️' : '❌';
  lines.push(`## Overall Status: ${statusEmoji} ${report.summary.overallStatus}`);
  lines.push('');

  // Summary Table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Restaurants | ${report.summary.restaurantCount} |`);
  lines.push(`| Total Orders | ${report.summary.totalOrders} |`);
  lines.push(`| Orders Lost | ${report.summary.ordersLost} |`);
  lines.push(`| Avg Latency | ${report.summary.avgLatency.toFixed(0)}ms |`);
  lines.push(`| Chaos Scenarios | ${report.summary.chaosScenariosPassed}/${report.summary.chaosScenariosTotal} passed |`);
  lines.push('');

  // Seed Results
  if (report.seed) {
    lines.push('## Seed Results');
    lines.push('');
    lines.push(`- **Restaurants Created:** ${report.seed.restaurants.length}`);
    lines.push(`- **Total Staff:** ${report.seed.totalStaff}`);
    lines.push(`- **Total Tables:** ${report.seed.totalTables}`);
    lines.push(`- **Total Products:** ${report.seed.totalProducts}`);
    lines.push(`- **Duration:** ${(report.seed.duration / 1000).toFixed(2)}s`);
    
    if (report.seed.errors.length > 0) {
      lines.push('');
      lines.push('**Errors:**');
      report.seed.errors.forEach(e => lines.push(`- ${e}`));
    }
    lines.push('');
  }

  // Stress Results
  if (report.stress) {
    lines.push('## Stress Test Results');
    lines.push('');
    lines.push('### Orders');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Orders | ${report.stress.totalOrders} |`);
    lines.push(`| Successful | ${report.stress.successfulOrders} (${((report.stress.successfulOrders / report.stress.totalOrders) * 100).toFixed(1)}%) |`);
    lines.push(`| Failed | ${report.stress.failedOrders} |`);
    lines.push(`| Total Items | ${report.stress.totalItems} |`);
    lines.push(`| Total Revenue | €${(report.stress.totalRevenueCents / 100).toFixed(2)} |`);
    lines.push('');

    lines.push('### Latency');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Average | ${report.stress.avgLatencyMs.toFixed(0)}ms |`);
    lines.push(`| Min | ${report.stress.minLatencyMs}ms |`);
    lines.push(`| Max | ${report.stress.maxLatencyMs}ms |`);
    lines.push(`| P95 | ${report.stress.p95LatencyMs}ms |`);
    lines.push('');

    lines.push('### Throughput');
    lines.push('');
    lines.push(`- **Orders/Second:** ${report.stress.ordersPerSecond.toFixed(2)}`);
    lines.push(`- **Duration:** ${(report.stress.duration / 1000).toFixed(2)}s`);
    
    if (report.stress.errors.length > 0) {
      lines.push('');
      lines.push('**Errors:**');
      report.stress.errors.slice(0, 10).forEach(e => lines.push(`- ${e}`));
      if (report.stress.errors.length > 10) {
        lines.push(`- ... and ${report.stress.errors.length - 10} more`);
      }
    }
    lines.push('');
  }

  // Chaos Results
  if (report.chaos) {
    lines.push('## Chaos Test Results');
    lines.push('');
    lines.push('| Scenario | Status | Details |');
    lines.push('|----------|--------|---------|');
    
    report.chaos.results.forEach(r => {
      const status = r.passed ? '✅ PASS' : '❌ FAIL';
      lines.push(`| ${r.scenario} | ${status} | ${r.details} |`);
    });
    lines.push('');

    lines.push('### Metrics by Scenario');
    lines.push('');
    
    report.chaos.results.forEach(r => {
      lines.push(`**${r.scenario}:**`);
      Object.entries(r.metrics).forEach(([k, v]) => {
        lines.push(`- ${k}: ${v}`);
      });
      lines.push('');
    });
  }

  // Recommendations
  if (report.summary.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    report.summary.recommendations.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }

  // Errors Summary
  if (report.summary.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    report.summary.errors.forEach(e => lines.push(`- ${e}`));
    lines.push('');
  }

  // Success Criteria
  lines.push('## Success Criteria');
  lines.push('');
  
  const criteria = [
    { name: '5+ restaurants operating', passed: report.summary.restaurantCount >= 5 },
    { name: '50+ orders created', passed: report.summary.totalOrders >= 50 },
    { name: '0 orders lost', passed: report.summary.ordersLost === 0 },
    { name: 'Avg latency < 500ms', passed: report.summary.avgLatency < 500 },
    { name: 'All chaos scenarios pass', passed: report.summary.chaosScenariosPassed === report.summary.chaosScenariosTotal },
  ];

  lines.push('| Criteria | Status |');
  lines.push('|----------|--------|');
  criteria.forEach(c => {
    lines.push(`| ${c.name} | ${c.passed ? '✅' : '❌'} |`);
  });
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by ChefIApp Massive Test Suite*');

  return lines.join('\n');
}

function analyzeAndRecommend(report: TestReport): string[] {
  const recommendations: string[] = [];

  // Latency analysis
  if (report.stress && report.stress.avgLatencyMs > 300) {
    recommendations.push('Consider adding database indexes for frequently queried columns');
  }
  if (report.stress && report.stress.p95LatencyMs > 1000) {
    recommendations.push('P95 latency is high - investigate slow queries or network issues');
  }

  // Order failures
  if (report.stress && report.stress.failedOrders > 0) {
    const failRate = report.stress.failedOrders / report.stress.totalOrders;
    if (failRate > 0.01) {
      recommendations.push('Order failure rate exceeds 1% - check database constraints and RLS policies');
    }
  }

  // Chaos test failures
  if (report.chaos) {
    const failedScenarios = report.chaos.results.filter(r => !r.passed);
    failedScenarios.forEach(s => {
      if (s.scenario === 'OFFLINE_MODE') {
        recommendations.push('Offline mode test failed - implement better queue persistence');
      }
      if (s.scenario === 'CONCURRENT_MODIFICATIONS') {
        recommendations.push('Concurrent modification issues - consider optimistic locking');
      }
      if (s.scenario === 'RACE_CONDITIONS') {
        recommendations.push('Race conditions detected - add proper transaction isolation');
      }
    });
  }

  // Scale recommendations
  if (report.summary.restaurantCount < 5) {
    recommendations.push('Test with more restaurants to validate multi-tenant isolation');
  }

  if (recommendations.length === 0) {
    recommendations.push('System performing well - ready for production deployment');
  }

  return recommendations;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function generateReport(outputPath?: string): Promise<void> {
  const resultsDir = path.join(process.cwd(), 'test-results');

  console.log('📊 Generating Test Report');
  console.log(`   Looking for results in: ${resultsDir}`);
  console.log('');

  // Find latest result files
  const seedFile = findLatestFile(/^massive-seed-\d+\.json$/, resultsDir);
  const stressFile = findLatestFile(/^stress-orders-\d+\.json$/, resultsDir);
  const chaosFile = findLatestFile(/^chaos-test-\d+\.json$/, resultsDir);

  console.log(`   Seed results: ${seedFile ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Stress results: ${stressFile ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Chaos results: ${chaosFile ? '✅ Found' : '❌ Not found'}`);
  console.log('');

  // Load results
  const seed = seedFile ? loadJsonFile<SeedResults>(seedFile) : null;
  const stress = stressFile ? loadJsonFile<StressResults>(stressFile) : null;
  const chaos = chaosFile ? loadJsonFile<ChaosResults>(chaosFile) : null;

  // Build report
  const report: TestReport = {
    generatedAt: new Date().toISOString(),
    seed: seed || undefined,
    stress: stress || undefined,
    chaos: chaos || undefined,
    summary: {
      overallStatus: 'PASS',
      restaurantCount: seed?.restaurants.length || 0,
      totalOrders: stress?.totalOrders || 0,
      ordersLost: stress ? stress.failedOrders : 0,
      avgLatency: stress?.avgLatencyMs || 0,
      chaosScenariosPassed: chaos?.passedScenarios || 0,
      chaosScenariosTotal: chaos?.totalScenarios || 0,
      errors: [],
      recommendations: [],
    },
  };

  // Collect all errors
  if (seed?.errors) report.summary.errors.push(...seed.errors);
  if (stress?.errors) report.summary.errors.push(...stress.errors.slice(0, 5));
  if (chaos?.results) {
    chaos.results
      .filter(r => !r.passed)
      .forEach(r => report.summary.errors.push(`Chaos ${r.scenario}: ${r.details}`));
  }

  // Determine overall status
  const hasFailures = 
    (stress && stress.failedOrders > stress.totalOrders * 0.01) ||
    (chaos && chaos.failedScenarios > 0);
  
  const hasPartialSuccess = 
    (stress && stress.successfulOrders > 0) ||
    (chaos && chaos.passedScenarios > 0);

  if (hasFailures && hasPartialSuccess) {
    report.summary.overallStatus = 'PARTIAL';
  } else if (hasFailures) {
    report.summary.overallStatus = 'FAIL';
  }

  // Generate recommendations
  report.summary.recommendations = analyzeAndRecommend(report);

  // Generate markdown
  const markdown = generateMarkdownReport(report);

  // Save report
  const reportPath = outputPath || path.join(process.cwd(), 'docs', 'testing', 'MASSIVE_TEST_RESULTS.md');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, markdown);
  console.log(`✅ Report saved to: ${reportPath}`);

  // Also save JSON version
  const jsonPath = reportPath.replace('.md', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON saved to: ${jsonPath}`);

  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 OVERALL STATUS: ${report.summary.overallStatus}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Restaurants: ${report.summary.restaurantCount}`);
  console.log(`   Orders: ${report.summary.totalOrders} (${report.summary.ordersLost} lost)`);
  console.log(`   Avg Latency: ${report.summary.avgLatency.toFixed(0)}ms`);
  console.log(`   Chaos: ${report.summary.chaosScenariosPassed}/${report.summary.chaosScenariosTotal} passed`);
  console.log('═══════════════════════════════════════════════════════════');
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): { output?: string } {
  const args: { output?: string } = {};
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--output=')) {
      args.output = arg.split('=')[1];
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node scripts/generate-test-report.ts [options]

Options:
  --output=PATH     Custom output path for the report
  --help            Show this help message

Example:
  npx ts-node scripts/generate-test-report.ts --output=./my-report.md
      `);
      process.exit(0);
    }
  }

  return args;
}

// Run if executed directly
if (require.main === module) {
  const args = parseArgs();
  generateReport(args.output)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { generateReport, TestReport };
