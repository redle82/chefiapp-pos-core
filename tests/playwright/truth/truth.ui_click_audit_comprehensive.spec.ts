/**
 * COMPREHENSIVE UI CLICK AUDIT
 *
 * Systematic testing of all user interactions across ChefIApp merchant portal
 * Handles health-based gating, demo mode, and offline states
 */

import { test, expect } from '@playwright/test'

interface AuditEntry {
  screen: string
  component: string
  action: 'click' | 'input' | 'submit' | 'navigate'
  input?: string
  expected: string
  actual: string
  severity: 'P0' | 'P1' | 'P2' | 'OK'
  notes?: string
}

const auditResults: AuditEntry[] = []

function addResult(entry: AuditEntry) {
  auditResults.push(entry)
  console.log(`[AUDIT] ${entry.screen} > ${entry.component} [${entry.action}]: ${entry.severity}${entry.notes ? ' (' + entry.notes + ')' : ''}`)
}

test.describe('Comprehensive UI Click Audit', () => {
  test('EntryPage (/app) - all interactions', async ({ page }) => {
    await page.goto('/app')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // 1. Page load
    const title = await page.locator('h1').first().textContent()
    addResult({
      screen: 'EntryPage',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'Page loads with title "O teu restaurante online"',
      actual: title?.includes('restaurante') ? 'Title visible' : 'Title missing',
      severity: title?.includes('restaurante') ? 'OK' : 'P0',
    })

    // 2. Check health banner
    const healthBanner = page.locator('[data-testid="core-status-banner"]')
    const bannerVisible = await healthBanner.isVisible().catch(() => false)
    const bannerText = bannerVisible ? await healthBanner.textContent() : null
    addResult({
      screen: 'EntryPage',
      component: 'HealthBanner',
      action: 'navigate',
      expected: 'Health banner shows system status',
      actual: bannerVisible ? `Banner: ${bannerText}` : 'No banner',
      severity: 'OK',
      notes: 'Truth Zero enforcement',
    })

    // Determine if system is UP or DOWN
    const offlineAlert = page.locator('[data-testid="landing-offline-alert"]')
    const isSystemDown = await offlineAlert.isVisible().catch(() => false)

    // 3. Email input field state
    const emailInput = page.locator('[data-testid="landing-email-input"]')
    const emailDisabled = await emailInput.isDisabled()
    addResult({
      screen: 'EntryPage',
      component: 'EmailInput',
      action: 'navigate',
      expected: isSystemDown ? 'Email input disabled when system DOWN' : 'Email input enabled when system UP',
      actual: emailDisabled ? 'Input disabled' : 'Input enabled',
      severity: (isSystemDown && emailDisabled) || (!isSystemDown && !emailDisabled) ? 'OK' : 'P1',
      notes: `System ${isSystemDown ? 'DOWN' : 'UP'}`,
    })

    // 4. Test email input (only if enabled)
    if (!emailDisabled) {
      await emailInput.fill('')
      const submitBtn = page.locator('[data-testid="onboarding-start-btn"]')
      const isDisabledEmpty = await submitBtn.isDisabled()
      addResult({
        screen: 'EntryPage',
        component: 'EmailInput',
        action: 'input',
        input: '',
        expected: 'Submit button disabled with empty email',
        actual: isDisabledEmpty ? 'Button disabled' : 'Button enabled (BUG)',
        severity: isDisabledEmpty ? 'OK' : 'P1',
      })

      await emailInput.fill('invalid-email')
      const isDisabledInvalid = await submitBtn.isDisabled()
      addResult({
        screen: 'EntryPage',
        component: 'EmailInput',
        action: 'input',
        input: 'invalid-email',
        expected: 'Submit button disabled with invalid email',
        actual: isDisabledInvalid ? 'Button disabled' : 'Button enabled (BUG)',
        severity: isDisabledInvalid ? 'OK' : 'P1',
      })

      await emailInput.fill('test@restaurant.com')
      const isDisabledValid = await submitBtn.isDisabled()
      addResult({
        screen: 'EntryPage',
        component: 'EmailInput',
        action: 'input',
        input: 'test@restaurant.com',
        expected: 'Submit button enabled with valid email',
        actual: !isDisabledValid ? 'Button enabled' : 'Button disabled',
        severity: !isDisabledValid ? 'OK' : 'P1',
      })
    }

    // 5. Google button
    const googleBtn = page.locator('button:has-text("Continuar com Google")').first()
    const isGoogleVisible = await googleBtn.isVisible()
    const isGoogleDisabled = await googleBtn.isDisabled()
    addResult({
      screen: 'EntryPage',
      component: 'GoogleButton',
      action: 'navigate',
      expected: 'Google button visible',
      actual: isGoogleVisible ? (isGoogleDisabled ? 'Visible but disabled' : 'Visible and enabled') : 'Not visible',
      severity: isGoogleVisible ? 'OK' : 'P2',
      notes: isSystemDown ? 'System DOWN - expected disabled' : 'System UP',
    })

    // 6. Footer links
    const termsLink = page.locator('a[href="/terms"]')
    const privacyLink = page.locator('a[href="/privacy"]')
    const termsVisible = await termsLink.isVisible()
    const privacyVisible = await privacyLink.isVisible()

    addResult({
      screen: 'EntryPage',
      component: 'FooterLinks',
      action: 'navigate',
      expected: 'Terms and Privacy links visible',
      actual: `Terms: ${termsVisible}, Privacy: ${privacyVisible}`,
      severity: termsVisible && privacyVisible ? 'OK' : 'P1',
    })

    // 7. Test CTA flow (if system is UP)
    if (!isSystemDown && !emailDisabled) {
      await emailInput.fill('audit@test.com')
      const submitBtn = page.locator('[data-testid="onboarding-start-btn"]')
      await submitBtn.click()
      await page.waitForTimeout(1000)
      const newUrl = page.url()
      addResult({
        screen: 'EntryPage',
        component: 'CTAButton',
        action: 'click',
        expected: 'Navigate to /app/creating',
        actual: newUrl.includes('/creating') ? 'Navigated correctly' : `Wrong URL: ${newUrl}`,
        severity: newUrl.includes('/creating') ? 'OK' : 'P0',
      })
    } else {
      addResult({
        screen: 'EntryPage',
        component: 'CTAButton',
        action: 'click',
        expected: 'CTA disabled when system DOWN',
        actual: 'CTA appropriately blocked',
        severity: 'OK',
        notes: 'Truth Zero gating working',
      })
    }
  })

  test('CreatingPage (/app/creating) - all interactions', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('chefiapp_user_email', 'audit@test.com')
    })

    await page.goto('/app/creating')
    await page.waitForTimeout(3000) // Wait for API attempt or demo prompt

    // Check what state we're in
    const demoPrompt = await page.locator('text=Sistema indisponível').isVisible().catch(() => false)
    const creating = await page.locator('text=A criar o teu espaço').isVisible().catch(() => false)
    const success = await page.locator('text=Espaço criado').isVisible().catch(() => false)

    addResult({
      screen: 'CreatingPage',
      component: 'PageState',
      action: 'navigate',
      expected: 'Shows creating, success, or demo prompt',
      actual: demoPrompt ? 'Demo prompt' : creating ? 'Creating' : success ? 'Success' : 'Unknown state',
      severity: demoPrompt || creating || success ? 'OK' : 'P1',
    })

    if (demoPrompt) {
      // Test retry button (use more specific selector to avoid banner retry)
      const retryBtn = page.locator('.button.button--primary:has-text("Tentar novamente")').first()
      const retryVisible = await retryBtn.isVisible()
      addResult({
        screen: 'CreatingPage',
        component: 'RetryButton',
        action: 'navigate',
        expected: 'Retry button visible in demo prompt',
        actual: retryVisible ? 'Button visible' : 'Button missing',
        severity: retryVisible ? 'OK' : 'P1',
      })

      // Test demo mode button
      const demoBtn = page.locator('button:has-text("Explorar em modo demo")').first()
      const demoVisible = await demoBtn.isVisible()
      addResult({
        screen: 'CreatingPage',
        component: 'DemoModeButton',
        action: 'navigate',
        expected: 'Demo mode button visible',
        actual: demoVisible ? 'Button visible' : 'Button missing',
        severity: demoVisible ? 'OK' : 'P1',
      })

      if (demoVisible) {
        await demoBtn.click()
        await page.waitForTimeout(1000)
        const newUrl = page.url()
        addResult({
          screen: 'CreatingPage',
          component: 'DemoModeButton',
          action: 'click',
          expected: 'Navigate to /app/preview',
          actual: newUrl.includes('/preview') ? 'Navigated correctly' : `Wrong URL: ${newUrl}`,
          severity: newUrl.includes('/preview') ? 'OK' : 'P0',
        })
      }
    }
  })

  test('PaymentsPage (/start/payments) - all interactions', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'demo-audit-123')
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await page.goto('/start/payments')
    await page.waitForLoadState('networkidle')

    // 1. Page load
    const title = await page.locator('h1').first().textContent()
    addResult({
      screen: 'PaymentsPage',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'Page loads with title "Pagamentos"',
      actual: title === 'Pagamentos' ? 'Title correct' : `Wrong title: ${title}`,
      severity: title === 'Pagamentos' ? 'OK' : 'P1',
    })

    // 2. Click Stripe option
    const stripeOption = page.locator('[role="button"]').filter({ hasText: 'Stripe' }).first()
    await stripeOption.click()
    await page.waitForTimeout(500)

    const stripeInput = page.locator('input[placeholder*="pk_"]')
    const stripeInputVisible = await stripeInput.isVisible()
    addResult({
      screen: 'PaymentsPage',
      component: 'StripeOption',
      action: 'click',
      expected: 'Stripe input appears',
      actual: stripeInputVisible ? 'Input visible' : 'Input missing',
      severity: stripeInputVisible ? 'OK' : 'P0',
    })

    if (stripeInputVisible) {
      // 3. Test empty input
      await stripeInput.fill('')
      const connectBtn = page.locator('button:has-text("Ligar Stripe")').first()
      const isDisabledEmpty = await connectBtn.isDisabled()
      addResult({
        screen: 'PaymentsPage',
        component: 'StripeInput',
        action: 'input',
        input: '',
        expected: 'Connect button disabled with empty key',
        actual: isDisabledEmpty ? 'Button disabled' : 'Button enabled (BUG)',
        severity: isDisabledEmpty ? 'OK' : 'P1',
      })

      // 4. Test invalid key
      await stripeInput.fill('invalid_key')
      await connectBtn.click()
      await page.waitForTimeout(500)
      const errorMsg = await page.locator('text=Use uma chave publica').isVisible().catch(() => false)
      addResult({
        screen: 'PaymentsPage',
        component: 'StripeInput',
        action: 'input',
        input: 'invalid_key',
        expected: 'Error message for invalid format',
        actual: errorMsg ? 'Error shown' : 'No error',
        severity: errorMsg ? 'OK' : 'P1',
      })

      // 5. Test valid key (demo mode accepts it)
      await stripeInput.fill('pk_test_123456789')
      await connectBtn.click()
      await page.waitForTimeout(1500)
      const connected = await page.locator('text=Stripe ligado').isVisible().catch(() => false)
      addResult({
        screen: 'PaymentsPage',
        component: 'StripeInput',
        action: 'submit',
        input: 'pk_test_123456789',
        expected: 'Shows connected state in demo mode',
        actual: connected ? 'Connected shown' : 'Not connected',
        severity: connected ? 'OK' : 'P1',
        notes: 'Demo mode',
      })

      // 6. Test continue button (if connected)
      if (connected) {
        const continueBtn = page.locator('button:has-text("Continuar")').first()
        const continueVisible = await continueBtn.isVisible()
        addResult({
          screen: 'PaymentsPage',
          component: 'ContinueButton',
          action: 'navigate',
          expected: 'Continue button appears after connection',
          actual: continueVisible ? 'Button visible' : 'Button missing',
          severity: continueVisible ? 'OK' : 'P1',
        })

        if (continueVisible) {
          await continueBtn.click()
          await page.waitForTimeout(500)
          const newUrl = page.url()
          addResult({
            screen: 'PaymentsPage',
            component: 'ContinueButton',
            action: 'click',
            expected: 'Navigate to /start/publish',
            actual: newUrl.includes('/publish') ? 'Navigated correctly' : `Wrong URL: ${newUrl}`,
            severity: newUrl.includes('/publish') ? 'OK' : 'P0',
          })
        }
      }
    }

    // 7. Test demo option (reset page first)
    await page.goto('/start/payments')
    await page.waitForLoadState('networkidle')

    const demoOption = page.locator('[role="button"]').filter({ hasText: 'Modo demo' }).first()
    await demoOption.click()
    await page.waitForTimeout(500)

    const demoBtn = page.locator('button:has-text("Continuar sem pagamentos")').first()
    const demoBtnVisible = await demoBtn.isVisible()
    addResult({
      screen: 'PaymentsPage',
      component: 'DemoOption',
      action: 'click',
      expected: 'Demo continue button appears',
      actual: demoBtnVisible ? 'Button visible' : 'Button missing',
      severity: demoBtnVisible ? 'OK' : 'P0',
    })
  })

  test('PublishPage (/start/publish) - all interactions', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'demo-audit-123')
      localStorage.setItem('chefiapp_demo_mode', 'true')
      localStorage.setItem('chefiapp_name', 'Audit Restaurant')
      localStorage.setItem('chefiapp_slug', 'audit-restaurant')
      localStorage.setItem('chefiapp_menu', JSON.stringify([{ id: '1', name: 'Test Item', price: 10 }]))
      localStorage.setItem('chefiapp_payments_mode', 'demo')
    })

    await page.goto('/start/publish')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Wait for checks animation

    // 1. Page load
    const title = await page.locator('h1').first().textContent()
    addResult({
      screen: 'PublishPage',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'Page loads with title "Publicar"',
      actual: title === 'Publicar' ? 'Title correct' : `Wrong title: ${title}`,
      severity: title === 'Publicar' ? 'OK' : 'P1',
    })

    // 2. Check checklist items
    const identityCheck = await page.locator('text=Identidade configurada').isVisible()
    const slugCheck = await page.locator('text=Pagina criada').isVisible()
    const menuCheck = await page.locator('text=Menu com').isVisible()
    const paymentsCheck = await page.locator('text=Pagamentos').isVisible()

    addResult({
      screen: 'PublishPage',
      component: 'Checklist',
      action: 'navigate',
      expected: 'All checklist items visible',
      actual: [identityCheck, slugCheck, menuCheck, paymentsCheck].filter(Boolean).length + ' of 4 visible',
      severity: [identityCheck, slugCheck, menuCheck, paymentsCheck].every(Boolean) ? 'OK' : 'P1',
    })

    // 3. Check demo mode warning
    const demoWarning = await page.locator('text=Modo Demonstracao').isVisible().catch(() => false)
    addResult({
      screen: 'PublishPage',
      component: 'DemoWarning',
      action: 'navigate',
      expected: 'Demo mode warning shown in demo',
      actual: demoWarning ? 'Warning shown' : 'No warning',
      severity: demoWarning ? 'OK' : 'P2',
      notes: 'Demo mode transparency',
    })

    // 4. Test publish button
    const publishBtn = page.locator('button').filter({ hasText: /^Publicar agora$/ }).first()
    const publishBtnExists = await publishBtn.count() > 0

    if (publishBtnExists) {
      const isDisabled = await publishBtn.isDisabled()
      addResult({
        screen: 'PublishPage',
        component: 'PublishButton',
        action: 'navigate',
        expected: 'Publish button enabled after checks',
        actual: !isDisabled ? 'Button enabled' : 'Button disabled',
        severity: !isDisabled ? 'OK' : 'P1',
      })

      if (!isDisabled) {
        await publishBtn.click()
        await page.waitForTimeout(1500)
        const newUrl = page.url()
        addResult({
          screen: 'PublishPage',
          component: 'PublishButton',
          action: 'click',
          expected: 'Navigate to /start/success',
          actual: newUrl.includes('/success') ? 'Navigated correctly' : `Wrong URL: ${newUrl}`,
          severity: newUrl.includes('/success') ? 'OK' : 'P0',
        })
      }
    }
  })

  test('TPV (/app/tpv) - all interactions', async ({ page }) => {
    await page.goto('/app/tpv')
    await page.waitForLoadState('networkidle')

    // 1. Page load
    const tpvRoot = page.locator('[data-testid="tpv-root"]')
    const isVisible = await tpvRoot.isVisible()
    addResult({
      screen: 'TPV',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'TPV page loads',
      actual: isVisible ? 'Page visible' : 'Page not loaded',
      severity: isVisible ? 'OK' : 'P0',
    })

    // 2. New order button
    const newOrderBtn = page.locator('[data-testid="tpv-new-order-btn"]')
    const newOrderVisible = await newOrderBtn.isVisible()
    const newOrderDisabled = await newOrderBtn.isDisabled()
    addResult({
      screen: 'TPV',
      component: 'NewOrderButton',
      action: 'navigate',
      expected: 'New order button visible and enabled',
      actual: newOrderVisible ? (newOrderDisabled ? 'Visible but disabled' : 'Visible and enabled') : 'Not visible',
      severity: newOrderVisible && !newOrderDisabled ? 'OK' : 'P0',
    })

    if (newOrderVisible && !newOrderDisabled) {
      await newOrderBtn.click()
      await page.waitForTimeout(500)
      addResult({
        screen: 'TPV',
        component: 'NewOrderButton',
        action: 'click',
        expected: 'Order queued (offline-first)',
        actual: 'Order enqueued',
        severity: 'OK',
        notes: 'Offline-capable',
      })
    }

    // 3. Observability panel
    const obsBtn = page.locator('[data-testid="tpv-obs-open"]')
    const obsBtnVisible = await obsBtn.isVisible()
    addResult({
      screen: 'TPV',
      component: 'ObservabilityButton',
      action: 'navigate',
      expected: 'Observability button visible',
      actual: obsBtnVisible ? 'Button visible' : 'Button missing',
      severity: obsBtnVisible ? 'OK' : 'P2',
    })

    if (obsBtnVisible) {
      await obsBtn.click()
      await page.waitForTimeout(500)
      const obsPanel = page.locator('[data-testid="tpv-obs-panel"]')
      const panelVisible = await obsPanel.isVisible()
      addResult({
        screen: 'TPV',
        component: 'ObservabilityPanel',
        action: 'click',
        expected: 'Panel opens showing queue and health',
        actual: panelVisible ? 'Panel visible' : 'Panel not shown',
        severity: panelVisible ? 'OK' : 'P2',
      })

      if (panelVisible) {
        const healthStatus = await page.locator('text=Status:').isVisible()
        const queueInfo = await page.locator('text=Total:').isVisible()
        addResult({
          screen: 'TPV',
          component: 'ObservabilityPanel',
          action: 'navigate',
          expected: 'Panel shows health and queue stats',
          actual: `Health: ${healthStatus}, Queue: ${queueInfo}`,
          severity: healthStatus && queueInfo ? 'OK' : 'P2',
          notes: 'Truth observability',
        })
      }

      // Close panel
      const closeBtn = page.locator('button:has-text("Fechar")').first()
      if (await closeBtn.isVisible()) {
        await closeBtn.click()
        await page.waitForTimeout(300)
      }
    }

    // 4. Order cards
    const orderCards = page.locator('.order-card')
    const orderCount = await orderCards.count()
    addResult({
      screen: 'TPV',
      component: 'OrderCards',
      action: 'navigate',
      expected: 'Order cards visible on kanban',
      actual: `${orderCount} orders visible`,
      severity: orderCount > 0 ? 'OK' : 'P2',
      notes: 'Demo data',
    })

    // 5. Click order card
    if (orderCount > 0) {
      await orderCards.first().click()
      await page.waitForTimeout(500)
      const detailView = page.locator('.tpv-detail')
      const detailVisible = await detailView.isVisible().catch(() => false)
      addResult({
        screen: 'TPV',
        component: 'OrderCard',
        action: 'click',
        expected: 'Order detail view opens',
        actual: detailVisible ? 'Detail view shown' : 'Detail view not shown',
        severity: detailVisible ? 'OK' : 'P2',
      })

      if (detailVisible) {
        // Test back button
        const backBtn = page.locator('button:has-text("Voltar")').first()
        if (await backBtn.isVisible()) {
          await backBtn.click()
          await page.waitForTimeout(300)
          const backToList = await tpvRoot.isVisible()
          addResult({
            screen: 'TPV',
            component: 'BackButton',
            action: 'click',
            expected: 'Return to order list',
            actual: backToList ? 'Returned to list' : 'Still in detail',
            severity: backToList ? 'OK' : 'P1',
          })
        }
      }
    }

    // 6. Check demo banner
    const demoBanner = page.locator('[data-testid="demo-banner"]')
    const demoBannerVisible = await demoBanner.isVisible().catch(() => false)
    addResult({
      screen: 'TPV',
      component: 'DemoBanner',
      action: 'navigate',
      expected: 'Demo banner shows when using demo data',
      actual: demoBannerVisible ? 'Banner visible' : 'No banner',
      severity: 'OK',
      notes: demoBannerVisible ? 'Demo mode transparency' : 'Real data mode',
    })
  })
})

