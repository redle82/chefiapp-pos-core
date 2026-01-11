/**
 * UI CLICK AUDIT — Comprehensive interaction testing
 *
 * For each page/route:
 * 1. Navigate to the route
 * 2. Click every button
 * 3. Test every input (empty, valid, invalid)
 * 4. Check every link
 * 5. Document response behavior
 *
 * Critical pages:
 * - /app (EntryPage) - email input, CTA button
 * - /app/creating (CreatingPage) - demo mode button, retry button
 * - /start/payments (PaymentsPage) - Stripe option, demo option, connect button
 * - /start/publish (PublishPage) - publish button
 * - /app/tpv (TPV) - create order, queue management
 */

import { test, expect, Page } from '@playwright/test'

interface AuditEntry {
  screen: string
  component: string
  action: 'click' | 'input' | 'submit' | 'navigate'
  input?: string
  expected: string
  actual: string
  severity: 'P0' | 'P1' | 'P2' | 'OK'
}

const auditResults: AuditEntry[] = []

function addResult(entry: AuditEntry) {
  auditResults.push(entry)
  console.log(`[AUDIT] ${entry.screen} > ${entry.component} [${entry.action}]: ${entry.severity}`)
}

test.describe('UI Click Audit — EntryPage (/app)', () => {
  test('audit all interactions on EntryPage', async ({ page }) => {
    await page.goto('/app')
    await page.waitForLoadState('networkidle')

    // Check page loaded
    const title = await page.textContent('h1')
    addResult({
      screen: 'EntryPage',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'Page loads with title "O teu restaurante online"',
      actual: title?.includes('restaurante') ? 'Title visible' : 'Title missing',
      severity: title?.includes('restaurante') ? 'OK' : 'P0',
    })

    // Test email input - empty
    const emailInput = page.locator('[data-testid="landing-email-input"]')
    await emailInput.fill('')
    const emptySubmitBtn = page.locator('[data-testid="onboarding-start-btn"]')
    const isDisabledEmpty = await emptySubmitBtn.isDisabled()
    addResult({
      screen: 'EntryPage',
      component: 'EmailInput',
      action: 'input',
      input: '',
      expected: 'Submit button disabled with empty email',
      actual: isDisabledEmpty ? 'Button disabled' : 'Button enabled (BUG)',
      severity: isDisabledEmpty ? 'OK' : 'P1',
    })

    // Test email input - invalid
    await emailInput.fill('invalid-email')
    const isDisabledInvalid = await emptySubmitBtn.isDisabled()
    addResult({
      screen: 'EntryPage',
      component: 'EmailInput',
      action: 'input',
      input: 'invalid-email',
      expected: 'Submit button disabled with invalid email',
      actual: isDisabledInvalid ? 'Button disabled' : 'Button enabled (BUG)',
      severity: isDisabledInvalid ? 'OK' : 'P1',
    })

    // Test email input - valid (but check health status first)
    const offlineAlert = page.locator('[data-testid="landing-offline-alert"]')
    const isOffline = await offlineAlert.isVisible().catch(() => false)

    await emailInput.fill('test@restaurant.com')
    const isDisabledValid = await emptySubmitBtn.isDisabled()

    if (isOffline) {
      addResult({
        screen: 'EntryPage',
        component: 'EmailInput',
        action: 'input',
        input: 'test@restaurant.com',
        expected: 'Submit button disabled when system is offline',
        actual: isDisabledValid ? 'Button disabled (correct)' : 'Button enabled (BUG - should respect health)',
        severity: isDisabledValid ? 'OK' : 'P0',
      })
    } else {
      addResult({
        screen: 'EntryPage',
        component: 'EmailInput',
        action: 'input',
        input: 'test@restaurant.com',
        expected: 'Submit button enabled with valid email and system UP',
        actual: !isDisabledValid ? 'Button enabled' : 'Button disabled (unexpected)',
        severity: !isDisabledValid ? 'OK' : 'P1',
      })
    }

    // Test CTA button click (if enabled)
    if (!isDisabledValid && !isOffline) {
      await emptySubmitBtn.click()
      await page.waitForTimeout(500)
      const currentUrl = page.url()
      addResult({
        screen: 'EntryPage',
        component: 'CTAButton',
        action: 'click',
        expected: 'Navigate to /app/creating',
        actual: currentUrl.includes('/creating') ? 'Navigated correctly' : `Wrong URL: ${currentUrl}`,
        severity: currentUrl.includes('/creating') ? 'OK' : 'P0',
      })
    }

    // Test Google button (navigate back first if we moved)
    if (page.url().includes('/creating')) {
      await page.goto('/app')
      await page.waitForLoadState('networkidle')
    }

    const googleBtn = page.locator('button:has-text("Continuar com Google")')
    const isGoogleVisible = await googleBtn.isVisible()
    addResult({
      screen: 'EntryPage',
      component: 'GoogleButton',
      action: 'click',
      expected: 'Google button visible and clickable',
      actual: isGoogleVisible ? 'Button visible' : 'Button missing',
      severity: isGoogleVisible ? 'OK' : 'P2',
    })

    // Test Terms and Privacy links
    const termsLink = page.locator('a[href="/terms"]')
    const privacyLink = page.locator('a[href="/privacy"]')
    const termsVisible = await termsLink.isVisible()
    const privacyVisible = await privacyLink.isVisible()

    addResult({
      screen: 'EntryPage',
      component: 'TermsLink',
      action: 'click',
      expected: 'Terms link visible',
      actual: termsVisible ? 'Link visible' : 'Link missing',
      severity: termsVisible ? 'OK' : 'P1',
    })

    addResult({
      screen: 'EntryPage',
      component: 'PrivacyLink',
      action: 'click',
      expected: 'Privacy link visible',
      actual: privacyVisible ? 'Link visible' : 'Link missing',
      severity: privacyVisible ? 'OK' : 'P1',
    })
  })
})

