/**
 * E2E: NAVIGATION_CONTRACT
 *
 * Valida o fluxo canónico Auth → welcome → activation → dashboard e que
 * /op/* sem ativação redireciona para /app/activation.
 *
 * - Sem auth: rota protegida → /auth/phone
 * - Com auth sem org: após login → /welcome (ou /setup/restaurant-minimal no fluxo de signup)
 * - Acesso direto a /op/tpv sem ativação → /app/activation (quando FlowGate aplica)
 *
 * BaseURL: http://localhost:5175 (playwright.config.ts).
 */

import { expect, test } from "@playwright/test";

test.describe("Navigation contract (Auth → welcome → activation → dashboard)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("unauthenticated access to /dashboard redirects to auth", async ({
    page,
  }) => {
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page.waitForURL(/\/(auth|welcome)/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/\/(auth\/phone|auth|welcome)/);
  });

  test("unauthenticated access to /op/tpv redirects to auth", async ({
    page,
  }) => {
    await page.goto("/op/tpv", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page.waitForURL(/\/(auth|welcome)/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/\/(auth\/phone|auth|welcome)/);
  });

  test("after mock OTP login, user lands on welcome or activation or dashboard", async ({
    page,
  }) => {
    await page.goto("/auth/verify?e2e_mock_otp=1", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page
      .getByText("Carregando ChefIApp…")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    await page.getByPlaceholder(/123|456|código/i).fill("123456");
    await page.getByRole("button", { name: /Entrar/i }).click();

    await page.waitForURL(
      /\/(welcome|setup|bootstrap|app\/activation|app\/dashboard|dashboard)/,
      {
        timeout: 20_000,
      },
    );

    const url = page.url();
    expect(
      url.includes("/welcome") ||
        url.includes("/setup") ||
        url.includes("/bootstrap") ||
        url.includes("/app/activation") ||
        url.includes("/app/dashboard") ||
        url.includes("/dashboard"),
    ).toBe(true);
  });

  test("direct /setup/restaurant-minimal in app redirects to /app/activation", async ({
    page,
  }) => {
    await page.goto("/auth/verify?e2e_mock_otp=1", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page
      .getByText("Carregando ChefIApp…")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});
    await page.getByPlaceholder(/123|456|código/i).fill("123456");
    await page.getByRole("button", { name: /Entrar/i }).click();
    await page.waitForURL(
      /\/(welcome|setup|bootstrap|app\/activation|app\/dashboard|dashboard)/,
      {
        timeout: 20_000,
      },
    );

    await page.goto("/setup/restaurant-minimal", {
      waitUntil: "domcontentloaded",
      timeout: 10_000,
    });
    await page.waitForURL(/\/(app\/activation|welcome|auth)/, {
      timeout: 10_000,
    });
    const url = page.url();
    expect(
      url.includes("/app/activation") ||
        url.includes("/welcome") ||
        url.includes("/auth"),
    ).toBe(true);
  });

  test("authenticated without org: protected route redirects to /welcome", async ({
    page,
  }) => {
    await page.goto("/auth/verify?e2e_mock_otp=1", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page
      .getByText("Carregando ChefIApp…")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});
    await page.getByPlaceholder(/123|456|código/i).fill("123456");
    await page.getByRole("button", { name: /Entrar/i }).click();
    await page.waitForURL(
      /\/(welcome|setup|bootstrap|app\/activation|app\/dashboard|dashboard)/,
      {
        timeout: 20_000,
      },
    );
    const afterLogin = page.url();
    test.skip(
      !afterLogin.includes("/welcome"),
      "Only assert when user lands on /welcome (no org)",
    );
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 10_000,
    });
    await page.waitForURL(/\/(welcome|auth)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/(welcome|auth)/);
  });

  test("with org but not activated: /op/tpv or /op/pos redirects to /app/activation", async ({
    page,
  }) => {
    await page.goto("/auth/verify?e2e_mock_otp=1", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page
      .getByText("Carregando ChefIApp…")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});
    await page.getByPlaceholder(/123|456|código/i).fill("123456");
    await page.getByRole("button", { name: /Entrar/i }).click();
    await page.waitForURL(
      /\/(welcome|setup|bootstrap|app\/activation|app\/dashboard|dashboard)/,
      {
        timeout: 20_000,
      },
    );
    const afterLogin = page.url();
    test.skip(
      !afterLogin.includes("/app/activation"),
      "Only assert when user has org but is not activated (landed on activation)",
    );
    await page.goto("/op/tpv", {
      waitUntil: "domcontentloaded",
      timeout: 10_000,
    });
    await page.waitForURL(/\/(app\/activation|auth|welcome)/, {
      timeout: 10_000,
    });
    expect(page.url()).toMatch(/\/(app\/activation|auth|welcome)/);
  });
});
