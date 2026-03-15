import { defineConfig } from "@playwright/test";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5175";
const configDir = dirname(fileURLToPath(import.meta.url));
// Não iniciar webServer se: E2E_BASE_URL (app noutra porta) ou E2E_NO_WEB_SERVER (app já a correr na baseURL)
const startServer = !process.env.E2E_BASE_URL && !process.env.E2E_NO_WEB_SERVER;

const AUTH_STATE_PATH = "tests/e2e/.auth/pilot.json";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 300_000,
  fullyParallel: true,
  /**
   * CI hardening (per deep-research 2025-02-21):
   * - workers: 1 in CI to eliminate parallelism race conditions (shard across jobs instead)
   * - retries: 1 in CI to survive infra flakes — but treat "passed on retry" as triage signal, not success
   * - trace: on-first-retry — forensic evidence for CI failures without perf overhead on happy path
   */
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  /* Ignore legacy tests (archived) */
  testIgnore: ["**/_legacy/**"],
  /**
   * Reporters:
   * - list: human-readable console output
   * - json: machine-parseable for CI metrics, flakiness analysis, and audit scripts
   * - html: rich visual report with traces/screenshots for debugging
   */
  reporter: process.env.CI
    ? [
        ["list"],
        ["json", { outputFile: "artifacts/playwright-results.json" }],
        ["html", { open: "never", outputFolder: "artifacts/playwright-html" }],
      ]
    : [["list"]],
  use: {
    headless: true,
    slowMo: 800,
    baseURL,
    viewport: { width: 1440, height: 900 },
    video: "off",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  ...(startServer && {
    webServer: {
      cwd: configDir,
      command:
        "bash -lc 'lsof -ti:5175 | xargs kill -9 2>/dev/null || true; npm run dev -- --port 5175'",
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120 * 1000,
      env: {
        ...process.env,
        VITE_DEBUG_DIRECT_FLOW: "true",
      },
    },
  }),
  projects: [
    /* Layer 0 – Setup (pilot auth, saves storageState for downstream) */
    {
      name: "setup",
      testDir: "./tests/e2e/setup",
      testMatch: /.*\.setup\.ts/,
    },
    /* Layer 1 – Smoke (fastest, runs first, no auth needed) */
    {
      name: "smoke",
      testDir: "./tests/e2e/smoke",
      use: { browserName: "chromium" },
    },
    /* Layer 2 – Contracts (route aliases, auth flow, guards) */
    {
      name: "contracts",
      testDir: "./tests/e2e/contracts",
      dependencies: ["setup"],
      use: {
        browserName: "chromium",
        storageState: AUTH_STATE_PATH,
      },
    },
    /* Logout flow: runs without setup (self-contained pilot state in test) */
    {
      name: "logout",
      testMatch: "**/contracts/logout-flow.spec.ts",
      use: { browserName: "chromium" },
    },
    /* Layer 3 – Core (the single strong E2E flow) */
    {
      name: "core",
      testDir: "./tests/e2e/core",
      dependencies: ["setup"],
      use: {
        browserName: "chromium",
        storageState: AUTH_STATE_PATH,
      },
    },
    /* P2 Soberano — validação automática do mesmo restaurant_id (login real, sem pilot) */
    {
      name: "sovereign",
      testMatch: "**/core/sovereign-restaurant-id.spec.ts",
      use: { browserName: "chromium" },
      /* Sem storageState: usa cleanPage e login real com e2e-creds.json */
    },
  ],
});
