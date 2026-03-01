import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/playwright/audit360",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/audit360-results.json" }],
  ],
  use: {
    baseURL: process.env.AUDIT_BASE_URL || "http://127.0.0.1:5175",
    headless: process.env.HEADED ? false : true,
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No webServer hook here — start services manually for audit runs.
});
