import { test, expect } from '@playwright/test'
import { mockHealth, clearHealthMocks } from './fixtures/healthMock'
import { selectors } from './utils/selectors'

const wizardOk = {
  profile: { status: 'published', slug: 'demo-tpv' },
  identity_complete: true,
  menu_complete: true,
  payments_complete: true,
  design_complete: true,
  can_publish: true,
  gates: { ok: true, tier: 'pro', addons: [] },
}

async function seedWizard(page: any, payload = wizardOk) {
  await page.route('**/internal/wizard/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
}

test.describe('Truth Lock — Health & Readiness', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'demo-restaurant')
      localStorage.setItem('chefiapp_slug', 'demo-tpv')
    })
  })

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page)
    await page.unroute('**/internal/wizard/**')
  })

  test('blocks TPV Ready when health is DOWN', async ({ page, baseURL }) => {
    await mockHealth(page, 'DOWN')
    await seedWizard(page)

    await page.goto(`${baseURL}/app/tpv-ready`)

    await expect(page.locator(selectors.tpvBlockedHeading)).toBeVisible()
    await expect(page.locator(selectors.tpvEnterButton)).toBeDisabled()
  })

  test('shows ready state when health is UP and gates ok', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')
    await seedWizard(page)

    await page.goto(`${baseURL}/app/tpv-ready`)

    await expect(page.locator(selectors.tpvReadyHeading)).toBeVisible()
    await expect(page.locator(selectors.tpvEnterButton)).toBeEnabled()
  })
})
