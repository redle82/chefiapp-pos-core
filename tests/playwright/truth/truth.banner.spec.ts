import { test, expect } from '@playwright/test'
import { mockHealth, clearHealthMocks } from './fixtures/healthMock'

/**
 * Truth Lock Contract Tests — Core Status Banner
 *
 * TRUTH: UI ALWAYS reflects backend health status.
 *
 * Contract requirements:
 * - Banner visible when health is DOWN/DEGRADED/UNKNOWN
 * - Banner hidden when health is UP
 * - Retry button triggers health check
 * - Demo mode banner always visible
 */

const S = {
  coreBannerDown: '[data-testid="core-status-banner"]',
  coreBannerText: 'text=/Sistema indisponivel|A verificar|Sistema lento/i',
  retryButton: 'text=/Tentar novamente|Verificar/i',
  demoBanner: 'text=/Modo Demonstracao/i',
}

test.describe('Truth Lock — Core Status Banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'test-restaurant')
      localStorage.setItem('chefiapp_slug', 'test-slug')
      // Set wizard-state to pass guards (steps format for WebCoreState)
      localStorage.setItem('wizard-state', JSON.stringify({
        steps: {
          identity: { completed: true },
          menu: { completed: true },
          payments: { completed: true },
          published: true
        }
      }))
    })
  })

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page)
  })

  test('banner visible when health is DOWN', async ({ page, baseURL }) => {
    await mockHealth(page, 'DOWN')

    // Mock wizard to allow page load
    await page.route('**/internal/wizard/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: { status: 'published', slug: 'test' },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: 'pro', addons: [] },
        }),
      })
    })

    await page.goto(`${baseURL}/app/tpv-ready`)

    // Should show health status indicator
    await expect(page.locator('text=/Backend indisponivel|Sistema indisponivel|A aguardar core/i')).toBeVisible({
      timeout: 10000,
    })
  })

  test('banner hidden when health is UP', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Mock wizard
    await page.route('**/internal/wizard/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: { status: 'published', slug: 'test' },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: 'pro', addons: [] },
        }),
      })
    })

    await page.goto(`${baseURL}/app/tpv-ready`)

    // Should show ready state (health UP)
    await expect(page.locator('text=/Online e pronto|O teu TPV esta pronto/i')).toBeVisible({ timeout: 10000 })

    // Should NOT show backend unavailable warning
    await expect(page.locator('text=/Backend indisponivel/i')).not.toBeVisible()
  })

  test('demo mode banner always visible', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await mockHealth(page, 'UP')

    await page.goto(`${baseURL}/start/publish`)

    // Should show demo mode warning
    await expect(page.locator(S.demoBanner)).toBeVisible({ timeout: 10000 })
  })

  test('health transitions from DOWN to UP updates banner', async ({ page, baseURL }) => {
    let healthUp = false

    await page.route('**/api/health', async (route) => {
      if (healthUp) {
        await route.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }), contentType: 'application/json' })
      } else {
        await route.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }), contentType: 'application/json' })
      }
    })

    // Mock wizard
    await page.route('**/internal/wizard/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: { status: 'published', slug: 'test' },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: 'pro', addons: [] },
        }),
      })
    })

    await page.goto(`${baseURL}/app/tpv-ready`)

    // Should show awaiting core
    await expect(page.locator('text=/A aguardar core|Backend indisponivel/i')).toBeVisible({ timeout: 10000 })

    // Switch to UP
    healthUp = true

    // Reload to trigger new health check
    await page.reload()

    // Should now show ready
    await expect(page.locator('text=/Online e pronto|O teu TPV esta pronto/i')).toBeVisible({ timeout: 10000 })
  })
})
