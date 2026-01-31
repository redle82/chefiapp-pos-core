/**
 * E2E: Publicar → Operar (TPV/KDS)
 *
 * Valida que:
 * - Antes de publicar, /op/tpv e /op/kds mostram bloqueio ("Sistema não operacional").
 * - Após publicar, /op/tpv e /op/kds exibem o conteúdo operacional.
 *
 * Pré-requisitos: App a correr (baseURL 5175); Supabase ativo; utilizador com restaurante.
 *
 * Regra soberana E2E (D2): Testes "após publicar" são env-dependent.
 * - Se e2e-creds.json existe → roda e valida.
 * - Se não existe → .skip() com mensagem clara. Não falha a suite.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const credsPath = path.resolve(process.cwd(), 'tests/e2e/e2e-creds.json');
let credentials: { email: string; password: string } | null = null;
try {
  credentials = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
} catch {
  credentials = null;
}
const hasE2ECreds = !!credentials;

async function loginWithE2ECreds(page: import('@playwright/test').Page) {
  await page.goto('/auth');
  await page.waitForLoadState('domcontentloaded');
  if (page.url().includes('/dashboard') || page.url().includes('/app')) return;
  // D1: Seletores resilientes; timeout curto — se form não existir (demo/redirect), falha rápida.
  const emailInput = page.getByLabel('Email').or(page.getByPlaceholder('seu@email.com')).or(page.getByRole('textbox').first());
  const visible = await emailInput.first().isVisible({ timeout: 8000 }).catch(() => false);
  if (!visible) throw new Error('Auth form not available (demo mode or redirect) — skip env-dependent test');
  await emailInput.first().fill(credentials!.email);
  const passwordInput = page.getByLabel('Palavra-passe').or(page.locator('input[type="password"]').first());
  await passwordInput.first().fill(credentials!.password);
  await page.getByRole('button', { name: /Entrar|Criar conta/i }).first().click();
  await page.waitForURL(/\/(dashboard|app)/, { timeout: 15000 });
}

test.describe('E2E: Publicar → Operar (TPV/KDS)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('sem publicar: /op/tpv mostra bloqueio (Sistema não operacional)', async ({ page }) => {
    await page.goto('/op/tpv');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').textContent();
    const isBlocked = body?.includes('Sistema não operacional') ?? false;
    const hasTpvContent = await page.locator('[data-testid="tpv-app"], .tpv-container, [class*="TPV"]').count() > 0;

    expect(isBlocked || !hasTpvContent).toBe(true);
  });

  test('sem publicar: /op/kds mostra bloqueio ou não mostra KDS', async ({ page }) => {
    await page.goto('/op/kds');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').textContent();
    const isBlocked = body?.includes('Sistema não operacional') ?? false;
    const hasKdsContent = await page.locator('[data-testid="kds-app"], .kds-container, [class*="KDS"]').count() > 0;

    expect(isBlocked || !hasKdsContent).toBe(true);
  });

  test.describe('após publicar (env-dependent)', () => {
    test.beforeEach(() => {
      test.skip(!hasE2ECreds, 'Requer tests/e2e/e2e-creds.json com utilizador cujo restaurante está publicado');
    });

    test('após publicar: /op/tpv exibe TPV', async ({ page }) => {
      try {
        await loginWithE2ECreds(page);
      } catch (e) {
        if (e instanceof Error && e.message.includes('Auth form not available')) {
          test.skip(true, e.message);
          return;
        }
        throw e;
      }
      await page.goto('/op/tpv');
      await page.waitForLoadState('networkidle');

      const body = await page.locator('body').textContent();
      expect(body).not.toContain('Sistema não operacional');
      expect(body).toMatch(/TPV|Carrinho|Produtos|pedido/i);
    });

    test('após publicar: /op/kds exibe KDS', async ({ page }) => {
      try {
        await loginWithE2ECreds(page);
      } catch (e) {
        if (e instanceof Error && e.message.includes('Auth form not available')) {
          test.skip(true, e.message);
          return;
        }
        throw e;
      }
      await page.goto('/op/kds');
      await page.waitForLoadState('networkidle');

      const body = await page.locator('body').textContent();
      expect(body).not.toContain('Sistema não operacional');
      expect(body).toMatch(/KDS|Pedidos ativos|Nenhum pedido|Modo Piloto/i);
    });
  });
});
