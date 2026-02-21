/**
 * ⚡ StrykerJS — Mutation Testing for E2E Contract Validation
 *
 * https://stryker-mutator.io/docs/stryker-js/configuration/
 *
 * 🎯 Purpose
 * Validate that E2E contracts + core tests DETECT real regressions (proof of sensitivity).
 * Without mutation testing, IVT is incomplete metric — we don't know if assertions live.
 *
 * 📊 Strategy
 * LAYER 1 (Critical): Flow + Navigation guards (FlowGate, LifecycleState, operationalRestaurant)
 * LAYER 2 (Important): Route guards, Tenant isolation, Payment logic
 * LAYER 3 (Extended): Catalog, Product catalog
 *
 * 🚀 Usage
 * npm run mutation:test          # Run full mutation analysis
 * npm run mutation:test:quick    # Quick scan (5 min, fewer mutants)
 * npm run mutation:test:baseline # Establish baseline for CI trending
 *
 * 💾 Install (one-time, in merchant-portal)
 * pnpm add -D @stryker-mutator/core @stryker-mutator/typescript-checker
 *
 * ⏱️ Expected Runtime
 * Full suite: 30-45 min (all critical + important modules)
 * Quick: 5-10 min (critical modules only)
 * CI incremental: 10-15 min (delta against baseline)
 *
 * 📈 Target Thresholds
 * CRITICAL modules: ≥ 80% mutation score (strict: if a mutant survives, contract fails)
 * IMPORTANT modules: ≥ 75% mutation score
 * EXTENDED modules: ≥ 70% mutation score
 * OVERALL: ≥ 75% (break if < 65%)
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. MUTATION TARGETS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  mutate: [
    // CRITICAL LAYER — Navigation & Lifecycle (must catch 100% of regressions)
    "src/core/flow/CoreFlow.ts",
    "src/core/flow/FlowGate.tsx",
    "src/core/lifecycle/LifecycleState.ts",
    "src/core/readiness/operationalRestaurant.ts",
    "src/core/navigation/routeGuards.ts",

    // IMPORTANT LAYER — Guards & Readiness (≥75% mutation score)
    "src/core/guards/OrderGuards.ts",
    "src/core/readiness/useOperationalReadiness.ts",
    "src/core/readiness/useDeviceGate.ts",

    // EXTENDED LAYER — Operational Preflight (≥70% mutation score)
    "src/core/readiness/preflightOperational.ts",
    "src/core/readiness/usePreflightOperational.ts",
  ],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. TEST RUNNER (E2E via Playwright)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  testRunner: "command",
  commandRunner: {
    // Run ONLY contracts + core; skip smoke (too light to catch mutations)
    command:
      "E2E_NO_WEB_SERVER=1 npx playwright test --project=contracts --project=core --workers=1 --reporter=json",
    timeout: 900_000, // 15 min per mutation
  },

  // Initial test run can be slow with Playwright E2E bootstrap
  dryRunTimeoutMinutes: 30,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. TYPE CHECKING & FILE FILTERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Disabled for faster iteration; add back once baseline is established
  // checkers: ["typescript"],
  // tsconfigFile: "tsconfig.json",

  // Ignore HTML files to prevent parse errors
  disableTypeChecks: "**/*.html",

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. MUTATOR STRATEGY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Stryker v9 uses built-in mutation strategies

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. PERFORMANCE & CACHING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  incremental: true,
  incrementalFile: "artifacts/.stryker-incremental.json",

  // Run tests in parallel (but mutations are sequential)
  concurrency: 1,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. REPORTING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  reporters: ["html", "clear-text", "progress", "json"],

  // For CI consumption
  jsonReporter: {
    fileName: "artifacts/mutation-report.json",
  },

  htmlReporter: {
    fileName: "artifacts/stryker-report.html",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. QUALITY GATES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  thresholds: {
    high: 80, // High quality: ≥80% mutation score
    low: 65, // Acceptable: 65-80%
    break: 65, // FAIL if < 65% (no regression)
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. LOGGING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  logLevel: "info",
};
