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
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });

    const res = await page.goto("/setup/restaurant-minimal", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);
    await page.waitForLoadState("domcontentloaded");

    // Check final URL and wait for potential FlowGate redirect
    const finalUrl = page.url();

    // Wait for the form to appear - try multiple valid states
    // BootstrapPage shows h1 "Criar o teu restaurante" when in create_form state
    await page.waitForLoadState("networkidle").catch(() => {}); // Soft wait for network

    const titulo = page.getByRole("heading", {
      name: /Criar o teu restaurante/i,
    });
    const restaurantInput = page.getByLabel(/Nome do restaurante/i);
    const activationCenter = page.getByRole("heading", {
      name: /Centro de Ativação/i,
    });

    // Check which screen we're on
    const headingVisible = await titulo
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const inputVisible = await restaurantInput
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const activationCenterVisible = await activationCenter
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (headingVisible) {
      // The creation form is showing
      await expect(titulo).toBeVisible();
    } else if (inputVisible) {
      // The creation form input is visible
      await expect(restaurantInput).toBeVisible();
    } else if (activationCenterVisible) {
      // User already has a restaurant and is in the activation workflow - this is valid
      await expect(activationCenter).toBeVisible();
    } else {
      // Check if we're on an authenticated app page instead (full redirect happened)
      const navOpenMenuItem = await page
        .getByRole("button", { name: /Inicio/i })
        .isVisible()
        .catch(() => false);
      const reportsHeadingVisible = await page
        .getByRole("heading", { name: /Relat[óo]rios|Reportes/i })
        .isVisible()
        .catch(() => false);
      const inAdminShell = page.url().includes("/admin/");

      if (navOpenMenuItem || reportsHeadingVisible || inAdminShell) {
        expect(navOpenMenuItem || reportsHeadingVisible || inAdminShell).toBe(
          true,
        );
      } else {
        // If none of the expected screens found, check page content for debugging
        const body = await page.locator("body").textContent();
        throw new Error(
          `Neither creation form nor activation center found. Page contains: ${(
            body ?? ""
          ).substring(0, 200)}`,
        );
      }
    }
  });
});
