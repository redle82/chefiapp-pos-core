import { test, expect } from '@playwright/test'
import { mockHealth, clearHealthMocks } from './fixtures/healthMock'

/**
 * Truth Lock Contract Tests — CreatingPage
 *
 * TRUTH: UI NEVER anticipates the Core.
 *
 * Contract requirements:
 * - When health is DOWN, show demo_prompt state
 * - No fake progress bars
 * - Explicit demo consent required
 * - Real API call when health is UP
 */

const S = {
  creatingSpinner: 'h1:has-text("A criar o teu espaco")',
  demoPrompt: 'h1:has-text("Sistema indisponivel")',
  demoButton: 'button:has-text("Explorar em modo demo")',
  retryButton: 'button:has-text("Tentar novamente")',
  successIndicator: 'h1:has-text("Espaco criado")',
  demoDisclaimer: 'text=/nao serao guardadas/i',
}

test.describe('Truth Lock — CreatingPage Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_user_email', 'test@example.com')
      localStorage.setItem('chefiapp_api_base', 'http://127.0.0.1:4173')
    })
  })

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page)
  })

  test('shows demo_prompt when health is DOWN (no silent fallback)', async ({ page, baseURL }) => {
    await mockHealth(page, 'DOWN')

    await page.goto(`${baseURL}/app/creating`)

    // Should show system unavailable message
    await expect(page.locator(S.demoPrompt)).toBeVisible({ timeout: 10000 })

    // Should offer explicit demo mode choice
    await expect(page.locator(S.demoButton)).toBeVisible()

    // Should offer retry option
    await expect(page.locator(S.retryButton)).toBeVisible()

    // Should explain demo mode limitations
    await expect(page.locator(S.demoDisclaimer)).toBeVisible()
  })

  test('demo mode requires explicit user consent', async ({ page, baseURL }) => {
    await mockHealth(page, 'DOWN')

    await page.goto(`${baseURL}/app/creating`)

    // Wait for demo prompt
    await expect(page.locator(S.demoPrompt)).toBeVisible({ timeout: 10000 })

    // Click demo mode button
    await page.locator(S.demoButton).click()

    // Should navigate to preview
    await expect(page).toHaveURL(/\/app\/preview/, { timeout: 5000 })

    // Verify demo mode flag was set
    const demoMode = await page.evaluate(() => localStorage.getItem('chefiapp_demo_mode'))
    expect(demoMode).toBe('true')
  })

  test('retry button attempts real API call again', async ({ page, baseURL }) => {
    let healthState: 'DOWN' | 'UP' = 'DOWN'

    await page.route('**/api/health', async (route) => {
      if (healthState === 'UP') {
        await route.fulfill({ status: 200, body: JSON.stringify({ status: 'UP' }), contentType: 'application/json' })
      } else {
        await route.fulfill({ status: 503, body: JSON.stringify({ status: 'DOWN' }), contentType: 'application/json' })
      }
    })

    // Mock the create API
    let createAttempts = 0
    await page.route('**/api/onboarding/start', async (route) => {
      createAttempts++
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          restaurant_id: 'test-123',
          session_token: 'token-123',
          slug: 'test-restaurant',
        }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/app/creating`)

    // Wait for demo prompt (health is DOWN)
    await expect(page.locator(S.demoPrompt)).toBeVisible({ timeout: 10000 })

    // Switch health to UP
    healthState = 'UP'

    // Click retry
    await page.locator(S.retryButton).click()

    // Should show success
    await expect(page.locator(S.successIndicator)).toBeVisible({ timeout: 10000 })

    // Verify API was called
    expect(createAttempts).toBeGreaterThanOrEqual(1)
  })

  test('no fake progress bars - only honest spinner', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Mock slow API
    await page.route('**/api/onboarding/start', async (route) => {
      await new Promise((r) => setTimeout(r, 500))
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ restaurant_id: 'test-123', session_token: '', slug: 'test' }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/app/creating`)

    // Should show spinner with honest message
    await expect(page.locator(S.creatingSpinner)).toBeVisible()

    // Should NOT have any percentage-based progress
    const progressText = await page.locator('text=/[0-9]+%/').count()
    expect(progressText).toBe(0)
  })
})
