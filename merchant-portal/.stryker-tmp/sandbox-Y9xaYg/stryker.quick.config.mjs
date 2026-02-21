import baseConfig from "./stryker.config.mjs";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  ...baseConfig,

  mutate: [
    "src/core/flow/CoreFlow.ts",
    "src/core/flow/FlowGate.tsx",
    "src/core/lifecycle/LifecycleState.ts",
  ],

  commandRunner: {
    ...baseConfig.commandRunner,
    command:
      "E2E_NO_WEB_SERVER=1 npx playwright test --project=contracts --project=core --workers=1 --retries=0 --reporter=json",
    timeout: 480_000,
  },

  dryRunTimeoutMinutes: 20,
  thresholds: {
    high: 75,
    low: 60,
    break: 60,
  },
};
