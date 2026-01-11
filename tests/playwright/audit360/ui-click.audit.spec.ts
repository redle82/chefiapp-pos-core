import { test } from '@playwright/test'

type ClickResult = {
  route: string
  target: string
  action: 'click'
  success: boolean
  error?: string
  newUrl?: string
}

const defaultRoutes = ['/', '/app/tpv', '/app/onboarding', '/public']

function getRoutes() {
  const env = process.env.AUDIT_ROUTES
  if (env) {
    return env.split(',').map(r => r.trim()).filter(Boolean)
  }
  return defaultRoutes
}

test.describe('Audit 360 — UI Click Audit (botão por botão)', () => {
  for (const route of getRoutes()) {
    test(`Route: ${route}`, async ({ page }, testInfo) => {
      const results: ClickResult[] = []

      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')

      const candidates = await page.$$(
        [
          'button',
          '[role="button"]',
          'a[href]:not([href^="mailto:"])',
          '[data-testid]',
          'input[type="submit"]',
        ].join(',')
      )

      // Limit clicks per unique target to avoid runaway navigation
      const seen = new Set<string>()

      for (const el of candidates) {
        const isVisible = await el.isVisible().catch(() => false)
        if (!isVisible) continue

        const dataTestId = await el.getAttribute('data-testid')
        const text = (await el.innerText().catch(() => '')).trim()
        const tag = (await el.evaluate(node => node.tagName).catch(() => 'el')).toLowerCase()
        const target = dataTestId || `${tag}:${text || '<no-text>'}`
        if (seen.has(target)) continue
        seen.add(target)

        const urlBefore = page.url()
        let success = false
        let error: string | undefined

        try {
          await el.click({ trial: false, force: false, timeout: 2000 })
          success = true
          // Allow navigation or UI response to settle briefly
          await page.waitForTimeout(150)
          await page.waitForLoadState('domcontentloaded', { timeout: 1500 }).catch(() => {})
        } catch (err) {
          success = false
          error = err instanceof Error ? err.message : String(err)
        }

        results.push({
          route,
          target,
          action: 'click',
          success,
          error,
          newUrl: success ? page.url() : undefined,
        })

        // If navigation occurred away from the route, attempt to go back to keep scope tight
        if (success && page.url() !== urlBefore) {
          await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {})
        }
      }

      await testInfo.attach(`ui-click-${route.replace(/\//g, '_')}.json`, {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      })
    })
  }
})
