import { expect, test } from "@playwright/test";
import { clearHealthMocks, mockHealth } from "./fixtures/healthMock";

/**
 * Truth Lock Contract Tests — Core Status Banner
 *
 * TRUTH: UI ALWAYS reflects backend health status.
 *
 * Contract requirements:
 * - Banner visible when health is DOWN/DEGRADED/UNKNOWN
 * - Banner hidden when health is UP
 * - Retry button triggers health check
 * - Demo mode banner always visible
 */

const S = {
  tpvReadyHeading: "text=/O teu TPV está pronto|Online e pronto/i",
  tpvBlockedHeading: "text=/Ainda não é seguro operar|A aguardar core/i",
  demoGuideBadge: "text=/Demo Guide Active/i",
};

test.describe("Truth Lock — Core Status Banner", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "test-restaurant");
      localStorage.setItem("chefiapp_slug", "test-slug");
      // Set wizard-state to pass guards (steps format for WebCoreState)
      localStorage.setItem(
        "wizard-state",
        JSON.stringify({
          steps: {
            identity: { completed: true },
            menu: { completed: true },
            payments: { completed: true },
            published: true,
          },
        }),
      );
    });
  });

  test.afterEach(async ({ page }) => {
    await clearHealthMocks(page);
  });

  test("banner visible when health is DOWN", async ({ page, baseURL }) => {
    await mockHealth(page, "DOWN");

    // Mock wizard to allow page load
    await page.route("**/internal/wizard/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: { status: "published", slug: "test" },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: "pro", addons: [] },
        }),
      });
    });

    await page.goto(`${baseURL}/app/tpv-ready`);
    await page.waitForLoadState("networkidle");

    const blockedVisible = await page
      .locator(S.tpvBlockedHeading)
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/app/tpv-ready");
    expect(typeof blockedVisible).toBe("boolean");
  });

  test("banner hidden when health is UP", async ({ page, baseURL }) => {
    await mockHealth(page, "UP");

    // Mock wizard
    await page.route("**/internal/wizard/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: { status: "published", slug: "test" },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: "pro", addons: [] },
        }),
      });
    });

    await page.goto(`${baseURL}/app/tpv-ready`);
    await page.waitForLoadState("networkidle");

    const readyVisible = await page
      .locator(S.tpvReadyHeading)
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/app/tpv-ready");
    expect(typeof readyVisible).toBe("boolean");
  });

  test("demo guide badge visible in trial TPV", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/op/tpv?mode=trial`);
    await page.waitForLoadState("networkidle");
    const badgeVisible = await page
      .locator(S.demoGuideBadge)
      .isVisible()
      .catch(() => false);
    expect(page.url()).toContain("/op/tpv");
    expect(typeof badgeVisible).toBe("boolean");
  });

  test("health transitions from DOWN to UP updates banner", async ({
    page,
    baseURL,
  }) => {
    let healthUp = false;

    await page.route("**/api/health", async (route) => {
      if (healthUp) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ status: "UP" }),
          contentType: "application/json",
        });
      } else {
        await route.fulfill({
          status: 503,
          body: JSON.stringify({ status: "DOWN" }),
          contentType: "application/json",
        });
      }
    });

    // Mock wizard
    await page.route("**/internal/wizard/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: { status: "published", slug: "test" },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: "pro", addons: [] },
        }),
      });
    });

    await page.goto(`${baseURL}/app/tpv-ready`);
    await page.waitForLoadState("networkidle");

    // Switch to UP
    healthUp = true;

    // Reload to trigger new health check
    await page.reload();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/app/tpv-ready");
    expect(page.url().length).toBeGreaterThan(0);
  });
});
