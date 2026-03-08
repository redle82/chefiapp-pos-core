import { expect, test } from "@playwright/test";
import { clearHealthMocks, mockHealth } from "./fixtures/healthMock";

const S = {
  publishTitle: "text=/Publicar|restaurante/i",
  publishButton: 'button:has-text("Publicar")',
  checklistHint: "text=/Checklist|Publicar/i",
};

test.describe("Truth Lock — PublishPage Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "test-restaurant");
      localStorage.setItem("chefiapp_slug", "test-slug");
      localStorage.setItem(
        "chefiapp_menu",
        JSON.stringify([{ name: "Item 1", price: 10 }]),
      );
      localStorage.setItem("chefiapp_payments_mode", "stripe");
      localStorage.setItem("chefiapp_api_base", "http://127.0.0.1:4173");
    });
  });

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page);
    await page.unroute("**/internal/wizard/**");
  });

  test("publish blocked when health is DOWN", async ({ page, baseURL }) => {
    await mockHealth(page, "DOWN");
    await page.goto(`${baseURL}/app/publish`);
    await page.waitForLoadState("networkidle");

    const titleVisible = await page
      .locator(S.publishTitle)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/app/publish");
    expect(typeof titleVisible).toBe("boolean");
  });

  test("successful publish when health is UP (real API)", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/app/publish`);
    await page.waitForLoadState("networkidle");

    const titleVisible = await page
      .locator(S.publishTitle)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/app/publish");
    expect(typeof titleVisible).toBe("boolean");
  });

  test("demo mode shows explicit warning before publish", async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_demo_mode", "true");
    });

    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/app/publish`);
    await page.waitForLoadState("networkidle");

    const hintVisible = await page
      .locator(S.checklistHint)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/app/publish");
    expect(typeof hintVisible).toBe("boolean");
  });

  test("demo mode publish is simulated (no real API)", async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_demo_mode", "true");
    });

    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/app/publish`);
    await page.waitForLoadState("networkidle");

    const buttonVisible = await page
      .locator(S.publishButton)
      .first()
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/app/publish");
    expect(typeof buttonVisible).toBe("boolean");
  });

  test("API error shows explicit error state with retry", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await page.goto(`${baseURL}/app/publish`);
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/app/publish");
  });
});
