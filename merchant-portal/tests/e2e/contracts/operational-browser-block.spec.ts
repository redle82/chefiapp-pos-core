/**
 * 🔸 Contract — Operational Browser Block (Lei O1)
 *
 * Layer: CONTRACT
 * Purpose: Verify OPERATIONAL_DEVICE_ONLY_CONTRACT Lei O1 — /op/tpv blocked in plain browser.
 *
 * Opens /op/tpv in a normal browser tab (no Electron, no ?mode=trial).
 * Expects: block screen with "TPV não pode ser aberto no navegador" and CTA to Dispositivos.
 *
 * @tag OPERATIONAL-BROWSER-BLOCK
 */

import {
  enablePilotMode,
  expect,
  pilotLogin,
  test,
  waitForApp,
} from "../fixtures/base";

test.describe("🔸 Contract — Operational Browser Block", () => {
  test("/op/tpv in plain browser shows block screen, not TPV content", async ({
    cleanPage: page,
  }) => {
    const coreRequests: { url: string }[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("/rest/v1/gm_") ||
        url.includes("/rpc/") ||
        url.includes("gm_products") ||
        url.includes("gm_orders")
      ) {
        coreRequests.push({ url });
      }
    });

    enablePilotMode(page);
    await pilotLogin(page);

    coreRequests.length = 0;

    await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    const blockShell = page.getByTestId("browser-block-guard");
    await expect(blockShell).toBeVisible({ timeout: 10_000 });

    // Lei O1: must see block screen, not TPV
    const blockTitle = page.getByText(/TPV não pode ser aberto no navegador/i);
    await expect(blockTitle).toBeVisible({ timeout: 10_000 });

    const blockBadge = page.getByText(
      /Regra de sistema|apenas aplicação instalada/i,
    );
    await expect(blockBadge).toBeVisible({ timeout: 5_000 });

    const ctaLink = page.getByRole("link", {
      name: /Ir para Dispositivos|Dispositivos/i,
    });
    await expect(ctaLink).toBeVisible();
    expect(await ctaLink.getAttribute("href")).toMatch(/\/admin\/devices/);

    // Must NOT render TPV content
    const tpvContent = page.locator('[data-testid="product-card"]').first();
    await expect(tpvContent).not.toBeVisible();

    // No TPV UI buttons (Proceed, Print Receipt, etc.)
    const tpvButtons = page.getByRole("button", {
      name: /Proceed|Print Receipt|Imprimir|Faturar|Pagar/i,
    });
    await expect(tpvButtons).toHaveCount(0);

    // No TPV catalog request — if guard bypassed, product grid would fetch gm_products
    const catalogRequests = coreRequests.filter((r) =>
      r.url.includes("gm_products"),
    );
    expect(
      catalogRequests,
      "Blocked page must not fetch TPV product catalog",
    ).toHaveLength(0);
  });
});
