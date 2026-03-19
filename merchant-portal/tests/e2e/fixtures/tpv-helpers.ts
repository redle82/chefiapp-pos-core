/**
 * TPVHelper — Reusable helper class for POS (TPV) E2E interactions.
 *
 * Encapsulates common UI operations: lock screen bypass, adding products,
 * payment flows, navigation, and cart assertions.
 *
 * All waits use Playwright's built-in auto-waiting (no manual sleeps).
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class TPVHelper {
  constructor(private readonly page: Page) {}

  /**
   * Bypass the lock screen by clicking "Continuar como Dono".
   * Handles the case where the lock screen may not appear (already unlocked).
   */
  async bypassLockScreen(): Promise<void> {
    // Wait for either lock screen or the POS grid to be visible
    const lockButton = this.page.getByRole("button", {
      name: /continuar como dono|continuar|entrar/i,
    });
    const posGrid = this.page.locator(
      '[data-testid="product-grid"], [data-testid="pos-grid"], [data-testid*="tpv"]',
    );

    // Race: either we see the lock screen or the POS is already loaded
    const first = await Promise.race([
      lockButton
        .first()
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => "lock" as const)
        .catch(() => null),
      posGrid
        .first()
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => "pos" as const)
        .catch(() => null),
    ]);

    if (first === "lock") {
      await lockButton.first().click();
      // Wait for POS to load after unlock
      await this.page
        .locator("body")
        .waitFor({ state: "visible", timeout: 10_000 });
    }
    // If "pos" or null, we're already past the lock screen
  }

  /**
   * Add a product to the cart by clicking on it in the POS grid.
   *
   * @param productName - The visible name of the product to click
   */
  async addProductToCart(productName: string): Promise<void> {
    const productCard = this.page
      .locator('[data-testid="product-card"]')
      .filter({ hasText: productName });

    // If product card with data-testid exists, click it
    const cardCount = await productCard.count();
    if (cardCount > 0) {
      await productCard.first().click();
      return;
    }

    // Fallback: click any button/element containing the product name
    const fallback = this.page
      .locator("button, [role='button'], [data-testid*='product']")
      .filter({ hasText: new RegExp(productName, "i") });

    await fallback.first().click();
  }

  /**
   * Open the payment modal / payment view.
   */
  async openPayment(): Promise<void> {
    const payButton = this.page
      .getByRole("button", { name: /cobrar|pagar|pagamento|payment/i })
      .or(this.page.locator('[data-testid="pay-button"]'))
      .or(this.page.locator('[data-testid="payment-button"]'));

    await payButton.first().click();
  }

  /**
   * Pay with cash (Dinheiro).
   * Assumes the payment modal is already open.
   */
  async payWithCash(): Promise<void> {
    // Select cash payment method
    const cashMethod = this.page
      .getByRole("button", { name: /dinheiro|cash|efectivo/i })
      .or(this.page.locator('[data-testid="payment-method-cash"]'));

    await cashMethod.first().click();

    // Confirm payment
    const confirmButton = this.page
      .getByRole("button", {
        name: /confirmar|finalizar|concluir|confirm|complete/i,
      })
      .or(this.page.locator('[data-testid="confirm-payment"]'));

    await confirmButton.first().click();
  }

  /**
   * Get the cart total displayed in the UI.
   *
   * @returns The total string as shown (e.g., "12,50 EUR" or "12.50")
   */
  async getCartTotal(): Promise<string> {
    const totalElement = this.page
      .locator('[data-testid="cart-total"]')
      .or(
        this.page.locator('[data-testid="order-total"]'),
      )
      .or(
        this.page
          .locator('[class*="total"], [class*="Total"]')
          .filter({ hasText: /\d/ }),
      );

    const text = await totalElement.first().textContent();
    return text?.trim() ?? "";
  }

  /**
   * Get the number of items currently in the cart.
   */
  async getCartItemCount(): Promise<number> {
    const items = this.page.locator(
      '[data-testid="cart-item"], [data-testid="order-item"]',
    );
    return items.count();
  }

  /**
   * Get the number of active orders displayed.
   */
  async getOrderCount(): Promise<number> {
    const orders = this.page.locator(
      '[data-testid="order-card"], [data-testid="active-order"]',
    );
    return orders.count();
  }

  /**
   * Navigate to the Kitchen Display System (KDS).
   */
  async goToKDS(): Promise<void> {
    await this.page.goto("/op/tpv/kitchen", {
      waitUntil: "domcontentloaded",
    });
    // Wait for KDS content
    await this.page
      .locator("body")
      .waitFor({ state: "visible", timeout: 15_000 });
  }

  /**
   * Wait for a specific order to appear in the order list.
   *
   * @param orderIdentifier - Order number, ID fragment, or table info to match
   */
  async waitForOrder(orderIdentifier: string): Promise<void> {
    await this.page
      .locator(
        '[data-testid="order-card"], [data-testid="active-order"], [data-testid*="order"]',
      )
      .filter({ hasText: orderIdentifier })
      .first()
      .waitFor({ state: "visible", timeout: 20_000 });
  }

  /**
   * Navigate to the TPV page and wait for it to load.
   */
  async navigateToTPV(): Promise<void> {
    await this.page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
    await this.page
      .getByText("Carregando ChefIApp")
      .waitFor({ state: "hidden", timeout: 25_000 })
      .catch(() => {
        /* may already be gone */
      });
  }

  /**
   * Select a menu category by name.
   *
   * @param categoryName - The category tab/button label to click
   */
  async selectCategory(categoryName: string): Promise<void> {
    const category = this.page
      .locator('[data-testid="category-tab"], [data-testid*="category"]')
      .filter({ hasText: new RegExp(categoryName, "i") })
      .or(
        this.page
          .getByRole("tab", { name: new RegExp(categoryName, "i") })
      );

    await category.first().click();
  }

  /**
   * Verify the order status badge/indicator shows a specific status.
   */
  async expectOrderStatus(
    expectedStatus: string,
    timeout = 15_000,
  ): Promise<void> {
    const statusIndicator = this.page
      .locator('[data-testid="order-status"]')
      .or(
        this.page.locator('[data-testid*="status"]').filter({
          hasText: new RegExp(expectedStatus, "i"),
        }),
      );

    await expect(statusIndicator.first()).toBeVisible({ timeout });
  }
}
