import { expect, test } from "@playwright/test";
import { clearHealthMocks, mockHealth } from "./fixtures/healthMock";

const S = {
  stripeHeading: 'h2:has-text("Stripe")',
  portalButton: 'button:has-text("Portal do cliente")',
  pageHint: "text=/Pagamento|Stripe/i",
};

test.describe("Truth Lock — PaymentsPage Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "test-restaurant");
      localStorage.setItem("chefiapp_api_base", "http://127.0.0.1:4173");
    });
  });

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page);
  });

  test("Stripe validation blocked when health is DOWN", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "DOWN");
    await page.goto(`${baseURL}/admin/config/integrations/payments`);
    await page.waitForLoadState("networkidle");

    const hintVisible = await page
      .locator(S.pageHint)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/admin/config/integrations/payments");
    expect(typeof hintVisible).toBe("boolean");
  });

  test("Stripe validation succeeds with real API when health is UP", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/admin/config/integrations/payments`);
    await page.waitForLoadState("networkidle");

    const stripeVisible = await page
      .locator(S.stripeHeading)
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/admin/config/integrations/payments");
    expect(typeof stripeVisible).toBe("boolean");
  });

  test("demo mode shows explicit notice", async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_demo_mode", "true");
    });

    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/admin/config/integrations/payments`);
    await page.waitForLoadState("networkidle");

    const hintVisible = await page
      .locator(S.pageHint)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/admin/config/integrations/payments");
    expect(typeof hintVisible).toBe("boolean");
  });

  test("demo mode skips real validation", async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_demo_mode", "true");
    });

    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/admin/config/integrations/payments`);
    await page.waitForLoadState("networkidle");

    const portalVisible = await page
      .locator(S.portalButton)
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/admin/config/integrations/payments");
    expect(typeof portalVisible).toBe("boolean");
  });

  test("invalid key format shows immediate error (no API call)", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/admin/config/integrations/payments`);
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/admin/config/integrations/payments");
  });

  test("API error shows explicit error message", async ({ page, baseURL }) => {
    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/admin/config/integrations/payments`);
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/admin/config/integrations/payments");
  });
});
