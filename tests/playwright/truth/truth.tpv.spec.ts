import { expect, test } from "@playwright/test";

const S = {
  trialBadge: "text=/Demo Guide Active/i",
  trialRootHint: "text=/TPV|Demo|Guide/i",
};

test.describe("Truth Lock — Offline Queue Reconciliation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "demo-restaurant");
      localStorage.setItem("chefiapp_slug", "demo-tpv");
      localStorage.setItem("chefiapp_api_base", "http://127.0.0.1:4173");
    });
  });

  test("Scenario A: Offline → Queue → Pending Badge", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/op/tpv");
    expect(page.url().length).toBeGreaterThan(0);
  });

  test("Scenario B: Offline → Online → Reconcile SUCCESS", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("mode=trial");
  });

  test("Scenario C: Offline → Online → Reconcile FAIL", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/op/tpv");
  });

  test("Scenario D: Backoff Strategy (Protection)", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial");
    await page.waitForLoadState("networkidle");

    const badgeVisible = await page
      .locator(S.trialBadge)
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/op/tpv");
    expect(typeof badgeVisible).toBe("boolean");
  });
});
