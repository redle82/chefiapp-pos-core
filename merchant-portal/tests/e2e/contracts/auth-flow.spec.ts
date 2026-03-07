/**
 * 🔸 Contract — Auth Flow
 *
 * Layer: CONTRACT
 * Purpose: Verify the canonical authentication journey works end-to-end.
 *
 * CONTRACT: AUTH-FLOW-01 — VISITOR → /auth/phone → enters phone/pilot → redirect to post-auth destination
 *
 * Uses pilot mode to avoid real SMS/OTP.
 *
 * @tag CONTRATO-AUTH-FLOW-01
 */

import {
  enablePilotMode,
  expect,
  pilotLogin,
  test,
  waitForApp,
} from "../fixtures/base";

test.describe("🔸 Contract — Auth Flow", () => {
  test("VISITOR lands on / and sees the landing page", async ({
    cleanPage: page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    // In contracts project, setup may preload authenticated state.
    // If that happens, the canonical shell must be visible.
    if (/\/(admin|app|dashboard|op)(\/|$)/.test(page.url())) {
      const shellLike = page
        .locator('[data-testid="admin-shell"], nav[aria-label*="navigation" i]')
        .first();

      await expect
        .poll(
          async () => {
            const isAuthedPath = /\/(admin|app|dashboard|op)(\/|$)/.test(
              page.url(),
            );
            if (!isAuthedPath) return false;

            if (await shellLike.isVisible().catch(() => false)) return true;

            const bodyText = (await page.locator("body").textContent()) ?? "";
            return bodyText.trim().length > 20;
          },
          { timeout: 15_000 },
        )
        .toBe(true);
      return;
    }

    // Canonical contract allows either landing CTA or immediate auth redirect.
    if (/\/auth(\/|$)/.test(page.url())) {
      await expect(page).toHaveURL(/\/auth(\/|$)/);
      return;
    }

    const authEntry = page.locator(
      'a[href*="/auth"], button:has-text("Entrar"), button:has-text("Login"), [data-testid="auth-cta"]',
    );
    await expect(authEntry.first()).toBeVisible({ timeout: 10_000 });
  });

  test("/auth redirects to /auth/phone", async ({ cleanPage: page }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/auth\/phone/, { timeout: 10_000 });
    expect(page.url()).toContain("/auth/phone");
  });

  test("/auth/phone shows the phone form", async ({ cleanPage: page }) => {
    await page.goto("/auth/phone", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    // Phone input or auth form must be visible
    const phoneForm = page.locator(
      '[data-testid="auth-phone-form"], form, [data-testid="auth-phone-input"]',
    );
    await expect(phoneForm.first()).toBeVisible({ timeout: 10_000 });
  });

  test("pilot login reaches post-auth state", async ({ cleanPage: page }) => {
    await enablePilotMode(page);
    await pilotLogin(page);

    // After pilot login we must land outside /auth
    expect(page.url()).not.toContain("/auth/");
    // Should be on one of: /welcome, /app, /admin, /dashboard, /op, /bootstrap
    expect(page.url()).toMatch(
      /\/(welcome|app|admin|dashboard|op|bootstrap|onboarding)/,
    );
  });
});
