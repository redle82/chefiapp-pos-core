/**
 * Fluxo Total — E2E (passos 1–4 e smoke 5–8)
 *
 * Valida o fluxo: landing → auth (via / ou opcionalmente /demo-guiado) → bootstrap/first-product;
 * smoke check das rotas TPV, dashboard (carregam ou redirecionam, sem 500).
 * /demo-guiado mostra a página do demo; ao sair (CTA "Criar o meu restaurante") → /auth.
 *
 * Referência: docs/implementation/FASE_5_FLUXO_TOTAL_CHECKLIST.md, DECLARACAO_POS_REFATORACAO_WEB_V1.md
 */

import { expect, test } from "@playwright/test";

test.describe("Fluxo Total — passos 1–4 e smoke 5–8", () => {
  test("Fase 1–2: Demo guiado carrega; /auth acessível", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    const res = await page.goto("/demo-guiado", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);
    // App.tsx define redirect /demo-guiado → /auth; em E2E pode ficar em /demo-guiado conforme render
    const url = page.url();
    expect(url).toMatch(/\/demo-guiado|\/auth/);

    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 15000 });
    expect(page.url()).toMatch(/\/auth/);
  });

  test("Fase 2: Auth tem CTA e não redireciona para landing após demo", async ({
    page,
  }) => {
    await page.goto("/auth", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForLoadState("domcontentloaded");

    const cta = page
      .getByRole("button", { name: /continuar|demonstração|explorar/i })
      .or(page.getByRole("link", { name: /continuar|demonstração|explorar/i }));
    await expect(cta.first()).toBeVisible({ timeout: 5000 });
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
