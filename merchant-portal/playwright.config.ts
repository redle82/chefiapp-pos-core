import { defineConfig } from "@playwright/test";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:5175";
const configDir = dirname(fileURLToPath(import.meta.url));
// Não iniciar webServer se: E2E_BASE_URL (app noutra porta) ou E2E_NO_WEB_SERVER (app já a correr na baseURL)
const startServer = !process.env.E2E_BASE_URL && !process.env.E2E_NO_WEB_SERVER;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 300_000,
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined,
  use: {
    headless: true, // 👈 Reverted to true (Env limitation)
    slowMo: 800, // 👈 Ritmo humano (ms entre ações)
    baseURL,
    viewport: { width: 1440, height: 900 },
    video: "off",
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
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