test.describe('UI Click Audit — CreatingPage (/app/creating)', () => {
  test('audit all interactions on CreatingPage', async ({ page }) => {
    // Set up minimal state to reach creating page
    await page.goto('/app')
    await page.evaluate(() => {
      localStorage.setItem('chefiapp_user_email', 'test@restaurant.com')
    })

    await page.goto('/app/creating')
    await page.waitForTimeout(2000) // Wait for API attempt

    // Check for demo prompt (appears if backend is down)
    const demoPromptVisible = await page.locator('text=Sistema indisponível').isVisible().catch(() => false)

    if (demoPromptVisible) {
      addResult({
        screen: 'CreatingPage',
        component: 'DemoPrompt',
        action: 'navigate',
        expected: 'Demo prompt appears when backend is down',
        actual: 'Demo prompt visible',
        severity: 'OK',
      })

      // Test retry button
      const retryBtn = page.locator('button:has-text("Tentar novamente")')
      const retryVisible = await retryBtn.isVisible()
      addResult({
        screen: 'CreatingPage',
        component: 'RetryButton',
        action: 'click',
        expected: 'Retry button visible',
        actual: retryVisible ? 'Button visible' : 'Button missing',
        severity: retryVisible ? 'OK' : 'P1',
      })

      // Test demo mode button
      const demoBtn = page.locator('button:has-text("Explorar em modo demo")')
      const demoVisible = await demoBtn.isVisible()
      addResult({
        screen: 'CreatingPage',
        component: 'DemoModeButton',
        action: 'click',
        expected: 'Demo mode button visible',
        actual: demoVisible ? 'Button visible' : 'Button missing',
        severity: demoVisible ? 'OK' : 'P1',
      })

      if (demoVisible) {
        await demoBtn.click()
        await page.waitForTimeout(1000)
        const currentUrl = page.url()
        addResult({
          screen: 'CreatingPage',
          component: 'DemoModeButton',
          action: 'click',
          expected: 'Navigate to /app/preview after clicking demo mode',
          actual: currentUrl.includes('/preview') ? 'Navigated correctly' : `Wrong URL: ${currentUrl}`,
          severity: currentUrl.includes('/preview') ? 'OK' : 'P0',
        })
      }
    } else {
      // Check for success or creating state
      const creating = await page.locator('text=A criar o teu espaço').isVisible().catch(() => false)
      const success = await page.locator('text=Espaço criado').isVisible().catch(() => false)

      addResult({
        screen: 'CreatingPage',
        component: 'CreatingState',
        action: 'navigate',
        expected: 'Shows creating or success state',
        actual: creating || success ? 'State visible' : 'No state shown',
        severity: creating || success ? 'OK' : 'P1',
      })
    }
  })
})

