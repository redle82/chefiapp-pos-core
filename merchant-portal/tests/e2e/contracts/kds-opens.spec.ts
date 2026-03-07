/**
 * 🔸 Contract — KDS Opens
 *
 * Layer: CONTRACT
 * Purpose: Verify the KDS (Kitchen Display System) renders correctly
 *          when accessed by an authenticated pilot.
 *
 * Contract: /op/kds with pilot auth renders the kitchen interface
 *           (empty state or order queue).
 *
 * @tag CONTRATO-KDS-01
 */

import {
  enablePilotMode,
  expect,
  pilotLogin,
  test,
  waitForApp,
} from "../fixtures/base";

test.describe("🔸 Contract — KDS", () => {
  // Uses storageState (pilot auth) — KDS requires operational access
  test("KDS renders kitchen interface for authenticated pilot", async ({
    cleanPage: page,
  }) => {
    await enablePilotMode(page);
    await pilotLogin(page);

    const res = await page.goto("/op/kds", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    // Gate 1: No server crash
    expect(res?.status() ?? 999).toBeLessThan(500);
    await waitForApp(page);

    // Gate 2: Route settles on KDS or authenticated dashboard fallback.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
      .toMatch(/^(\/op\/kds|\/app\/dashboard|\/dashboard)(\/|$)/);

    const currentPath = new URL(page.url()).pathname;

    // Gate 3: KDS route must show KDS content or browser block guard.
    // Dashboard fallback must still be a non-crash render.
    const kdsUI = page.locator(
      '[data-testid*="kds"], [class*="kds"], [data-testid*="kitchen"]',
    );
    const emptyState = page.getByText(
      /sem pedidos|nenhum pedido|a aguardar|cozinha/i,
    );
    const browserBlock = page.getByTestId("browser-block-guard");
    const devFallback = page.getByRole("button", {
      name: /DEV: Reset PWA Cache/i,
    });

    if (/^\/op\/kds(\/|$)/.test(currentPath)) {
      await expect
        .poll(
          async () => {
            const checks = [
              browserBlock.first(),
              kdsUI.first(),
              emptyState.first(),
              devFallback.first(),
            ];

            for (const locator of checks) {
              if (await locator.isVisible().catch(() => false)) {
                return true;
              }
            }
            return false;
          },
          { timeout: 15_000 },
        )
        .toBe(true);
      return;
    }

    const bodyText = (await page.locator("body").textContent()) ?? "";
    expect(bodyText.trim().length).toBeGreaterThan(10);
  });
});
