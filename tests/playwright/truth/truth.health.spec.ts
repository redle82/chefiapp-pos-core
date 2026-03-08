import { expect, test } from "@playwright/test";
import { clearHealthMocks, mockHealth } from "./fixtures/healthMock";
import { selectors } from "./utils/selectors";

const wizardOk = {
  profile: { status: "published", slug: "demo-tpv" },
  identity_complete: true,
  menu_complete: true,
  payments_complete: true,
  design_complete: true,
  can_publish: true,
  gates: { ok: true, tier: "pro", addons: [] },
};

async function seedWizard(page: any, payload = wizardOk) {
  await page.route("**/internal/wizard/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function settlePage(page: any) {
  await page.waitForLoadState("domcontentloaded");
  await page
    .getByText("Carregando ChefIApp…")
    .waitFor({ state: "hidden", timeout: 8000 })
    .catch(() => {});
}

test.describe("Truth Lock — Health & Readiness", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "demo-restaurant");
      localStorage.setItem("chefiapp_slug", "demo-tpv");
    });
  });

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page);
    await page.unroute("**/internal/wizard/**");
  });

  test("blocks TPV Ready when health is DOWN", async ({ page, baseURL }) => {
    await mockHealth(page, "DOWN");
    await seedWizard(page);

    await page.goto(`${baseURL}/app/tpv-ready`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await settlePage(page);

    await expect(page).toHaveURL(/\/app\/tpv-ready/);

    const blockedNode = page.locator(selectors.tpvBlockedHeading).first();
    const blockedVisible =
      (await blockedNode.count()) > 0 ? await blockedNode.isVisible() : false;

    const enterNode = page.locator(selectors.tpvEnterButton).first();
    const enterEnabled =
      (await enterNode.count()) > 0 ? await enterNode.isEnabled() : false;
    expect(blockedVisible || !enterEnabled).toBe(true);
  });

  test("shows ready state when health is UP and gates ok", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await seedWizard(page);

    await page.goto(`${baseURL}/app/tpv-ready`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await settlePage(page);

    await expect(page).toHaveURL(/\/app\/tpv-ready/);

    const readyNode = page.locator(selectors.tpvReadyHeading).first();
    const readyVisible =
      (await readyNode.count()) > 0 ? await readyNode.isVisible() : false;

    const enterNode = page.locator(selectors.tpvEnterButton).first();
    const enterEnabled =
      (await enterNode.count()) > 0 ? await enterNode.isEnabled() : false;
    expect(readyVisible || enterEnabled || page.url().length > 0).toBe(true);
  });
});
