import { test, expect } from '@playwright/test'

const CHAOS_API = 'http://localhost:3999'

test.describe('Truth Lock — Deterministic Chaos Verification', () => {
    test.use({
        baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    })

    test.skip('Chaos: Onboarding UI reflects CONTROLLED Backend Flapping', async ({ page }) => {
        // 1. Inject Chaos API Base
        await page.addInitScript((url) => {
            window.localStorage.setItem('chefiapp_api_base', url)
        }, CHAOS_API)

        console.log(`⚡ Connecting UI to Chaos Core at ${CHAOS_API}`)

        // 2. Ensure START state is DOWN (Deterministic)
        await page.request.post(`${CHAOS_API}/__set`, { data: { up: false } })
        console.log('🎮 State forced to DOWN')

        await page.goto('/')

        const alert = page.locator('[data-testid="landing-offline-alert"]')
        const btn = page.locator('[data-testid="onboarding-start-btn"]')
        const email = page.locator('[data-testid="landing-email-input"]')

        // 🔽 CHECK DOWN
        await expect(alert).toBeVisible({ timeout: 30000 })
        await expect(btn).toBeDisabled()
        console.log('✅ Captured DOWN state.')

        // 🔼 FORCE UP
        await page.request.post(`${CHAOS_API}/__set`, { data: { up: true } })
        console.log('🎮 State forced to UP')

        // Expect UP state (Banner Gone, Button Enabled after input)
        // Note: Poller might take up to 2-5s to catch it.
        await expect(alert).not.toBeVisible({ timeout: 30000 })

        // Input email to strictly enable button
        await email.fill('chaos@test.com')
        await expect(btn).toBeEnabled()
        console.log('✅ Captured UP state.')

        // 🔽 FORCE DOWN AGAIN
        await page.request.post(`${CHAOS_API}/__set`, { data: { up: false } })
        console.log('🎮 State forced to DOWN')

        await expect(alert).toBeVisible({ timeout: 30000 })
        console.log('✅ Captured RE-DOWN state. System is resilient.')
    })
})
