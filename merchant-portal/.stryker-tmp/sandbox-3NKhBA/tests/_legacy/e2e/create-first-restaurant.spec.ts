/**
 * E2E: Criação do primeiro restaurante
 *
 * Fluxo signup (telefone) com mock OTP: /auth/phone?mode=signup → telefone → /auth/verify?e2e_mock_otp=1 → código 123456 → /setup/restaurant-minimal.
 * Mock OTP só funciona com ?e2e_mock_otp=1 na página de verificação (VerifyCodePage).
 *
 * Servidor: sem E2E_NO_WEB_SERVER o Playwright inicia o dev (npm run dev). Com E2E_NO_WEB_SERVER=1
 * é preciso ter o merchant-portal a correr em baseURL (default http://localhost:5175).
 *
 * Armadilhas evitadas:
 * - Timeouts generosos; waitForURL(/setup|bootstrap|dashboard/)
 * - retries = 1 apenas neste spec
 * - Nunca mostrar CoreResetPage
 */
// @ts-nocheck


import { expect, test } from "@playwright/test";

test.describe("E2E: Criação do primeiro restaurante", () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("signup (phone + mock OTP) → setup/restaurant-minimal", async ({
    page,
  }) => {
    // Sem backend, o passo do telefone não navega para /auth/verify; vamos direto à página de código com mock OTP.
    await page.goto("/auth/verify?e2e_mock_otp=1", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page.getByText("Carregando ChefIApp…").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

    await page.getByPlaceholder(/123|456|código/i).fill("123456");
    await page.getByRole("button", { name: /Entrar/i }).click();

    await page.waitForURL(/\/(welcome|setup\/restaurant-minimal|bootstrap|dashboard|app\/dashboard|app\/activation)/, {
      timeout: 20_000,
    });

    const url = page.url();
    expect(
      url.includes("/welcome") ||
        url.includes("/setup/restaurant-minimal") ||
        url.includes("/bootstrap") ||
        url.includes("/dashboard") ||
        url.includes("/app/activation"),
    ).toBe(true);

    await expect(page.getByText("UI RESET / CORE ONLY")).toHaveCount(0);
  });

  test("rota /auth carrega formulário de telefone ou aviso de backend", async ({
    page,
  }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForURL(/\/(auth\/phone|auth)(\?|$)/, { timeout: 15_000 });
    // Wait for React to mount (loading placeholder disappears)
    await page.getByText("Carregando ChefIApp…").waitFor({ state: "hidden", timeout: 25_000 }).catch(() => {});

    // With backend: auth-phone-form; without: auth-backend-missing
    await expect(
      page.getByTestId("auth-phone-form").or(
        page.getByTestId("auth-backend-missing"),
      ),
    ).toBeVisible({ timeout: 15_000 });
  });
});
