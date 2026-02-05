import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5175';
// Não iniciar webServer se: E2E_BASE_URL (app noutra porta) ou E2E_NO_WEB_SERVER (app já a correr na baseURL)
const startServer = !process.env.E2E_BASE_URL && !process.env.E2E_NO_WEB_SERVER;

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 300_000, // 5 minutes for strict ritual
    use: {
        headless: true,          // 👈 Reverted to true (Env limitation)
        slowMo: 800,              // 👈 Ritmo humano (ms entre ações)
        baseURL,
        viewport: { width: 1440, height: 900 },
        video: 'off',
    },
    ...(startServer && {
        webServer: {
            command: 'npm run dev',
            url: baseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
        },
    }),
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});
