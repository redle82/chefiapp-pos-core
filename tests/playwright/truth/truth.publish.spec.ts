import { test, expect } from '@playwright/test'
import { mockHealth, clearHealthMocks } from './fixtures/healthMock'

/**
 * Truth Lock Contract Tests — PublishPage
 *
 * TRUTH: UI NEVER anticipates the Core.
 *
 * Contract requirements:
 * - Publishing blocked when health is DOWN
 * - No fake publish with setTimeout
 * - Demo mode shows explicit warning
 * - Real API call for non-demo mode
 */

const S = {
  publishButton: 'button:has-text("Publicar agora")',
  publishingState: 'button:has-text("A publicar...")',
  publishedSuccess: 'text=/Publicado/i',
  blockedError: 'text=/Publicacao bloqueada|Erro ao publicar/i',
  retryButton: 'text=/Tentar novamente/i',
  demoWarning: 'text=/Modo Demonstracao/i',
  checklist: 'text=/Checklist/i',
  checkVerifying: 'text=/A verificar.../i',
}

test.describe('Truth Lock — PublishPage Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'test-restaurant')
      localStorage.setItem('chefiapp_name', 'Test Restaurant')
      localStorage.setItem('chefiapp_slug', 'test-slug')
      localStorage.setItem('chefiapp_menu', JSON.stringify([{ name: 'Item 1', price: 10 }]))
      localStorage.setItem('chefiapp_payments_mode', 'stripe')
      localStorage.setItem('chefiapp_api_base', 'http://127.0.0.1:4173')
      // Set wizard-state to pass guards (steps format for WebCoreState)
      localStorage.setItem('wizard-state', JSON.stringify({
        steps: {
          identity: { completed: true },
          menu: { completed: true },
          payments: { completed: true }
        }
      }))
    })
  })

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page)
    await page.unroute('**/api/publish')
  })

  test('publish blocked when health is DOWN', async ({ page, baseURL }) => {
    await mockHealth(page, 'DOWN')

    await page.goto(`${baseURL}/start/publish`)

    // Wait for checklist animation
    await expect(page.locator(S.publishButton)).toBeEnabled({ timeout: 5000 })

    // Click publish
    await page.locator(S.publishButton).click()

    // Should show blocked state
    await expect(page.locator(S.blockedError)).toBeVisible({ timeout: 10000 })

    // Should offer retry
    await expect(page.locator(S.retryButton)).toBeVisible()
  })

  test('successful publish when health is UP (real API)', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Mock publish API
    let publishCalled = false
    await page.route('**/api/publish', async (route) => {
      publishCalled = true
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/start/publish`)

    // Wait for checklist animation
    await expect(page.locator(S.publishButton)).toBeEnabled({ timeout: 5000 })

    // Click publish
    await page.locator(S.publishButton).click()

    // Should show success
    await expect(page.locator(S.publishedSuccess)).toBeVisible({ timeout: 10000 })

    // Verify API was actually called
    expect(publishCalled).toBe(true)
  })

  test('demo mode shows explicit warning before publish', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await mockHealth(page, 'UP')

    await page.goto(`${baseURL}/start/publish`)

    // Wait for page load
    await expect(page.locator(S.checklist)).toBeVisible()

    // Should show demo warning
    await expect(page.locator(S.demoWarning)).toBeVisible()
  })

  test('demo mode publish is simulated (no real API)', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await mockHealth(page, 'UP')

    // Track if publish API is called
    let publishCalled = false
    await page.route('**/api/publish', async (route) => {
      publishCalled = true
      await route.fulfill({ status: 200, body: '{}', contentType: 'application/json' })
    })

    await page.goto(`${baseURL}/start/publish`)

    // Wait for checklist animation
    await expect(page.locator(S.publishButton)).toBeEnabled({ timeout: 5000 })

    // Click publish
    await page.locator(S.publishButton).click()

    // Should show success
    await expect(page.locator(S.publishedSuccess)).toBeVisible({ timeout: 10000 })

    // API should NOT be called in demo mode
    expect(publishCalled).toBe(false)
  })

  test('API error shows explicit error state with retry', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Mock failing API
    await page.route('**/api/publish', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Internal server error' }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/start/publish`)

    // Wait for checklist animation
    await expect(page.locator(S.publishButton)).toBeEnabled({ timeout: 5000 })

    // Click publish
    await page.locator(S.publishButton).click()

    // Should show error state
    await expect(page.locator(S.blockedError)).toBeVisible({ timeout: 10000 })

    // Should offer retry
    await expect(page.locator(S.retryButton)).toBeVisible()
  })
})
