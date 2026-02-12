/**
 * E2E: Sequência Canônica v1.0 — Validação de telas
 *
 * Contrato: docs/contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10
 * Valida que as telas mostram o fluxo oficial (8 passos) e o copy correto.
 */

import { expect, test } from "@playwright/test";

test.describe("Fluxo telefone → setup mínimo → dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("Landing aponta para login por telefone (/auth/phone)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await expect(page).toHaveURL(/\//);
    // Landing links to /auth which redirects to /auth/phone
    const ctaAuth = page.locator('a[href*="/auth"]').first();
    await expect(ctaAuth).toBeVisible({ timeout: 8000 });
  });

  test("Auth por telefone acessível e redirecionamento canónico /auth → /auth/phone", async ({
    page,
  }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 15000 });
    await expect(page).toHaveURL(/\/auth\/phone/);
    const titulo = page.getByText("Entrar com telefone");
    await expect(titulo).toBeVisible();
  });

  test("Bootstrap/setup mínimo carrega formulário de criação de restaurante", async ({
    page,
  }) => {
    // Prevent AUTO-PILOT from re-activating pilot/mock auth on page load
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      localStorage.setItem("chefiapp_skip_auto_pilot", "true");
    });

    const res = await page.goto("/setup/restaurant-minimal", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);
    await page.waitForLoadState("domcontentloaded");

    // Setup mínimo mostra formulário de criação de restaurante
    const titulo = page.getByRole("heading", {
      name: /Criar o teu restaurante/i,
    });
    await expect(titulo).toBeVisible({ timeout: 20000 });
  });
});
