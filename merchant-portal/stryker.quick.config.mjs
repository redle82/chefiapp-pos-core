import baseConfig from "./stryker.config.mjs";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  ...baseConfig,

  mutate: [
    "src/core/flow/CoreFlow.ts:118-124",
    "src/core/flow/FlowGate.tsx:146-152",
    // Full deriveLifecycleState function (expanded from 86-92 → 84-101)
    "src/core/lifecycle/LifecycleState.ts:84-101",
  ],

  commandRunner: {
    ...baseConfig.commandRunner,
    // Chain Playwright E2E + Vitest unit tests.
    // If either runner fails (exit ≠ 0) → mutant killed.
    // Playwright catches FlowGate behavioral mutations; Vitest catches
    // LifecycleState branch mutations unreachable in Docker E2E.
    command:
      "E2E_NO_WEB_SERVER=1 npx playwright test --project=contracts --project=core --workers=1 --retries=1 --reporter=json && npx vitest run src/core/lifecycle/LifecycleState.test.ts --reporter=json 2>/dev/null",
    timeout: 480_000,
  },

  dryRunTimeoutMinutes: 20,
  thresholds: {
    high: 75,
    low: 60,
    break: 60,
  },
};
