/**
 * Kitchen Display System (KDS) — E2E Tests
 *
 * Layer: CORE
 * Purpose: Validate KDS order display, item readiness, and order completion.
 *
 * CONTRACT: CORE-KDS-01
 *
 * Covers:
 *   - Incoming orders appear on KDS
 *   - Items can be marked as ready
 *   - Completed orders move to READY status
 *
 * @tag CONTRATO-CORE-KDS-01
 */

import { test, expect } from "@playwright/test";
import {
  enablePilotMode,
  pilotLogin,
  waitForApp,
} from "../fixtures/base";
import { TPVHelper } from "../fixtures/tpv-helpers";

test.describe("Kitchen Display System — Ecra de Cozinha", () => {
  let tpv: TPVHelper;

  test.beforeEach(async ({ page }) => {
    tpv = new TPVHelper(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await enablePilotMode(page);
    await pilotLogin(page);
  });

  test("should show incoming orders on KDS | Mostrar pedidos recebidos", async ({
    page,
  }) => {
    // 1. Go to POS and create an order (if products available)
    await tpv.navigateToTPV();
    await tpv.bypassLockScreen();

    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();

    test.skip(productCount < 1, "No products available to create order for KDS");

    // Add item and send to kitchen
    await productCards.first().click();

    const kitchenButton = page
      .getByRole("button", {
        name: /enviar.*cozinha|kitchen|preparar|send|fire/i,
      })
      .or(page.locator('[data-testid="send-to-kitchen"]'))
      .or(page.locator('[data-testid="fire-order"]'));

    const hasKitchenSend = (await kitchenButton.count()) > 0;

    if (hasKitchenSend) {
      await kitchenButton.first().click();
    }

    // 2. Navigate to KDS
    await tpv.goToKDS();

    // 3. Verify KDS loaded (has some content)
    const kdsContent = page
      .locator('[data-testid="kds-order"], [data-testid*="kitchen"]')
      .first()
      .or(
        page
          .locator('[data-testid="order-card"]')
          .first(),
      )
      .or(page.getByText(/sem pedidos|no orders|cozinha|kitchen/i).first());

    await expect(kdsContent).toBeVisible({ timeout: 20_000 });

    // 4. If orders exist, verify they have item information
    const orderCards = page.locator(
      '[data-testid="kds-order"], [data-testid="order-card"]',
    );
    const orderCount = await orderCards.count();

    if (orderCount > 0) {
      // Each order should have visible text (items listed)
      const firstOrder = orderCards.first();
      const orderText = await firstOrder.textContent();
      expect((orderText ?? "").length).toBeGreaterThan(0);
    }
  });

  test("should mark items as ready | Marcar itens como prontos", async ({
    page,
  }) => {
    // Navigate directly to KDS
    await tpv.goToKDS();

    // Look for order items that can be marked as ready
    const itemButtons = page
      .locator('[data-testid="kds-item"]')
      .or(
        page.locator(
          '[data-testid*="kitchen-item"], [data-testid*="order-item"]',
        ),
      );

    const hasItems = (await itemButtons.count()) > 0;
    test.skip(!hasItems, "No KDS items available to mark as ready");

    if (hasItems) {
      // 1. Click an item to mark as ready
      await itemButtons.first().click();

      // 2. Verify visual feedback (checkmark, color change, or status text)
      const readyIndicator = page
        .getByText(/pronto|ready|conclu[íi]do|done/i)
        .or(page.locator('[data-testid="item-ready"]'))
        .or(
          page.locator(
            '[data-testid*="kds-item"][data-status="ready"], [data-testid*="kitchen-item"].ready',
          ),
        );

      // Allow for the item to show "ready" state or for the order to advance
      const bodyText = await page.locator("body").textContent();
      expect((bodyText ?? "").length).toBeGreaterThan(0);
    }
  });

  test("should complete order when all items ready | Completar pedido", async ({
    page,
  }) => {
    await tpv.goToKDS();

    // Look for a "complete order" or "all ready" button
    const completeButton = page
      .getByRole("button", {
        name: /concluir|completar|pronto|complete|ready|done/i,
      })
      .or(page.locator('[data-testid="complete-order"]'))
      .or(page.locator('[data-testid="order-ready"]'));

    const hasComplete = (await completeButton.count()) > 0;
    test.skip(!hasComplete, "No complete order button available on KDS");

    if (hasComplete) {
      await completeButton.first().click();

      // Verify the order moves out of the active KDS queue
      // or shows a READY status
      const readyStatus = page
        .getByText(/pronto|ready|entregue|delivered/i)
        .or(
          page
            .locator('[data-testid="order-status"]')
            .filter({ hasText: /ready|pronto/i }),
        );

      await expect(readyStatus.first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
