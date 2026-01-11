import { test, expect } from '@playwright/test'
import { mockHealth } from './fixtures/healthMock'

/**
 * Truth Lock Contract Tests — Microcopy Audit
 *
 * TRUTH: UI NEVER makes time promises or fake success claims.
 *
 * Forbidden patterns:
 * - "em segundos" / "instant" / "imediato"
 * - "pronto em X minutos"
 * - "sucesso" without confirmation
 * - "100%" progress without completion
 * - "automaticamente" for manual actions
 */

const FORBIDDEN_PATTERNS = [
  /em segundos/i,
  /instant/i,
  /imediato/i,
  /pronto em \d/i,
  /automaticamente/i, // for user actions
  /\d+%/i, // fake progress percentages
]

const PAGES_TO_AUDIT = [
  { path: '/app', name: 'EntryPage' },
  { path: '/app/creating', name: 'CreatingPage', needsEmail: true },
  { path: '/start/publish', name: 'PublishPage', needsSetup: true },
  { path: '/start/payments', name: 'PaymentsPage', needsSetup: true },
  { path: '/app/tpv-ready', name: 'TPVReadyPage', needsSetup: true },
]

test.describe('Truth Lock — Microcopy Audit', () => {
  test.beforeEach(async ({ page }) => {
    await mockHealth(page, 'UP')
  })

  for (const pageInfo of PAGES_TO_AUDIT) {
    test(`${pageInfo.name} has no forbidden time promises`, async ({ page, baseURL }) => {
      // Setup localStorage as needed
      if (pageInfo.needsEmail) {
        await page.addInitScript(() => {
          localStorage.setItem('chefiapp_user_email', 'test@example.com')
          localStorage.setItem('chefiapp_api_base', 'http://127.0.0.1:4173')
        })
      }

      if (pageInfo.needsSetup) {
        await page.addInitScript(() => {
          localStorage.setItem('chefiapp_restaurant_id', 'test-restaurant')
          localStorage.setItem('chefiapp_name', 'Test Restaurant')
          localStorage.setItem('chefiapp_slug', 'test-slug')
          localStorage.setItem('chefiapp_menu', JSON.stringify([{ name: 'Item 1', price: 10 }]))
          localStorage.setItem('chefiapp_payments_mode', 'stripe')
          localStorage.setItem('chefiapp_api_base', 'http://127.0.0.1:4173')
        })

        // Mock wizard endpoint
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

        // Mock API endpoints for CreatingPage
        await page.route('**/api/onboarding/start', async (route) => {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              restaurant_id: 'test-123',
              session_token: 'token',
              slug: 'test',
            }),
            contentType: 'application/json',
          })
        })
      }

      await page.goto(`${baseURL}${pageInfo.path}`)

      // Wait for page to settle
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000) // Allow animations

      // Get all visible text
      const bodyText = await page.locator('body').textContent()

      // Check for forbidden patterns
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = bodyText?.match(pattern)
        if (match) {
          // Allow percentages only in specific contexts
          if (pattern.source === '\\d+%' && match[0]) {
            // Skip if it's a style percentage (opacity, etc)
            const styleContext = await page.evaluate((text) => {
              const el = document.body
              return el.innerHTML.includes(`style="`) && el.innerHTML.includes(text)
            }, match[0])
            if (styleContext) continue
          }

          test.fail(true, `Found forbidden pattern "${match[0]}" on ${pageInfo.name}`)
        }
      }
    })
  }

  test('no fake progress bars exist anywhere', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chefiapp_user_email', 'test@example.com')
      localStorage.setItem('chefiapp_api_base', 'http://127.0.0.1:4173')
    })

    // Mock slow API to see loading state
    await page.route('**/api/onboarding/start', async (route) => {
      await new Promise((r) => setTimeout(r, 2000))
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ restaurant_id: 'test', session_token: '', slug: 'test' }),
        contentType: 'application/json',
      })
    })

    await page.goto(`${baseURL}/app/creating`)

    // Check for progress bar elements
    const progressBars = await page.locator('[role="progressbar"], progress, .progress-bar').count()

    // If progress bars exist, they should not have fake values
    if (progressBars > 0) {
      const progressValues = await page.locator('[role="progressbar"]').evaluateAll((els) =>
        els.map((el) => ({
          value: el.getAttribute('aria-valuenow'),
          determinate: !el.classList.contains('indeterminate'),
        }))
      )

      for (const pv of progressValues) {
        // Determinate progress with value should reflect real state
        if (pv.determinate && pv.value) {
          // Only 0, 100, or real API-driven values allowed
          const val = parseInt(pv.value)
          expect([0, 100].includes(val) || val === null).toBe(true)
        }
      }
    }
  })
})