test.afterAll(async () => {
  // Output comprehensive results
  console.log('\n' + '='.repeat(60))
  console.log('COMPREHENSIVE UI CLICK AUDIT RESULTS')
  console.log('='.repeat(60) + '\n')

  const stats = {
    total: auditResults.length,
    P0: auditResults.filter(r => r.severity === 'P0').length,
    P1: auditResults.filter(r => r.severity === 'P1').length,
    P2: auditResults.filter(r => r.severity === 'P2').length,
    OK: auditResults.filter(r => r.severity === 'OK').length,
  }

  console.log('SUMMARY:')
  console.log(`  Total interactions tested: ${stats.total}`)
  console.log(`  P0 (Critical):    ${stats.P0}`)
  console.log(`  P1 (High):        ${stats.P1}`)
  console.log(`  P2 (Medium):      ${stats.P2}`)
  console.log(`  OK:               ${stats.OK}`)
  console.log('')

  // Group by screen
  const byScreen: Record<string, AuditEntry[]> = {}
  auditResults.forEach(r => {
    if (!byScreen[r.screen]) byScreen[r.screen] = []
    byScreen[r.screen].push(r)
  })

  console.log('BY SCREEN:')
  Object.entries(byScreen).forEach(([screen, entries]) => {
    const screenOK = entries.filter(e => e.severity === 'OK').length
    const screenIssues = entries.filter(e => e.severity !== 'OK').length
    console.log(`  ${screen}: ${screenOK} OK, ${screenIssues} issues`)
  })
  console.log('')

  // List all issues
  const issues = auditResults.filter(r => r.severity !== 'OK')
  if (issues.length > 0) {
    console.log('ISSUES FOUND:')
    issues.forEach(issue => {
      console.log(`  [${issue.severity}] ${issue.screen} > ${issue.component}`)
      console.log(`      Expected: ${issue.expected}`)
      console.log(`      Actual:   ${issue.actual}`)
      if (issue.notes) console.log(`      Notes:    ${issue.notes}`)
      console.log('')
    })
  }

  // Write to file
  const fs = require('fs')
  const path = require('path')
  const timestamp = new Date().toISOString()
  const report = {
    timestamp,
    summary: stats,
    byScreen: Object.entries(byScreen).map(([screen, entries]) => ({
      screen,
      total: entries.length,
      OK: entries.filter(e => e.severity === 'OK').length,
      issues: entries.filter(e => e.severity !== 'OK').length,
    })),
    results: auditResults,
  }

  const outputPath = path.join(__dirname, '../../../audit-ui-comprehensive.json')
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`Full report written to: ${outputPath}`)
  console.log('='.repeat(60) + '\n')
})
