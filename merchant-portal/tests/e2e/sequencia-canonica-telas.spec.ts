/**
 * E2E: Sequência Canônica v1.0 — Validação de telas
 *
 * Contrato: docs/contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10
 * Valida que as telas mostram o fluxo oficial (8 passos) e o copy correto.
 */

import { expect, test } from "@playwright/test";

test.describe("Sequência Canônica v1.0 — Telas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("Passo 1–2: Landing e Auth acessíveis", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await expect(page).toHaveURL(/\//);
    const cta = page.locator('a[href*="/auth"]').first();
    await expect(cta).toBeVisible({ timeout: 8000 });

    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 15000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test("Passo 3: Bootstrap mostra 'Passo 3 de 8' e novo fluxo (data-canonical-flow)", async ({
    page,
  }) => {
    const res = await page.goto("/bootstrap", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByText(/Passo 3 de 8/, { exact: false })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("[data-canonical-flow=v1.0][data-step=3]")
    ).toBeVisible({ timeout: 3000 });
  });

  test("Passo 4: First product mostra 'Passo 4 de 8', opcional e novo fluxo (data-canonical-flow)", async ({
    page,
  }) => {
    const res = await page.goto("/onboarding/first-product", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByText(/Passo 4 de 8/, { exact: false })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("[data-canonical-flow=v1.0][data-step=4]")
    ).toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole("button", { name: /Continuar sem adicionar agora/i })
    ).toBeVisible({ timeout: 3000 });
  });

  test("First product: botões 'Continuar sem adicionar agora' e 'Ir à web de configuração' existem", async ({
    page,
  }) => {
    await page.goto("/onboarding/first-product", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForLoadState("domcontentloaded");

    const skipBtn = page.getByRole("button", {
      name: /Continuar sem adicionar agora/i,
    });
    await expect(skipBtn).toBeVisible({ timeout: 5000 });

    const webBtn = page.getByRole("button", {
      name: /Ir à web de configuração/i,
    });
    await expect(webBtn).toBeVisible({ timeout: 3000 });
  });
});
