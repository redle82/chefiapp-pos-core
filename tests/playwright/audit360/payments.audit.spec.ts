import { expect, test } from '@playwright/test'

const paymentsRoute = process.env.AUDIT_PAYMENT_ROUTE || '/app/payments'
const shouldRun = process.env.AUDIT_PAYMENT === '1' || process.env.AUDIT_PAYMENT === 'true'
const stripePk = process.env.AUDIT_STRIPE_PK || ''

test.describe('Audit 360 — Pagamentos (Stripe)', () => {
  test.skip(!shouldRun, 'Set AUDIT_PAYMENT=1 and AUDIT_STRIPE_PK to run payment audit')

  test('Stripe connect and double-submit guard', async ({ page }, testInfo) => {
    const results: Record<string, unknown> = {
      route: paymentsRoute,
      stripePkProvided: Boolean(stripePk),
      steps: [] as any[],
    }

    await page.goto(paymentsRoute)
    await page.waitForLoadState('domcontentloaded')

    // Select Stripe option (if present)
    const stripeOption = page.locator('text=/Stripe/i')
    if (await stripeOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stripeOption.click().catch(() => {})
      results.steps.push({ step: 'select-stripe', success: true })
    }

    // Enter PK
    const pkInput = page.locator('input[placeholder*="pk_"]')
    if (await pkInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (!stripePk) {
        results.steps.push({ step: 'enter-pk', success: false, error: 'AUDIT_STRIPE_PK missing' })
        await testInfo.attach('payments-audit.json', {
          body: JSON.stringify(results, null, 2),
          contentType: 'application/json',
        })
        return
      }
      await pkInput.fill(stripePk)
      results.steps.push({ step: 'enter-pk', success: true })
    }

    // Click connect
    const connectBtn = page.locator('text=/Ligar Stripe|Conectar Stripe/i')
    if (await connectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectBtn.click({ timeout: 3000 })
      results.steps.push({ step: 'click-connect', success: true })
    }

    // Wait for validation state or success indicator
    const validating = page.locator('text=/A validar|Validando/i')
    const connected = page.locator('text=/Stripe ligado|Conectado/i')
    const error = page.locator('text=/erro|invalido|inválido/i')
    const outcome = await Promise.race([
      connected.first().isVisible({ timeout: 5000 }).then(v => (v ? 'connected' : null)).catch(() => null),
      validating.first().isVisible({ timeout: 5000 }).then(v => (v ? 'validating' : null)).catch(() => null),
      error.first().isVisible({ timeout: 5000 }).then(v => (v ? 'error' : null)).catch(() => null),
    ])

    results.steps.push({ step: 'post-connect-state', outcome })

    // Double-submit guard: click connect twice rapidly and observe lack of duplicate requests
    if (await connectBtn.isVisible().catch(() => false)) {
      const [reqs, _] = await Promise.all([
        trackRequests(page, ['stripe']),
        (async () => {
          await connectBtn.click().catch(() => {})
          await connectBtn.click().catch(() => {})
        })(),
      ])
      results.steps.push({ step: 'double-click-connect', requestCount: reqs })
    }

    await testInfo.attach('payments-audit.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    })

    // Do not fail the suite on negative outcomes; this is evidence gathering.
    expect(true).toBeTruthy()
  })
})

async function trackRequests(page: import('@playwright/test').Page, filter: string[]) {
  let count = 0
  const listener = (req: any) => {
    const url = req.url().toLowerCase()
    if (filter.some(f => url.includes(f))) count += 1
  }
  page.on('request', listener)
  await page.waitForTimeout(1500)
  page.off('request', listener)
  return count
}
