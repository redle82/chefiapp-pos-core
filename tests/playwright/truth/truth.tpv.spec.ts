import { test, expect } from '@playwright/test'

const S = {
    // Landing
    landingCta: '[data-testid="onboarding-start-btn"]',
    landingAlert: '[data-testid="landing-offline-alert"]',
    landingEmail: '[data-testid="landing-email-input"]',

    // TPV
    root: '[data-testid="tpv-root"]',
    offlineBanner: '[data-testid="tpv-offline-banner"]',
    newOrderBtn: '[data-testid="tpv-new-order-btn"]',
    orderCard: '[data-testid="order-card"]',

    badgePending: '[data-testid="badge-offline-pending"]',
    badgeSyncing: '[data-testid="badge-offline-syncing"]',
    badgeApplied: '[data-testid="badge-offline-applied"]',
    badgeFailed: '[data-testid="badge-offline-failed"]',
}

// 🛑 Truth Zero & One: Onboarding Gate
test.describe('Truth Lock — Onboarding Gate', () => {
    test('Scenario Zero: Server DOWN blocks Onboarding', async ({ page }) => {
        // Mock DOWN
        await page.route('**/api/health', r =>
            r.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }) })
        )

        await page.goto('/')

        // Expect Alert & Disabled Button
        await expect(page.locator(S.landingAlert)).toBeVisible()
        await expect(page.locator(S.landingCta)).toBeDisabled()
    })

    test('Scenario One: Server UP allows Onboarding', async ({ page }) => {
        // Mock UP
        await page.route('**/api/health', r =>
            r.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }) })
        )

        await page.goto('/')

        // Expect Alert Gone
        await expect(page.locator(S.landingAlert)).not.toBeVisible()

        // Input Enabled?
        await expect(page.locator(S.landingEmail)).toBeEnabled()

        // 🟡 Type Email to enable button
        await page.locator(S.landingEmail).fill('test@chefiapp.com')

        // Expect Enabled Button
        await expect(page.locator(S.landingCta)).toBeEnabled()
    })
})

// 🛡️ Truth Two, Three, Four: TPV Offline Reconciliation
test.describe('Truth Lock — Offline Queue Reconciliation', () => {

    test.beforeEach(async ({ page }) => {
        // 🟢 Establish Origin for IDB Access
        await page.goto('/')

        // 🧹 Clear DB to prevent state leaks (run once)
        await page.evaluate(() => {
            return new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase('chefiapp_offline_queue')
                req.onsuccess = () => resolve()
                req.onerror = () => reject(req.error)
                req.onblocked = () => resolve() // If blocked, just proceed
            })
        })

        // 🛡️ Default Mock: Core DOWN (Fast load, no network hangs)
        await page.route('**/api/health', r =>
            r.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }) })
        )

        // Force TPV mount
        // Use 'commit' to avoid waiting for potentially hanging resources
        await page.goto('/app/tpv', { waitUntil: 'commit' })
        // Wait for Root Application to be ready
        await page.locator(S.root).waitFor({ state: 'visible', timeout: 30000 })
    })

    test('Scenario A: Offline → Queue → Pending Badge', async ({ page }) => {
        // Already DOWN from beforeEach
        // Just verify banner
        await expect(page.locator(S.offlineBanner)).toBeVisible()

        // Clica em ação (Enviar)
        const card = page.locator(S.orderCard).first()
        await card.locator('button').first().click()

        // Badge Pendente
        await expect(card.locator(S.badgePending)).toBeVisible()

        // Não muda de coluna (continua visível)
        await expect(card).toBeVisible()
    })

    test('Scenario B: Offline → Online → Reconcile SUCCESS', async ({ page }) => {
        // Override route for dynamic toggling
        let healthUp = false
        await page.route('**/api/health', r => {
            if (healthUp) {
                r.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }) })
            } else {
                r.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }) })
            }
        })

        // PATCH order SUCCESS
        await page.route('**/api/orders/**', r =>
            r.fulfill({ status: 200, body: '{}' })
        )

        // Reload to apply new route overrides or just ensure clean slate?
        // Route overrides apply to subsequent requests.
        // If we reload, fetch logic restarts.
        await page.reload({ waitUntil: 'commit' })
        await page.locator(S.root).waitFor()

        const card = page.locator(S.orderCard).first()
        await card.locator('button').first().click()

        await expect(card.locator(S.badgePending)).toBeVisible()

        // 🟢 Core volta
        healthUp = true
        // Force reload to trigger immediate health check/reconciler start
        await page.reload({ waitUntil: 'commit' })
        await page.locator(S.root).waitFor()

        // Espera reconciliador agir
        await expect(card.locator(S.badgeApplied)).toBeVisible({ timeout: 15000 })
    })

    test('Scenario C: Offline → Online → Reconcile FAIL', async ({ page }) => {
        let healthUp = false
        await page.route('**/api/health', r => {
            if (healthUp) {
                r.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }) })
            } else {
                r.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }) })
            }
        })

        // PATCH order FAIL
        await page.route('**/api/orders/**', r =>
            r.fulfill({ status: 500 })
        )

        await page.reload({ waitUntil: 'commit' })
        await page.locator(S.root).waitFor()

        const card = page.locator(S.orderCard).first()
        await card.locator('button').first().click()

        await expect(card.locator(S.badgePending)).toBeVisible()

        // 🟢 Core volta
        healthUp = true
        await page.reload({ waitUntil: 'commit' })
        await page.locator(S.root).waitFor()

        // 🔴 Badge erro
        await expect(card.locator(S.badgeFailed)).toBeVisible({ timeout: 15000 })

        // ↻ Manual Retry
        // Click "Tentar Novamente" (Red Button)
        const retryBtn = card.locator('[data-testid="btn-retry"]')
        await expect(retryBtn).toBeVisible()
        await retryBtn.click()

        // ⏳ Deve voltar para Pendente
        await expect(card.locator(S.badgePending)).toBeVisible()
    })

    test('Scenario D: Backoff Strategy (Protection)', async ({ page }) => {
        // 1. Start Offline (Mock DOWN)
        let healthUp = false
        await page.route('**/api/health', r => {
            if (healthUp) {
                r.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }) })
            } else {
                r.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }) })
            }
        })

        // 2. Queue Item (Offline)
        await page.reload({ waitUntil: 'commit' })
        await page.locator(S.root).waitFor()
        const card = page.locator(S.orderCard).first()
        await card.locator('button').first().click()

        // Expect Pending
        await expect(card.locator(S.badgePending)).toBeVisible()

        // 3. Go Online but Fail Orders (Trigger Backoff)
        await page.route('**/api/orders/**', r => {
            r.fulfill({ status: 500 })
        })

        healthUp = true
        await page.reload({ waitUntil: 'commit' })
        await page.locator(S.root).waitFor()

        // 1️⃣ Tentativa 1 (Imediata)
        await expect(card.locator(S.badgePending)).toBeVisible() // Ainda pendente (Backoff)

        // 2️⃣ Backoff Wait (2s + buffer)
        // Reconciler Retry 1...

        // 3️⃣ Backoff Wait (4s + buffer)
        // Reconciler Retry 2...

        // Eventually -> Hard Fail
        // Total wait approx 6s.
        // We expect eventual failure badge.
        await expect(card.locator(S.badgeFailed)).toBeVisible({ timeout: 15000 })
    })
})
