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
// @ts-nocheck


import { expect, test, waitForApp } from "../fixtures/base";

test.describe("🔸 Contract — KDS", () => {
  // Uses storageState (pilot auth) — KDS requires operational access
  test("KDS renders kitchen interface for authenticated pilot", async ({
    page,
  }) => {
    const res = await page.goto("/op/kds", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    // Gate 1: No server crash
    expect(res?.status() ?? 999).toBeLessThan(500);
    await waitForApp(page);

    // Gate 2: Must stay on /op/kds (pilot has access)
    expect(page.url()).toContain("/op/kds");

    // Gate 3: KDS content must be visible — kitchen UI or empty state
    const kdsUI = page.locator(
      '[data-testid*="kds"], [class*="kds"], [data-testid*="kitchen"]',
    );
    const emptyState = page.getByText(
      /sem pedidos|nenhum pedido|a aguardar|cozinha/i,
    );
    await expect(kdsUI.first().or(emptyState.first())).toBeVisible({
      timeout: 15_000,
    });
  });
});
