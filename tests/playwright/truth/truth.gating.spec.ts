import { expect, test } from "@playwright/test";
import { clearHealthMocks, mockHealth } from "./fixtures/healthMock";
import { selectors } from "./utils/selectors";

const wizardGateBlocked = {
  profile: { status: "draft", slug: "demo-tpv" },
  identity_complete: true,
  menu_complete: true,
  payments_complete: true,
  design_complete: true,
  can_publish: false,
  gates: { ok: false, tier: "free", addons: [], message: "Gate blocked" },
};

const wizardIncomplete = {
  profile: { status: "draft", slug: "demo-tpv" },
  identity_complete: true,
  menu_complete: false,
  payments_complete: false,
  design_complete: false,
  can_publish: false,
  gates: { ok: true, tier: "free", addons: [] },
};

async function seedWizard(page: any, payload: any) {
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

test.describe("Truth Lock — Gating & Ghost/Live", () => {
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

  test("gates TPV when gates.ok is false even if health is UP", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await seedWizard(page, wizardGateBlocked);

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

  test("gates TPV when steps incomplete (ghost cannot act like live)", async ({
    page,
    baseURL,
  }) => {
    await mockHealth(page, "UP");
    await seedWizard(page, wizardIncomplete);

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
});
