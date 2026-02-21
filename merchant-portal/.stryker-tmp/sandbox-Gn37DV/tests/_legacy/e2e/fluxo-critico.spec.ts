/**
 * Fluxo crítico — E2E smoke do happy path operacional.
 *
 * Valida que as rotas do fluxo crítico (Auth → Onboarding → TPV → KDS → Relatórios)
 * carregam sem erro 500. O fluxo completo com dados reais (criar menu, abrir turno,
 * criar pedido, pagar, fechar turno, ver relatório) requer Core em execução e
 * credenciais de teste; pode ser executado manualmente ou em ambiente de staging.
 *
 * Referência: plano "Melhorias uma a uma" — Passo 7.
 */

import { expect, test } from "@playwright/test";

test.describe("Fluxo crítico — smoke das rotas operacionais", () => {
  test("Auth e onboarding: rotas acessíveis", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForURL(/\/(auth\/phone|auth)(\?|$)/, { timeout: 15000 });
    await page.getByText("Carregando ChefIApp…").waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
    await expect(
      page.getByTestId("auth-phone-form").or(
        page.getByTestId("auth-backend-missing"),
      ),
    ).toBeVisible({ timeout: 15000 });

    const resBootstrap = await page.goto("/bootstrap", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resBootstrap?.status() ?? 999).toBeLessThan(500);

    const resOnboarding = await page.goto("/onboarding/first-product", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resOnboarding?.status() ?? 999).toBeLessThan(500);
  });

  test("TPV e KDS: rotas carregam (200 ou redirect para auth)", async ({
    page,
  }) => {
    const resTpv = await page.goto("/op/tpv", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resTpv?.status() ?? 999).toBeLessThan(500);

    const resKds = await page.goto("/op/kds", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resKds?.status() ?? 999).toBeLessThan(500);
  });

  test("Dashboard e relatórios: rotas carregam (200 ou redirect)", async ({
    page,
  }) => {
    const resDashboard = await page.goto("/app/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resDashboard?.status() ?? 999).toBeLessThan(500);

    const resReports = await page.goto("/app/reports/saft-export", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(resReports?.status() ?? 999).toBeLessThan(500);
  });
});
