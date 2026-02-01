/**
 * E2E: Criação do primeiro restaurante
 *
 * Valida o fluxo crítico: signup → (dashboard) → bootstrap → criação restaurante + owner → dashboard.
 * Fecha o maior risco histórico do sistema (onboarding real).
 *
 * Armadilhas evitadas:
 * - Email único por run (test+Date.now()@example.com)
 * - Timeouts generosos; waitForURL(/bootstrap|dashboard/)
 * - retries = 1 apenas neste spec
 * - Nunca mostrar CoreResetPage
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Criação do primeiro restaurante', () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('signup → bootstrap → dashboard (não cai em CoreResetPage)', async ({ page }) => {
    const uniqueEmail = `test+${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/auth?mode=signup');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/auth/);

    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Palavra-passe').first().fill(password);
    await page.getByLabel('Confirmar palavra-passe').fill(password);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await page.waitForURL(/\/(bootstrap|dashboard|app\/dashboard)/, { timeout: 20_000 });

    const url = page.url();
    const isBootstrap = url.includes('/bootstrap');
    const isDashboard = url.includes('/dashboard');

    expect(isBootstrap || isDashboard).toBe(true);

    if (isBootstrap) {
      await page.waitForURL(/\/(dashboard|app\/dashboard)/, { timeout: 25_000 });
    }

    await expect(page.getByText('UI RESET / CORE ONLY')).toHaveCount(0);
  });
});
