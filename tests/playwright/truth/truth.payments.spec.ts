import { test, expect } from '@playwright/test'
import { mockHealth, clearHealthMocks } from './fixtures/healthMock'

/**
 * Truth Lock Contract Tests — PaymentsPage
 *
 * TRUTH: UI NEVER anticipates the Core.
 *
 * Contract requirements:
 * - No fake Stripe validation
 * - Real API validation when health is UP
 * - Gating blocks validation when health is DOWN
 * - Demo mode shows explicit notice
 */

const S = {
  stripeOption: '[role="button"]:has-text("Stripe"):has-text("Cartoes")',
  demoOption: '[role="button"]:has-text("Modo demo")',
  stripeInput: 'input[placeholder*="pk_test"]',
  connectButton: 'button:has-text("Ligar Stripe")',
  validatingState: 'text=/A validar.../i',
  connectedSuccess: 'text=/Stripe ligado/i',
  errorMessage: 'text=/Sistema indisponivel|indisponivel/i',
  demoNotice: 'text=/Modo demonstracao/i',
  continueButton: 'button:has-text("Continuar")',
}

test.describe('Truth Lock — PaymentsPage Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'test-restaurant')
      localStorage.setItem('chefiapp_api_base', 'http://127.0.0.1:4173')
    })
  })

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page)
    await page.unroute('**/api/payments/**')
  })

  test('Stripe validation blocked when health is DOWN', async ({ page, baseURL }) => {
    await mockHealth(page, 'DOWN')

    await page.goto(`${baseURL}/start/payments`)

    // Select Stripe option
    await page.locator(S.stripeOption).click()

    // Enter valid key format
    await page.locator(S.stripeInput).fill('pk_test_12345')

    // Click connect
    await page.locator(S.connectButton).click()

    // Should show system unavailable error
    await expect(page.locator(S.errorMessage)).toBeVisible({ timeout: 10000 })

    // Should NOT show connected
    await expect(page.locator(S.connectedSuccess)).not.toBeVisible()
  })

  test('Stripe validation succeeds with real API when health is UP', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Mock validation API
    let validationCalled = false
    await page.route('**/api/payments/validate-stripe', async (route) => {
      validationCalled = true
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ valid: true }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/start/payments`)

    // Select Stripe option
    await page.locator(S.stripeOption).click()

    // Enter valid key format
    await page.locator(S.stripeInput).fill('pk_test_12345')

    // Click connect
    await page.locator(S.connectButton).click()

    // Should show connected
    await expect(page.locator(S.connectedSuccess)).toBeVisible({ timeout: 10000 })

    // Verify API was called
    expect(validationCalled).toBe(true)
  })

  test('demo mode shows explicit notice', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await mockHealth(page, 'UP')

    await page.goto(`${baseURL}/start/payments`)

    // Should show demo notice
    await expect(page.locator(S.demoNotice)).toBeVisible()
  })

  test('demo mode skips real validation', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await mockHealth(page, 'UP')

    // Track if validation API is called
    let validationCalled = false
    await page.route('**/api/payments/validate-stripe', async (route) => {
      validationCalled = true
      await route.fulfill({ status: 200, body: '{}', contentType: 'application/json' })
    })

    await page.goto(`${baseURL}/start/payments`)

    // Select Stripe option
    await page.locator(S.stripeOption).click()

    // Enter valid key format
    await page.locator(S.stripeInput).fill('pk_test_12345')

    // Click connect
    await page.locator(S.connectButton).click()

    // Should show connected (demo)
    await expect(page.locator(S.connectedSuccess)).toBeVisible({ timeout: 10000 })

    // API should NOT be called in demo mode
    expect(validationCalled).toBe(false)
  })

  test('invalid key format shows immediate error (no API call)', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Track if validation API is called
    let validationCalled = false
    await page.route('**/api/payments/validate-stripe', async (route) => {
      validationCalled = true
      await route.fulfill({ status: 200, body: '{}', contentType: 'application/json' })
    })

    await page.goto(`${baseURL}/start/payments`)

    // Select Stripe option
    await page.locator(S.stripeOption).click()

    // Enter INVALID key format (not starting with pk_)
    await page.locator(S.stripeInput).fill('invalid_key_format')

    // Click connect
    await page.locator(S.connectButton).click()

    // Should show format error
    await expect(page.locator('text=/chave publica/i')).toBeVisible({ timeout: 5000 })

    // API should NOT be called for invalid format
    expect(validationCalled).toBe(false)
  })

  test('API error shows explicit error message', async ({ page, baseURL }) => {
    await mockHealth(page, 'UP')

    // Mock failing API
    await page.route('**/api/payments/validate-stripe', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ message: 'Chave Stripe invalida' }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/start/payments`)

    // Select Stripe option
    await page.locator(S.stripeOption).click()

    // Enter valid key format
    await page.locator(S.stripeInput).fill('pk_test_12345')

    // Click connect
    await page.locator(S.connectButton).click()

    // Should show API error message
    await expect(page.locator('text=/Chave Stripe invalida|invalida/i')).toBeVisible({ timeout: 10000 })
  })
})
