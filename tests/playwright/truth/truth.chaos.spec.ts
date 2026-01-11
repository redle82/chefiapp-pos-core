import { test, expect, Page } from '@playwright/test'

// Chaos Core base (mock flapping server). Override via CHAOS_API_BASE.
const CHAOS_API_BASE = process.env.CHAOS_API_BASE || 'http://127.0.0.1:4321'
const CHAOS_ENABLED =
  process.env.CHAOS_MODE === '1' ||
  process.env.CHAOS_MODE === 'true' ||
  process.env.CHAOS_MODE === 'on'

const S = {
  landingCta: '[data-testid="onboarding-start-btn"]',
  landingAlert: '[data-testid="landing-offline-alert"]',
  landingEmail: '[data-testid="landing-email-input"]',

  root: '[data-testid="tpv-root"]',
  offlineBanner: '[data-testid="tpv-offline-banner"]',
  newOrderBtn: '[data-testid="tpv-new-order-btn"]',
  orderCard: '[data-testid="order-card"]',
}

async function setChaosState(page: Page, next: 'UP' | 'DOWN') {
  const res = await page.request.post(`${CHAOS_API_BASE}/__set`, {
    data: { state: next },
  })
  expect(res.ok()).toBeTruthy()
}

test.describe('Truth Chaos — Core flapping honesty check', () => {
  test.skip(!CHAOS_ENABLED, 'Set CHAOS_MODE=1 to run chaos flapping checks')

  test.beforeEach(async ({ page }) => {
    // Force API base to the chaos core before any page scripts run
    await page.addInitScript((apiBase: string) => {
      localStorage.setItem('chefiapp_api_base', apiBase)
    }, CHAOS_API_BASE)
  })

  test('UI stays honest across DOWN ↔ UP flaps', async ({ page }) => {
    // Start DOWN
    await setChaosState(page, 'DOWN')
    await page.goto('/')
    await expect(page.locator(S.landingAlert)).toBeVisible()
    await expect(page.locator(S.landingCta)).toBeDisabled()

    // Flip UP and force a reload to trigger fresh health check
    await setChaosState(page, 'UP')
    await page.reload({ waitUntil: 'commit' })
    await page.locator(S.root).waitFor({ state: 'visible', timeout: 20000 })
    await expect(page.locator(S.offlineBanner)).not.toBeVisible({ timeout: 10_000 })

    // Queue an action to ensure no ghost moves occur
    const card = page.locator(S.orderCard).first()
    await card.locator('button').first().click()
    await expect(card).toBeVisible()

    // Force DOWN again and reload to validate honest gating
    await setChaosState(page, 'DOWN')
    await page.reload({ waitUntil: 'commit' })
    await page.locator(S.root).waitFor({ state: 'visible', timeout: 20000 })
    await expect(page.locator(S.offlineBanner)).toBeVisible({ timeout: 10_000 })
    await expect(page.locator(S.newOrderBtn)).toBeDisabled()
  })
})
