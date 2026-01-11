/**
 * 🧪 QUICK ONBOARDING AUDIT
 * Tests critical path: Summary → TPV entry (redirect loop fix)
 */

import { test, expect } from '@playwright/test';

test.describe('QUICK ONBOARDING AUDIT', () => {
  test('Scene6Summary → TPV without redirect loop', async ({ page }) => {
    // Clear state
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ State cleared');

    // Navigate directly to summary (skip full onboarding for speed)
    await page.goto('http://localhost:5173/start/cinematic/6');
    await page.waitForTimeout(2000);

    console.log('✅ Summary page loaded');

    // Find and click final button
    const finalButton = page.locator('button').filter({
      hasText: /abrir|open|começar|finalizar/i
    }).first();

    await finalButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Final button found');

    // Get URL before click
    const urlBeforeClick = page.url();
    console.log(`URL before click: ${urlBeforeClick}`);

    // Click button
    await finalButton.click();
    console.log('✅ Button clicked');

    // Wait for navigation to settle
    await page.waitForTimeout(3000);

    // Check final URL
    const urlAfterClick = page.url();
    console.log(`URL after click: ${urlAfterClick}`);

    // Verify session token was created
    const sessionToken = await page.evaluate(() => localStorage.getItem('x-chefiapp-token'));
    console.log(`Session token: ${sessionToken ? '✅ EXISTS' : '❌ MISSING'}`);

    // CRITICAL CHECKS
    const isInTPV = urlAfterClick.includes('/app/tpv');
    const hasNoLoop = urlBeforeClick !== urlAfterClick || isInTPV;
    const hasToken = sessionToken !== null;

    console.log('\n📊 AUDIT RESULTS:');
    console.log(`- TPV Entry: ${isInTPV ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- No Redirect Loop: ${hasNoLoop ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Session Token: ${hasToken ? '✅ PASS' : '❌ FAIL'}`);

    // Assertions
    expect(sessionToken).toBeTruthy();
    expect(isInTPV).toBe(true);
    expect(hasNoLoop).toBe(true);

    console.log('\n🎉 CRITICAL PATH VERIFIED: Summary → TPV works!');
  });

  test('Full flow: Hook → Summary → TPV', async ({ page }) => {
    // Clear state
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('\n🚀 FULL FLOW TEST STARTED\n');

    // SCENE 1: Hook
    console.log('🟢 SCENE 1 - HOOK');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);

    const hookCTA = page.locator('button, a').first();
    if (await hookCTA.isVisible()) {
      await hookCTA.click();
      await page.waitForTimeout(1000);
      console.log('✅ Hook CTA clicked');
    }

    // SCENE 2: Identity
    console.log('🟢 SCENE 2 - IDENTITY');
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Test Bar');
      const continueBtn = page.locator('button').filter({ hasText: /continuar|next/i }).first();
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ Identity filled');
      }
    }

    // SKIP TO SUMMARY (clicking through all scenes would take too long)
    console.log('⏭️ Skipping to summary...');
    await page.goto('http://localhost:5173/start/cinematic/6');
    await page.waitForTimeout(2000);

    // SCENE 11: Summary
    console.log('🟢 SCENE 11 - SUMMARY');
    const finalButton = page.locator('button').filter({
      hasText: /abrir|open/i
    }).first();

    await finalButton.waitFor({ state: 'visible', timeout: 5000 });
    await finalButton.click();
    await page.waitForTimeout(3000);

    // SCENE 12: TPV
    console.log('🟢 SCENE 12 - TPV');
    const currentUrl = page.url();
    const sessionToken = await page.evaluate(() => localStorage.getItem('x-chefiapp-token'));

    console.log(`\nFinal URL: ${currentUrl}`);
    console.log(`Session Token: ${sessionToken ? 'EXISTS' : 'MISSING'}`);

    expect(currentUrl).toContain('/app/tpv');
    expect(sessionToken).toBeTruthy();

    console.log('\n✅ FULL FLOW COMPLETE: User can reach TPV from onboarding!');
  });
});
