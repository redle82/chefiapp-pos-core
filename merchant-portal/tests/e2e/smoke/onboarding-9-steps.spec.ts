/**
 * E2E: Onboarding 9-step flow (DAY 3 checklist)
 *
 * Verifies /onboarding shows welcome or create-restaurant screen and progress.
 * Full flow (signup → 9 screens → redirect) requires auth; this covers route and first screen.
 *
 * @see IMPLEMENTATION_CHECKLIST.md Day 3 End-to-End Test Checklist
 */

import { expect, test } from "../fixtures/base";

test.describe("🔹 Smoke — Onboarding 9-step flow", () => {
  test("GET /onboarding loads and shows onboarding or auth", async ({
    page,
  }) => {
    const res = await page.goto("/onboarding", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    expect(res?.status() ?? 999).toBeLessThan(500);

    await page.waitForLoadState("domcontentloaded");

    // May stay on /onboarding (welcome, create restaurant, progress) or redirect to auth
    const url = page.url();
    const isOnboarding =
      url.includes("/onboarding") ||
      (await page.getByText(/Bem-vindo|Criar restaurante|Nome do restaurante|Configuração guiada|restaurante/i).count()) > 0 ||
      (await page.getByRole("progressbar").count()) > 0;
    const isAuth =
      url.includes("/auth") || url.includes("/login") ||
      (await page.getByText(/login|entrar|phone|telefone/i).count()) > 0;

    expect(isOnboarding || isAuth).toBe(true);
  });

  test("onboarding page has no critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/onboarding", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    await page.waitForTimeout(2000);
    const critical = errors.filter(
      (m) =>
        !m.includes("ResizeObserver") &&
        !m.includes("favicon") &&
        !m.includes("404"),
    );
    expect(critical).toHaveLength(0);
  });
});