test.describe('UI Click Audit — PaymentsPage (/start/payments)', () => {
  test('audit all interactions on PaymentsPage', async ({ page }) => {
    // Setup state
    await page.goto('/app')
    await page.evaluate(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'demo-123')
      localStorage.setItem('chefiapp_demo_mode', 'true')
    })

    await page.goto('/start/payments')
    await page.waitForLoadState('networkidle')

    // Check page loaded
    const title = await page.textContent('h1')
    addResult({
      screen: 'PaymentsPage',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'Page loads with title "Pagamentos"',
      actual: title === 'Pagamentos' ? 'Title correct' : `Wrong title: ${title}`,
      severity: title === 'Pagamentos' ? 'OK' : 'P1',
    })

    // Test Stripe option click
    const stripeOption = page.locator('[role="button"]:has-text("Stripe")').first()
    await stripeOption.click()
    await page.waitForTimeout(300)

    const stripeInput = page.locator('input[placeholder*="pk_"]')
    const stripeInputVisible = await stripeInput.isVisible()
    addResult({
      screen: 'PaymentsPage',
      component: 'StripeOption',
      action: 'click',
      expected: 'Stripe input field appears after clicking Stripe option',
      actual: stripeInputVisible ? 'Input visible' : 'Input not shown',
      severity: stripeInputVisible ? 'OK' : 'P0',
    })

    // Test Stripe key input - empty
    if (stripeInputVisible) {
      await stripeInput.fill('')
      const connectBtn = page.locator('button:has-text("Ligar Stripe")')
      const isDisabled = await connectBtn.isDisabled()
      addResult({
        screen: 'PaymentsPage',
        component: 'StripeInput',
        action: 'input',
        input: '',
        expected: 'Connect button disabled with empty key',
        actual: isDisabled ? 'Button disabled' : 'Button enabled (BUG)',
        severity: isDisabled ? 'OK' : 'P1',
      })

      // Test Stripe key input - invalid format
      await stripeInput.fill('invalid_key')
      await connectBtn.click()
      await page.waitForTimeout(500)
      const errorMsg = await page.locator('text=Use uma chave publica do Stripe').isVisible().catch(() => false)
      addResult({
        screen: 'PaymentsPage',
        component: 'StripeInput',
        action: 'input',
        input: 'invalid_key',
        expected: 'Error message shows for invalid key format',
        actual: errorMsg ? 'Error shown' : 'No error (BUG)',
        severity: errorMsg ? 'OK' : 'P1',
      })

      // Test Stripe key input - valid format (demo mode)
      await stripeInput.fill('pk_test_123456789')
      await connectBtn.click()
      await page.waitForTimeout(1000)
      const connected = await page.locator('text=Stripe ligado').isVisible().catch(() => false)
      addResult({
        screen: 'PaymentsPage',
        component: 'StripeInput',
        action: 'submit',
        input: 'pk_test_123456789',
        expected: 'Shows connected state in demo mode',
        actual: connected ? 'Connected state shown' : 'No connected state',
        severity: connected ? 'OK' : 'P1',
      })
    }

    // Reset and test demo mode option
    await page.goto('/start/payments')
    await page.waitForLoadState('networkidle')

    const demoOption = page.locator('[role="button"]:has-text("Modo demo")').first()
    await demoOption.click()
    await page.waitForTimeout(300)

    const demoBtn = page.locator('button:has-text("Continuar sem pagamentos")')
    const demoBtnVisible = await demoBtn.isVisible()
    addResult({
      screen: 'PaymentsPage',
      component: 'DemoOption',
      action: 'click',
      expected: 'Demo mode button appears after clicking demo option',
      actual: demoBtnVisible ? 'Button visible' : 'Button not shown',
      severity: demoBtnVisible ? 'OK' : 'P0',
    })

    if (demoBtnVisible) {
      await demoBtn.click()
      await page.waitForTimeout(500)
      const currentUrl = page.url()
      addResult({
        screen: 'PaymentsPage',
        component: 'DemoContinueButton',
        action: 'click',
        expected: 'Navigate to /start/publish',
        actual: currentUrl.includes('/publish') ? 'Navigated correctly' : `Wrong URL: ${currentUrl}`,
        severity: currentUrl.includes('/publish') ? 'OK' : 'P0',
      })
    }
  })
})

