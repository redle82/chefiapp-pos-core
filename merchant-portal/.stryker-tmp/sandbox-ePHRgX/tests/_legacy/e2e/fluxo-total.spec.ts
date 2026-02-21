/**
 * Fluxo Total — E2E (passos 1–4 e smoke 5–8)
 *
 * Valida o fluxo: landing → auth (via / ou opcionalmente /trial-guide) → bootstrap/first-product;
 * smoke check das rotas TPV, dashboard (carregam ou redirecionam, sem 500).
 * /trial-guide abre o Demo Guide do Free Trial; ao sair (CTA "Criar o meu restaurante") → /auth.
 *
 * Referência: docs/implementation/FASE_5_FLUXO_TOTAL_CHECKLIST.md, DECLARACAO_POS_REFATORACAO_WEB_V1.md
 */
// @ts-nocheck


import { expect, test } from "@playwright/test";

test.describe("Fluxo Total — passos 1–4 e smoke 5–8", () => {
  test("Fase 1–2: Demo Guide carrega; /auth acessível", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    const res = await page.goto("/trial-guide", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);
    // App.tsx define redirect /trial-guide → /op/tpv?mode=trial; em E2E pode ficar em /trial-guide
    const url = page.url();
    expect(url).toMatch(/\/trial-guide|\/op\/tpv\?mode=trial|\/auth/);

    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 15000 });
    expect(page.url()).toMatch(/\/auth/);
  });

  test("Fase 2: Auth tem formulário de telefone e CTA", async ({ page }) => {
    await page.goto("/auth", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForLoadState("domcontentloaded");

    // Auth page now shows phone login with "Receber código" button
    const phoneTitle = page.getByRole("heading", {
      name: /Entrar com telefone/i,
    });
    await expect(phoneTitle).toBeVisible({ timeout: 5000 });
  });

  test("Fase 3–4: Rotas bootstrap e first-product carregam (200 ou redirect)", async ({
    page,
  }) => {
    const resBootstrap = await page.goto("/bootstrap", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resBootstrap?.status() ?? 999).toBeLessThan(500);

    const resFirstProduct = await page.goto("/onboarding/first-product", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resFirstProduct?.status() ?? 999).toBeLessThan(500);
  });

  test("Smoke 5–8: Rotas TPV e dashboard carregam (200 ou redirect)", async ({
    page,
  }) => {
    const resTpv = await page.goto("/op/tpv", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resTpv?.status() ?? 999).toBeLessThan(500);

    const resDashboard = await page.goto("/app/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resDashboard?.status() ?? 999).toBeLessThan(500);
  });
});
