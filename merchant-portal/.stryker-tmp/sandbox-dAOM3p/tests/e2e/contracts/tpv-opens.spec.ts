/**
 * 🔸 Contract — TPV Opens
 *
 * Layer: CONTRACT
 * Purpose: Verify the TPV (Terminal Ponto de Venda) loads correctly in trial mode.
 *
 * Contract: /op/tpv?mode=trial renders the POS interface with product cards or empty state.
 *           The URL must include mode=trial query param.
 *
 * @tag CONTRATO-TPV-01
 */
// @ts-nocheck


import { expect, test, waitForApp } from "../fixtures/base";

test.describe("🔸 Contract — TPV", () => {
  // Uses storageState (pilot auth) — trial TPV needs operational base
  test("trial TPV loads and shows products or empty state", async ({
    page,
  }) => {
    await page.goto("/op/tpv?mode=trial", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    // Gate 1: Must stay on /op/tpv with trial mode
    expect(page.url()).toContain("/op/tpv");
    expect(page.url()).toContain("mode=trial");

    // Gate 2: TPV must render meaningful POS content
    const productCard = page.locator('[data-testid="product-card"]');
    const tpvContent = page.locator(
      '[data-testid*="tpv"], [data-testid*="pos"], [class*="tpv"], [class*="pos"]',
    );
    const emptyState = page.getByText(
      /sem produtos|nenhum produto|adicionar produto|menu vazio/i,
    );

    // At least one of these should be visible within 20s
    await expect(
      productCard.first().or(tpvContent.first()).or(emptyState.first()),
    ).toBeVisible({ timeout: 20_000 });

    // Gate 3: No crash indicators — body must have substantial content
    const bodyText = await page.locator("body").textContent();
    expect((bodyText ?? "").length).toBeGreaterThan(20);
  });
});
