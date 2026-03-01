/**
 * Supreme E2E — Playwright config for multi-terminal flows
 * Command Center, TPV, KDS, Web Public, Tasks. Docker Core = authority.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "../../playwright-report" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5175",
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "command-center",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /command-center/,
    },
    {
      name: "tpv",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /order-from-tpv/,
    },
    {
      name: "kds",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /kds-status-flow/,
    },
    {
      name: "public-web",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /order-from-public-web/,
    },
    {
      name: "tasks",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /tasks-system/,
    },
    {
      name: "default",
      use: { ...devices["Desktop Chrome"] },
      testIgnore:
        /command-center|order-from-tpv|kds-status-flow|order-from-public-web|tasks-system/,
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "cd ../../merchant-portal && npm run dev",
        url: process.env.E2E_BASE_URL || "http://localhost:5175",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
