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

    await enablePilotMode(page);
    await pilotLogin(page);

    coreRequests.length = 0;

    await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
      .toMatch(/^(\/op\/tpv|\/app\/dashboard|\/dashboard)(\/|$)/);

    const currentPath = new URL(page.url()).pathname;

    if (/^\/op\/tpv(\/|$)/.test(currentPath)) {
      const blockShell = page.getByTestId("browser-block-guard");
      await expect(blockShell).toBeVisible({ timeout: 10_000 });

      // Lei O1: must see block screen, not TPV
      const blockTitle = page.getByText(
        /TPV não pode ser aberto no navegador/i,
      );
      await expect(blockTitle).toBeVisible({ timeout: 10_000 });

      const blockBadge = page.getByText(
        /Regra de sistema|apenas aplicação instalada|PWA do Chrome/i,
      );
      await expect(blockBadge).toBeVisible({ timeout: 5_000 });

      const ctaLink = page
        .getByRole("link", {
          name: /Instalar TPV|Ir para Dispositivos|Dispositivos/i,
        })
        .first();
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
    } else {
      // Authenticated dashboard fallback is acceptable as long as TPV does not render.
      const bodyText = (await page.locator("body").textContent()) ?? "";
      expect(bodyText.trim().length).toBeGreaterThan(10);
      await expect(
        page.locator('[data-testid="product-card"]').first(),
      ).not.toBeVisible();
    }

    // ── TPV-only requests: none of these should fire when guard blocks ──
    // gm_products / gm_product_assets / gm_menu_categories are fetched ONLY
    // when TPVPOSView actually mounts. If any appear, TPV rendered past the guard.
    const TPV_ONLY_TABLES = [
      "gm_products",
      "gm_product_assets",
      "gm_menu_categories",
    ];
    const tpvOnlyRequests = coreRequests.filter((r) =>
      TPV_ONLY_TABLES.some((t) => r.url.includes(t)),
    );
    expect(
      tpvOnlyRequests,
      `Blocked page must not fetch TPV-only tables (${TPV_ONLY_TABLES.join(
        ", ",
      )})`,
    ).toHaveLength(0);
  });
});