test.describe('UI Click Audit — PublishPage (/start/publish)', () => {
  test('audit all interactions on PublishPage', async ({ page }) => {
    // Setup complete state
    await page.goto('/app')
    await page.evaluate(() => {
      localStorage.setItem('chefiapp_restaurant_id', 'demo-123')
      localStorage.setItem('chefiapp_demo_mode', 'true')
      localStorage.setItem('chefiapp_name', 'Test Restaurant')
      localStorage.setItem('chefiapp_slug', 'test-restaurant')
      localStorage.setItem('chefiapp_menu', JSON.stringify([{ id: '1', name: 'Test Item', price: 10 }]))
      localStorage.setItem('chefiapp_payments_mode', 'demo')
    })

    await page.goto('/start/publish')
    await page.waitForTimeout(2000) // Wait for checks animation

    // Check page loaded
    const title = await page.textContent('h1')
    addResult({
      screen: 'PublishPage',
      component: 'PageLoad',
      action: 'navigate',
      expected: 'Page loads with title "Publicar"',
      actual: title === 'Publicar' ? 'Title correct' : `Wrong title: ${title}`,
      severity: title === 'Publicar' ? 'OK' : 'P1',
    })

    // Check checklist items
    const identityCheck = await page.locator('text=Identidade configurada').isVisible()
    const slugCheck = await page.locator('text=Pagina criada').isVisible()
    const menuCheck = await page.locator('text=Menu com').isVisible()
    const paymentsCheck = await page.locator('text=Pagamentos').isVisible()

    addResult({
      screen: 'PublishPage',
      component: 'Checklist',
      action: 'navigate',
      expected: 'All checklist items visible',
      actual: [identityCheck, slugCheck, menuCheck, paymentsCheck].every(x => x)
        ? 'All items visible'
        : 'Some items missing',
      severity: [identityCheck, slugCheck, menuCheck, paymentsCheck].every(x => x) ? 'OK' : 'P1',
    })

    // Test publish button
    const publishBtn = page.locator('button:has-text("Publicar agora")')
    await page.waitForTimeout(500) // Wait for animation to complete
    const isEnabled = !(await publishBtn.isDisabled())
    addResult({
      screen: 'PublishPage',
      component: 'PublishButton',
      action: 'click',
      expected: 'Publish button enabled after checks complete',
      actual: isEnabled ? 'Button enabled' : 'Button disabled',
      severity: isEnabled ? 'OK' : 'P1',
    })

    if (isEnabled) {
      await publishBtn.click()
      await page.waitForTimeout(1000)
      const currentUrl = page.url()
      addResult({
        screen: 'PublishPage',
        component: 'PublishButton',
        action: 'click',
        expected: 'Navigate to /start/success after publishing',
        actual: currentUrl.includes('/success') ? 'Navigated correctly' : `Still on: ${currentUrl}`,
        severity: currentUrl.includes('/success') ? 'OK' : 'P0',
      })
    }
  })
})

