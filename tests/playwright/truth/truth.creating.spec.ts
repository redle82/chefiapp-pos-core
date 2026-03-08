import { expect, test } from "@playwright/test";

/**
 * Truth Lock Contract Tests — CreatingPage
 *
 * TRUTH: UI NEVER anticipates the Core.
 *
 * Contract requirements (PAGE-001 for /app/creating):
 * - Rendering is neutral and honest
 * - No fake progress bars
 * - No "system down" or forced demo decisions here
 * - No onboarding creation API call from this page
 */

const S = {
  loadingOverlay: "text=/Carregando ChefIApp/i",
  unavailablePrompt: "text=/Sistema indispon[ií]vel/i",
  demoButton: 'button:has-text("Explorar em modo demo")',
  retryButton: 'button:has-text("Tentar novamente")',
  fakePercentText: "text=/[0-9]+%/",
};

async function settlePage(page: any) {
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator(S.loadingOverlay)
    .waitFor({ state: "hidden", timeout: 8000 })
    .catch(() => {});
}

test.describe("Truth Lock — CreatingPage Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_user_email", "test@example.com");
      localStorage.setItem("chefiapp_api_base", "http://127.0.0.1:4173");
    });
  });

  test("renders /app/creating without forced fallback prompts", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/app/creating`);
    await settlePage(page);

    await expect(page).toHaveURL(/\/app\/creating/);

    const unavailableVisible = await page
      .locator(S.unavailablePrompt)
      .isVisible()
      .catch(() => false);
    expect(unavailableVisible).toBe(false);

    const demoVisible = await page
      .locator(S.demoButton)
      .isVisible()
      .catch(() => false);
    expect(demoVisible).toBe(false);
  });

  test("does not require explicit demo consent on creating page", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/app/creating`);
    await settlePage(page);

    await expect(page).toHaveURL(/\/app\/creating/);

    const demoVisible = await page
      .locator(S.demoButton)
      .isVisible()
      .catch(() => false);
    expect(demoVisible).toBe(false);

    const retryVisible = await page
      .locator(S.retryButton)
      .isVisible()
      .catch(() => false);
    expect(retryVisible).toBe(false);
  });

  test("does not call onboarding create API from /app/creating", async ({
    page,
    baseURL,
  }) => {
    let createAttempts = 0;

    await page.route("**/api/onboarding/start", async (route) => {
      createAttempts += 1;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          restaurant_id: "test-123",
          session_token: "token-123",
          slug: "test-restaurant",
        }),
        contentType: "application/json",
      });
    });

    await page.goto(`${baseURL}/app/creating`);
    await settlePage(page);
    await page.waitForTimeout(400);

    expect(createAttempts).toBe(0);
  });

  test("no fake progress bars - only honest loading state", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/app/creating`);
    await settlePage(page);

    const progressText = await page.locator(S.fakePercentText).count();
    expect(progressText).toBe(0);
  });
});
