import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 300_000, // 5 minutes for strict ritual
    use: {
        headless: true,          // 👈 Reverted to true (Env limitation)
        slowMo: 800,              // 👈 Ritmo humano (ms entre ações)
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:5175',
        viewport: { width: 1440, height: 900 },
        video: 'off',
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5175',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});