test.describe('UI Click Audit — TPV (/app/tpv)', () => {
  test('audit all interactions on TPV', async ({ page }) => {
    await page.goto('/app/tpv')
    await page.waitForLoadState('networkidle')

    // Check page loaded
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

    // Test new order button
    const newOrderBtn = page.locator('[data-testid="tpv-new-order-btn"]')
    const newOrderVisible = await newOrderBtn.isVisible()
    addResult({
      screen: 'TPV',
      component: 'NewOrderButton',
      action: 'click',
      expected: 'New order button visible',
      actual: newOrderVisible ? 'Button visible' : 'Button missing',
      severity: newOrderVisible ? 'OK' : 'P0',
    })

    if (newOrderVisible) {
      const isDisabled = await newOrderBtn.isDisabled()
      addResult({
        screen: 'TPV',
        component: 'NewOrderButton',
        action: 'click',
        expected: 'New order button enabled',
        actual: !isDisabled ? 'Button enabled' : 'Button disabled',
        severity: !isDisabled ? 'OK' : 'P1',
      })

      if (!isDisabled) {
        await newOrderBtn.click()
        await page.waitForTimeout(500)
        // Check if order was added to queue (queue should show at least 1 item)
        const obsBtn = page.locator('[data-testid="tpv-obs-open"]')
        await obsBtn.click()
        await page.waitForTimeout(300)
        const queueTotal = await page.locator('text=Total:').isVisible()
        addResult({
          screen: 'TPV',
          component: 'NewOrderButton',
          action: 'click',
          expected: 'Order added to queue',
          actual: queueTotal ? 'Queue updated' : 'Queue not updated',
          severity: queueTotal ? 'OK' : 'P1',
        })
      }
    }

    // Test observability panel
    const obsBtn = page.locator('[data-testid="tpv-obs-open"]')
    const obsBtnVisible = await obsBtn.isVisible()
    addResult({
      screen: 'TPV',
      component: 'ObservabilityButton',
      action: 'click',
      expected: 'Observability button visible',
      actual: obsBtnVisible ? 'Button visible' : 'Button missing',
      severity: obsBtnVisible ? 'OK' : 'P2',
    })

    if (obsBtnVisible) {
      await obsBtn.click()
      await page.waitForTimeout(300)
      const obsPanel = page.locator('[data-testid="tpv-obs-panel"]')
      const panelVisible = await obsPanel.isVisible()
      addResult({
        screen: 'TPV',
        component: 'ObservabilityPanel',
        action: 'click',
        expected: 'Observability panel opens',
        actual: panelVisible ? 'Panel visible' : 'Panel not shown',
        severity: panelVisible ? 'OK' : 'P2',
      })
    }

    // Test order cards interactions
    const orderCards = page.locator('.order-card')
    const orderCount = await orderCards.count()
    addResult({
      screen: 'TPV',
      component: 'OrderCards',
      action: 'navigate',
      expected: 'Order cards visible on kanban board',
      actual: orderCount > 0 ? `${orderCount} orders visible` : 'No orders',
      severity: orderCount > 0 ? 'OK' : 'P2',
    })

    // Test clicking an order card
    if (orderCount > 0) {
      await orderCards.first().click()
      await page.waitForTimeout(500)
      // Check if we're still on TPV or if detail view appeared
      const detailView = page.locator('.tpv-detail')
      const detailVisible = await detailView.isVisible().catch(() => false)
      addResult({
        screen: 'TPV',
        component: 'OrderCard',
        action: 'click',
        expected: 'Clicking order card shows detail view',
        actual: detailVisible ? 'Detail view shown' : 'Detail view not shown',
        severity: detailVisible ? 'OK' : 'P2',
      })
    }
  })
})

test.afterAll(async () => {
  // Output all audit results as JSON
  console.log('\n=== UI CLICK AUDIT RESULTS ===\n')
  console.log(JSON.stringify(auditResults, null, 2))

  // Summary stats
  const stats = {
    total: auditResults.length,
    P0: auditResults.filter(r => r.severity === 'P0').length,
    P1: auditResults.filter(r => r.severity === 'P1').length,
    P2: auditResults.filter(r => r.severity === 'P2').length,
    OK: auditResults.filter(r => r.severity === 'OK').length,
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Total interactions tested: ${stats.total}`)
  console.log(`P0 (Critical): ${stats.P0}`)
  console.log(`P1 (High): ${stats.P1}`)
  console.log(`P2 (Medium): ${stats.P2}`)
  console.log(`OK: ${stats.OK}`)
  console.log('\n')

  // Write to file
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(__dirname, '../../../audit-ui-click-results.json')
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: auditResults,
    summary: stats,
  }, null, 2))
  console.log(`Results written to: ${outputPath}`)
})
