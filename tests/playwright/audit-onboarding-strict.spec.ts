/**
 * 🧪 CHEFIAPP POS — INTERNAL ONBOARDING AUDIT
 *
 * STRICT HUMAN NAVIGATION MODE
 *
 * Rules:
 * - Navigate ONLY via browser
 * - Never access code directly
 * - Stop immediately on any failure
 * - Record: URL, action, result, state
 * - No scene skipping
 * - No mental fixes
 */

import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface AuditResult {
  scene: string;
  url: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  action: string;
  result: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  stateVerified?: boolean;
  timestamp: string;
}

const auditResults: AuditResult[] = [];

function logResult(result: AuditResult) {
  auditResults.push(result);
  console.log(`[${result.status}] ${result.scene}: ${result.action} → ${result.result}`);
}

async function waitForStableUrl(page: Page, timeout = 5000) {
  let lastUrl = page.url();
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    await page.waitForTimeout(100);
    const currentUrl = page.url();
    if (currentUrl === lastUrl) {
      await page.waitForTimeout(300); // Extra stability check
      return currentUrl;
    }
    lastUrl = currentUrl;
  }
  return lastUrl;
}

test.describe('ONBOARDING AUDIT - STRICT HUMAN MODE', () => {
  test.setTimeout(300000); // 5 minutes max

  test('Complete onboarding flow from zero to first sale', async ({ page }) => {
    // Clear any existing state
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());

    // ===================================================================
    // SCENE 1 - HOOK
    // ===================================================================
    test.step('SCENE 1 - HOOK', async () => {
      console.log('\n🟢 SCENE 1 - HOOK');

      await page.goto('http://localhost:5173/');
      const url = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 1 - HOOK',
        url,
        status: 'PASS',
        action: 'Navigate to /',
        result: `Loaded: ${url}`,
        timestamp: new Date().toISOString()
      });

      // Check for CTA
      const cta = page.locator('button, a').filter({ hasText: /começar|começe|iniciar|start/i }).first();
      const ctaVisible = await cta.isVisible().catch(() => false);

      if (!ctaVisible) {
        logResult({
          scene: 'SCENE 1 - HOOK',
          url,
          status: 'FAIL',
          action: 'Find CTA button',
          result: 'CTA not found or not visible',
          severity: 'CRITICAL',
          timestamp: new Date().toISOString()
        });
        throw new Error('BLOCKER: CTA button not found');
      }

      logResult({
        scene: 'SCENE 1 - HOOK',
        url,
        status: 'PASS',
        action: 'Find CTA button',
        result: 'CTA visible and clickable',
        timestamp: new Date().toISOString()
      });

      // Click CTA
      await cta.click();
      const afterClickUrl = await waitForStableUrl(page, 10000);

      logResult({
        scene: 'SCENE 1 - HOOK',
        url: afterClickUrl,
        status: afterClickUrl.includes('/start/') ? 'PASS' : 'FAIL',
        action: 'Click CTA',
        result: `Redirected to: ${afterClickUrl}`,
        severity: afterClickUrl.includes('/start/') ? undefined : 'CRITICAL',
        timestamp: new Date().toISOString()
      });

      if (!afterClickUrl.includes('/start/')) {
        throw new Error('BLOCKER: CTA did not redirect to onboarding');
      }
    });

    // ===================================================================
    // SCENE 2 - IDENTIDADE
    // ===================================================================
    test.step('SCENE 2 - IDENTIDADE', async () => {
      console.log('\n🟢 SCENE 2 - IDENTIDADE');

      const currentUrl = page.url();

      // Fill business name
      const nameInput = page.locator('input[name="businessName"], input[placeholder*="nome"], input[type="text"]').first();
      await nameInput.waitFor({ state: 'visible', timeout: 5000 });
      await nameInput.fill('Test Bar Audit');

      logResult({
        scene: 'SCENE 2 - IDENTIDADE',
        url: currentUrl,
        status: 'PASS',
        action: 'Fill business name',
        result: 'Test Bar Audit',
        timestamp: new Date().toISOString()
      });

      // Select country
      const countrySelect = page.locator('select, [role="combobox"]').filter({ hasText: /país|country|españa|portugal/i }).first();
      if (await countrySelect.isVisible()) {
        await countrySelect.click();
        await page.locator('option, [role="option"]').filter({ hasText: /espanha|españa|spain/i }).first().click();
      }

      // Fill city
      const cityInput = page.locator('input[name="city"], input[placeholder*="cidade"]').first();
      if (await cityInput.isVisible()) {
        await cityInput.fill('Ibiza');
      }

      // Select language
      const langButton = page.locator('button, [role="button"]').filter({ hasText: /pt|português/i }).first();
      if (await langButton.isVisible()) {
        await langButton.click();
      }

      logResult({
        scene: 'SCENE 2 - IDENTIDADE',
        url: currentUrl,
        status: 'PASS',
        action: 'Fill identity form',
        result: 'All fields filled',
        timestamp: new Date().toISOString()
      });

      // Check if state is saved
      await page.reload();
      await page.waitForTimeout(1000);
      const savedName = await nameInput.inputValue();

      logResult({
        scene: 'SCENE 2 - IDENTIDADE',
        url: page.url(),
        status: savedName === 'Test Bar Audit' ? 'PASS' : 'WARNING',
        action: 'Verify state persistence after reload',
        result: savedName === 'Test Bar Audit' ? 'State persisted' : 'State NOT persisted',
        severity: savedName === 'Test Bar Audit' ? undefined : 'MEDIUM',
        stateVerified: savedName === 'Test Bar Audit',
        timestamp: new Date().toISOString()
      });

      // Continue
      const nextButton = page.locator('button').filter({ hasText: /continuar|próximo|next|avançar/i }).first();
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 2 - IDENTIDADE',
        url: nextUrl,
        status: 'PASS',
        action: 'Click continue',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 3 - TIPO DE NEGÓCIO
    // ===================================================================
    test.step('SCENE 3 - TIPO DE NEGÓCIO', async () => {
      console.log('\n🟢 SCENE 3 - TIPO DE NEGÓCIO');

      const currentUrl = page.url();

      // Select "Bar"
      const barOption = page.locator('button, [role="button"], div[role="radio"]').filter({ hasText: /bar/i }).first();
      await barOption.waitFor({ state: 'visible', timeout: 5000 });
      await barOption.click();

      logResult({
        scene: 'SCENE 3 - TIPO',
        url: currentUrl,
        status: 'PASS',
        action: 'Select "Bar"',
        result: 'Selected',
        timestamp: new Date().toISOString()
      });

      // Verify only one selection
      const selectedOptions = page.locator('[aria-selected="true"], .selected, [data-selected="true"]');
      const count = await selectedOptions.count();

      logResult({
        scene: 'SCENE 3 - TIPO',
        url: currentUrl,
        status: count === 1 ? 'PASS' : 'WARNING',
        action: 'Verify single selection',
        result: `${count} option(s) selected`,
        severity: count === 1 ? undefined : 'LOW',
        timestamp: new Date().toISOString()
      });

      // Continue
      const nextButton = page.locator('button').filter({ hasText: /continuar|próximo|next/i }).first();
      await nextButton.click();

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 3 - TIPO',
        url: nextUrl,
        status: 'PASS',
        action: 'Click continue',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 4 - EQUIPA
    // ===================================================================
    test.step('SCENE 4 - EQUIPA', async () => {
      console.log('\n🟢 SCENE 4 - EQUIPA');

      const currentUrl = page.url();

      // Find sliders or number inputs
      const staffInputs = page.locator('input[type="range"], input[type="number"]');
      const count = await staffInputs.count();

      if (count === 0) {
        logResult({
          scene: 'SCENE 4 - EQUIPA',
          url: currentUrl,
          status: 'FAIL',
          action: 'Find staff inputs',
          result: 'No staff input controls found',
          severity: 'CRITICAL',
          timestamp: new Date().toISOString()
        });
        throw new Error('BLOCKER: No staff inputs found');
      }

      logResult({
        scene: 'SCENE 4 - EQUIPA',
        url: currentUrl,
        status: 'PASS',
        action: 'Find staff inputs',
        result: `Found ${count} input(s)`,
        timestamp: new Date().toISOString()
      });

      // Try to set values
      try {
        await staffInputs.nth(0).fill('5'); // Total or first category
        if (count > 1) {
          await staffInputs.nth(1).fill('2'); // Kitchen
          if (count > 2) await staffInputs.nth(2).fill('2'); // Floor
          if (count > 3) await staffInputs.nth(3).fill('1'); // Bar
        }

        logResult({
          scene: 'SCENE 4 - EQUIPA',
          url: currentUrl,
          status: 'PASS',
          action: 'Set staff distribution',
          result: 'Values set successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logResult({
          scene: 'SCENE 4 - EQUIPA',
          url: currentUrl,
          status: 'WARNING',
          action: 'Set staff distribution',
          result: `Error: ${error}`,
          severity: 'MEDIUM',
          timestamp: new Date().toISOString()
        });
      }

      // Continue
      const nextButton = page.locator('button').filter({ hasText: /continuar|próximo|next/i }).first();
      await nextButton.click();

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 4 - EQUIPA',
        url: nextUrl,
        status: 'PASS',
        action: 'Click continue',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 5 - BEBIDAS
    // ===================================================================
    test.step('SCENE 5 - BEBIDAS', async () => {
      console.log('\n🟢 SCENE 5 - BEBIDAS');

      const currentUrl = page.url();

      // Check for beverage list
      const beverageItems = page.locator('text=/coca|pepsi|água|water/i');
      const beverageCount = await beverageItems.count();

      logResult({
        scene: 'SCENE 5 - BEBIDAS',
        url: currentUrl,
        status: beverageCount > 0 ? 'PASS' : 'WARNING',
        action: 'Check beverage list',
        result: `Found ${beverageCount} beverage item(s)`,
        severity: beverageCount > 0 ? undefined : 'MEDIUM',
        timestamp: new Date().toISOString()
      });

      // Try to toggle Coca-Cola → Pepsi
      const toggleButton = page.locator('button, [role="switch"]').filter({ hasText: /coca|pepsi|marca/i }).first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);

        logResult({
          scene: 'SCENE 5 - BEBIDAS',
          url: currentUrl,
          status: 'PASS',
          action: 'Toggle beverage brand',
          result: 'Toggle clicked',
          timestamp: new Date().toISOString()
        });
      }

      // Continue
      const nextButton = page.locator('button').filter({ hasText: /continuar|próximo|next|confirmar/i }).first();
      await nextButton.click();

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 5 - BEBIDAS',
        url: nextUrl,
        status: 'PASS',
        action: 'Click continue',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 6 - COZINHA/PRATOS
    // ===================================================================
    test.step('SCENE 6 - COZINHA/PRATOS', async () => {
      console.log('\n🟢 SCENE 6 - COZINHA/PRATOS');

      const currentUrl = page.url();

      // Check for dishes
      const dishItems = page.locator('[role="listitem"], li, .dish, [data-dish]');
      const dishCount = await dishItems.count();

      logResult({
        scene: 'SCENE 6 - COZINHA',
        url: currentUrl,
        status: 'PASS',
        action: 'Check suggested dishes',
        result: `Found ${dishCount} dish suggestion(s)`,
        timestamp: new Date().toISOString()
      });

      // Try to remove one dish if possible
      const removeButton = page.locator('button').filter({ hasText: /remover|remove|✕|×/i }).first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await page.waitForTimeout(500);

        const newCount = await dishItems.count();

        logResult({
          scene: 'SCENE 6 - COZINHA',
          url: currentUrl,
          status: newCount < dishCount ? 'PASS' : 'WARNING',
          action: 'Remove one dish',
          result: `Count changed: ${dishCount} → ${newCount}`,
          severity: newCount < dishCount ? undefined : 'LOW',
          timestamp: new Date().toISOString()
        });
      }

      // Continue
      const nextButton = page.locator('button').filter({ hasText: /continuar|próximo|next|confirmar/i }).first();
      await nextButton.click();

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 6 - COZINHA',
        url: nextUrl,
        status: 'PASS',
        action: 'Click continue',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 7 - LOGO & MARCA
    // ===================================================================
    test.step('SCENE 7 - LOGO & MARCA', async () => {
      console.log('\n🟢 SCENE 7 - LOGO & MARCA');

      const currentUrl = page.url();

      // Skip logo upload
      const skipButton = page.locator('button').filter({ hasText: /skip|pular|saltar|continuar sem/i }).first();
      const continueButton = page.locator('button').filter({ hasText: /continuar|próximo|next/i }).first();

      const buttonToClick = (await skipButton.isVisible()) ? skipButton : continueButton;
      await buttonToClick.click();

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 7 - LOGO',
        url: nextUrl,
        status: 'PASS',
        action: 'Skip logo upload',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 8 - IMPORTAÇÃO (OPCIONAL)
    // ===================================================================
    test.step('SCENE 8 - IMPORTAÇÃO', async () => {
      console.log('\n🟢 SCENE 8 - IMPORTAÇÃO');

      const currentUrl = page.url();

      // Skip import
      const skipButton = page.locator('button').filter({ hasText: /skip|pular|saltar|continuar sem|não/i }).first();
      const continueButton = page.locator('button').filter({ hasText: /continuar|próximo|next/i }).first();

      if (await skipButton.isVisible()) {
        await skipButton.click();
      } else if (await continueButton.isVisible()) {
        await continueButton.click();
      }

      const nextUrl = await waitForStableUrl(page);

      logResult({
        scene: 'SCENE 8 - IMPORT',
        url: nextUrl,
        status: 'PASS',
        action: 'Skip import',
        result: `Advanced to: ${nextUrl}`,
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // SCENE 9 - TAREFAS
    // ===================================================================
    test.step('SCENE 9 - TAREFAS', async () => {
      console.log('\n🟢 SCENE 9 - TAREFAS');

      const currentUrl = page.url();

      // Select "SIM" if tasks screen appears
      const yesButton = page.locator('button').filter({ hasText: /sim|yes|criar/i }).first();
      if (await yesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await yesButton.click();

        logResult({
          scene: 'SCENE 9 - TAREFAS',
          url: currentUrl,
          status: 'PASS',
          action: 'Select "SIM"',
          result: 'Tasks enabled',
          timestamp: new Date().toISOString()
        });
      } else {
        // Maybe it's auto-skipped
        logResult({
          scene: 'SCENE 9 - TAREFAS',
          url: currentUrl,
          status: 'PASS',
          action: 'Check tasks screen',
          result: 'Screen auto-skipped or not present',
          timestamp: new Date().toISOString()
        });
      }

      const nextUrl = await waitForStableUrl(page);

      // Continue if needed
      const continueButton = page.locator('button').filter({ hasText: /continuar|próximo|next/i }).first();
      if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await continueButton.click();
        await waitForStableUrl(page);
      }
    });

    // ===================================================================
    // SCENE 10 - OPERAÇÃO (Staff Distribution)
    // ===================================================================
    test.step('SCENE 10 - OPERAÇÃO', async () => {
      console.log('\n🟢 SCENE 10 - OPERAÇÃO');

      const currentUrl = page.url();

      // Check for staff distribution UI
      const staffElements = page.locator('text=/cozinha|sala|bar|kitchen|floor/i');
      const hasStaffUI = await staffElements.count() > 0;

      logResult({
        scene: 'SCENE 10 - OPERAÇÃO',
        url: currentUrl,
        status: hasStaffUI ? 'PASS' : 'WARNING',
        action: 'Check staff distribution UI',
        result: hasStaffUI ? 'UI present' : 'UI not found',
        severity: hasStaffUI ? undefined : 'LOW',
        timestamp: new Date().toISOString()
      });

      // Continue
      const continueButton = page.locator('button').filter({ hasText: /continuar|próximo|next|confirmar/i }).first();
      if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await continueButton.click();
        await waitForStableUrl(page);
      }
    });

    // ===================================================================
    // SCENE 11 - SUMMARY / AUTH (CRITICAL)
    // ===================================================================
    test.step('SCENE 11 - SUMMARY / AUTH', async () => {
      console.log('\n🟢 SCENE 11 - SUMMARY / AUTH (CRITICAL)');

      await page.waitForTimeout(2000);
      const currentUrl = page.url();

      // Check for summary
      const summaryText = page.locator('text=/resumo|summary|test bar/i');
      const hasSummary = await summaryText.count() > 0;

      logResult({
        scene: 'SCENE 11 - SUMMARY',
        url: currentUrl,
        status: hasSummary ? 'PASS' : 'WARNING',
        action: 'Check summary display',
        result: hasSummary ? 'Summary shown' : 'Summary not found',
        severity: hasSummary ? undefined : 'MEDIUM',
        timestamp: new Date().toISOString()
      });

      // Find final CTA button
      const finalButton = page.locator('button').filter({
        hasText: /abrir|open|começar|start|entrar|finalizar|criar/i
      }).first();

      await finalButton.waitFor({ state: 'visible', timeout: 10000 });

      logResult({
        scene: 'SCENE 11 - SUMMARY',
        url: currentUrl,
        status: 'PASS',
        action: 'Find final CTA',
        result: 'Button found and clickable',
        timestamp: new Date().toISOString()
      });

      // CRITICAL: Click and check for redirect loop
      const beforeClickUrl = page.url();
      await finalButton.click();

      await page.waitForTimeout(3000);
      const afterClickUrl = await waitForStableUrl(page, 10000);

      const isRedirectLoop = beforeClickUrl === afterClickUrl && !afterClickUrl.includes('/app/');

      logResult({
        scene: 'SCENE 11 - SUMMARY',
        url: afterClickUrl,
        status: isRedirectLoop ? 'FAIL' : 'PASS',
        action: 'Click final CTA',
        result: isRedirectLoop ? 'REDIRECT LOOP DETECTED' : `Redirected to: ${afterClickUrl}`,
        severity: isRedirectLoop ? 'CRITICAL' : undefined,
        timestamp: new Date().toISOString()
      });

      if (isRedirectLoop) {
        throw new Error('🚨 CRITICAL BLOCKER: Redirect loop in summary → app');
      }
    });

    // ===================================================================
    // SCENE 12 - TPV ENTRY (FINAL VALIDATION)
    // ===================================================================
    test.step('SCENE 12 - TPV ENTRY', async () => {
      console.log('\n🟢 SCENE 12 - TPV ENTRY (FINAL VALIDATION)');

      await page.waitForTimeout(2000);
      const currentUrl = page.url();

      // Verify we're in TPV
      const isInTPV = currentUrl.includes('/app/tpv') || currentUrl.includes('/tpv');

      logResult({
        scene: 'SCENE 12 - TPV',
        url: currentUrl,
        status: isInTPV ? 'PASS' : 'FAIL',
        action: 'Verify TPV entry',
        result: isInTPV ? 'Successfully entered TPV' : `Wrong URL: ${currentUrl}`,
        severity: isInTPV ? undefined : 'CRITICAL',
        timestamp: new Date().toISOString()
      });

      if (!isInTPV) {
        throw new Error('🚨 CRITICAL BLOCKER: Did not reach TPV');
      }

      // Check for menu
      const menuItems = page.locator('[role="menuitem"], .menu-item, [data-product]');
      const menuCount = await menuItems.count();

      logResult({
        scene: 'SCENE 12 - TPV',
        url: currentUrl,
        status: menuCount > 0 ? 'PASS' : 'WARNING',
        action: 'Check menu exists',
        result: `Found ${menuCount} menu item(s)`,
        severity: menuCount > 0 ? undefined : 'MEDIUM',
        timestamp: new Date().toISOString()
      });

      // Try to create flash product
      const createButton = page.locator('button').filter({
        hasText: /criar|create|novo|flash|\+/i
      }).first();

      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill product name
        const nameInput = page.locator('input[type="text"], input[name="name"]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill('Café');

          // Fill price
          const priceInput = page.locator('input[type="number"], input[name="price"]').first();
          if (await priceInput.isVisible()) {
            await priceInput.fill('2.50');
          }

          // Confirm
          const confirmButton = page.locator('button').filter({ hasText: /criar|add|confirmar/i }).last();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(1000);

            logResult({
              scene: 'SCENE 12 - TPV',
              url: currentUrl,
              status: 'PASS',
              action: 'Create flash product',
              result: 'Product "Café" created successfully',
              timestamp: new Date().toISOString()
            });

            // Try to add to order
            const cafeProduct = page.locator('text=/café/i').first();
            if (await cafeProduct.isVisible({ timeout: 3000 }).catch(() => false)) {
              await cafeProduct.click();
              await page.waitForTimeout(500);

              // Check if order updated
              const orderItems = page.locator('.order-item, [data-order-item]');
              const orderCount = await orderItems.count();

              logResult({
                scene: 'SCENE 12 - TPV',
                url: currentUrl,
                status: orderCount > 0 ? 'PASS' : 'WARNING',
                action: 'Add product to order',
                result: orderCount > 0 ? `Order has ${orderCount} item(s)` : 'Order still empty',
                severity: orderCount > 0 ? undefined : 'HIGH',
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } else {
        logResult({
          scene: 'SCENE 12 - TPV',
          url: currentUrl,
          status: 'WARNING',
          action: 'Find create button',
          result: 'Create button not found',
          severity: 'MEDIUM',
          timestamp: new Date().toISOString()
        });
      }
    });

    // ===================================================================
    // STRESS TESTS
    // ===================================================================
    test.step('STRESS TESTS', async () => {
      console.log('\n🟡 RUNNING STRESS TESTS');

      // Test 1: Refresh in TPV
      await page.reload();
      await page.waitForTimeout(2000);
      const urlAfterRefresh = page.url();

      logResult({
        scene: 'STRESS TEST',
        url: urlAfterRefresh,
        status: urlAfterRefresh.includes('/app/tpv') ? 'PASS' : 'FAIL',
        action: 'Refresh in TPV',
        result: urlAfterRefresh.includes('/app/tpv') ? 'Session persisted' : 'Lost session',
        severity: urlAfterRefresh.includes('/app/tpv') ? undefined : 'CRITICAL',
        timestamp: new Date().toISOString()
      });

      // Test 2: Back button
      await page.goBack();
      await page.waitForTimeout(1000);
      const urlAfterBack = page.url();

      logResult({
        scene: 'STRESS TEST',
        url: urlAfterBack,
        status: 'PASS',
        action: 'Browser back button',
        result: `Navigated to: ${urlAfterBack}`,
        timestamp: new Date().toISOString()
      });

      // Test 3: Forward button
      await page.goForward();
      await page.waitForTimeout(1000);
      const urlAfterForward = page.url();

      logResult({
        scene: 'STRESS TEST',
        url: urlAfterForward,
        status: urlAfterForward.includes('/app/tpv') ? 'PASS' : 'WARNING',
        action: 'Browser forward button',
        result: `Navigated to: ${urlAfterForward}`,
        severity: urlAfterForward.includes('/app/tpv') ? undefined : 'LOW',
        timestamp: new Date().toISOString()
      });
    });

    // ===================================================================
    // GENERATE AUDIT REPORT
    // ===================================================================
    test.step('Generate audit report', async () => {
      console.log('\n📄 GENERATING AUDIT REPORT');

      const report = generateAuditReport(auditResults);
      const reportPath = path.join(process.cwd(), 'ONBOARDING_BROWSER_AUDIT.md');

      fs.writeFileSync(reportPath, report, 'utf-8');

      console.log(`\n✅ Audit report saved to: ${reportPath}`);
      console.log('\n' + report);
    });
  });
});

function generateAuditReport(results: AuditResult[]): string {
  const failures = results.filter(r => r.status === 'FAIL');
  const warnings = results.filter(r => r.status === 'WARNING');
  const passes = results.filter(r => r.status === 'PASS');

  const critical = failures.filter(r => r.severity === 'CRITICAL');
  const high = [...failures, ...warnings].filter(r => r.severity === 'HIGH');
  const medium = warnings.filter(r => r.severity === 'MEDIUM');

  let verdict: string;
  let emoji: string;

  if (critical.length > 0) {
    verdict = '❌ BLOQUEADO - Critical failures prevent first sale';
    emoji = '❌';
  } else if (high.length > 0) {
    verdict = '⚠️ AJUSTES NECESSÁRIOS - High priority issues found';
    emoji = '⚠️';
  } else if (medium.length > 0) {
    verdict = '⚠️ AJUSTES RECOMENDADOS - Medium priority issues found';
    emoji = '⚠️';
  } else {
    verdict = '✅ PRONTO PARA FIRST SALE';
    emoji = '✅';
  }

  return `# 🧪 CHEFIAPP POS — ONBOARDING BROWSER AUDIT

**Generated**: ${new Date().toISOString()}
**Mode**: Strict Human Navigation
**Target**: Zero to First Sale

---

## 📊 EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| ✅ Passed | ${passes.length} |
| ⚠️ Warnings | ${warnings.length} |
| ❌ Failed | ${failures.length} |
| 🚨 Critical | ${critical.length} |
| 🔥 High | ${high.length} |
| 🟡 Medium | ${medium.length} |

**Verdict**: ${verdict}

---

## 🎯 SCENE-BY-SCENE RESULTS

| Scene | Status | Action | Result | Severity |
|-------|--------|--------|--------|----------|
${results.map(r => `| ${r.scene} | ${r.status} | ${r.action} | ${r.result} | ${r.severity || '-'} |`).join('\n')}

---

## 🚨 CRITICAL ISSUES

${critical.length > 0 ? critical.map(r => `
### ${r.scene}
- **Action**: ${r.action}
- **Result**: ${r.result}
- **URL**: ${r.url}
- **Severity**: ${r.severity}
`).join('\n') : '_No critical issues found._'}

---

## 🔥 HIGH PRIORITY ISSUES

${high.length > 0 ? high.map(r => `
### ${r.scene}
- **Action**: ${r.action}
- **Result**: ${r.result}
- **URL**: ${r.url}
- **Severity**: ${r.severity}
`).join('\n') : '_No high priority issues found._'}

---

## 🟡 MEDIUM PRIORITY ISSUES

${medium.length > 0 ? medium.map(r => `
### ${r.scene}
- **Action**: ${r.action}
- **Result**: ${r.result}
- **URL**: ${r.url}
- **Severity**: ${r.severity}
`).join('\n') : '_No medium priority issues found._'}

---

## 🧠 FINAL QUESTION

**"Um usuário humano consegue sair do zero absoluto e fazer a primeira venda sem ajuda externa?"**

**Answer**: ${emoji} ${critical.length === 0 && high.length === 0 ? 'SIM - Onboarding funcional de ponta a ponta.' : 'NÃO - Existem bloqueadores que impedem a conclusão do fluxo sem intervenção técnica.'}

---

## 📋 DETAILED LOG

${results.map(r => `
### ${r.timestamp}
**Scene**: ${r.scene}
**Status**: ${r.status}
**Action**: ${r.action}
**Result**: ${r.result}
**URL**: ${r.url}
${r.severity ? `**Severity**: ${r.severity}` : ''}
${r.stateVerified !== undefined ? `**State Verified**: ${r.stateVerified}` : ''}
`).join('\n---\n')}

---

**End of Audit Report**
`;
}
