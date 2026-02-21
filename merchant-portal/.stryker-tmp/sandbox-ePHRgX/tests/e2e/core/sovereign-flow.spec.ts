/**
 * 🟢 Core — Sovereign Operational Flow
 *
 * Layer: CORE (the single strong E2E flow)
 * Purpose: Validate the canonical user journey from landing to operational state.
 *
 * CONTRACT: CORE-SOVEREIGN-01 — Full lifecycle from VISITOR to operational
 *
 * Journey:
 *   1. Landing page loads
 *   2. Navigate to auth
 *   3. Pilot login completes
 *   4. Post-auth: arrives at /welcome, /app, /admin, or /dashboard
 *   5. If at /welcome (bootstrap) → verify it renders
 *   6. If at operational state → verify dashboard/TPV is accessible
 *   7. Trial TPV loads and shows product interface
 *
 * This single test replaces 10+ fragmented tests that covered
 * partial flows with different setups.
 *
 * @tag CONTRATO-CORE-SOVEREIGN-01
 */
// @ts-nocheck


import {
  enablePilotMode,
  expect,
  pilotLogin,
  test,
  waitForApp,
} from "../fixtures/base";

test.describe("🟢 Core — Sovereign Operational Flow", () => {
  test("complete journey: landing → auth → pilot → operational", async ({
    cleanPage: page,
  }) => {
    // ── Step 1: Landing page loads ──
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    // Verify we're on the landing page (not redirected to error)
    const landingContent = page.locator("body");
    await expect(landingContent).toBeVisible();

    // ── Step 2: Navigate to auth ──
    await page.goto("/auth/phone", { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    expect(page.url()).toContain("/auth/phone");

    // ── Step 3: Pilot login ──
    await enablePilotMode(page);
    await pilotLogin(page);

    // ── Step 4: Post-auth destination ──
    const postAuthUrl = page.url();
    expect(postAuthUrl).toMatch(
      /\/(welcome|app|admin|dashboard|op|bootstrap|onboarding)/,
    );

    // ── Step 5 & 6: Verify post-auth state renders meaningful content ──
    if (
      postAuthUrl.includes("/welcome") ||
      postAuthUrl.includes("/bootstrap")
    ) {
      // Bootstrap state: verify the welcome/setup page has actual content
      const welcomeHeading = page.locator("h1, h2, [role='heading']");
      const welcomeAction = page.locator("button, a[href], [role='button']");
      await expect(
        welcomeHeading.first().or(welcomeAction.first()),
      ).toBeVisible({ timeout: 15_000 });
      // Body must have substantial text (not a blank white page)
      const bodyText = await page.locator("body").textContent();
      expect((bodyText ?? "").length).toBeGreaterThan(50);
    } else {
      // Operational state: verify meaningful structural content
      const mainContent = page.locator("main, [role='main'], #root");
      await expect(mainContent.first()).toBeVisible({ timeout: 15_000 });
      // Must have clickable elements (not a blank shell)
      const actionableElements = page.locator(
        "button, a[href], [role='button']",
      );
      const count = await actionableElements.count();
      expect(count).toBeGreaterThan(0);
    }

    // ── Step 7: Trial TPV is accessible ──
    await page.goto("/op/tpv?mode=trial", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    // TPV should load (may show products or empty state)
    const tpvIndicator = page
      .locator('[data-testid="product-card"]')
      .first()
      .or(
        page
          .locator('[data-testid*="tpv"], [data-testid*="pos"], [class*="tpv"]')
          .first(),
      )
      .or(
        page
          .getByText(
            /sem produtos|nenhum produto|adicionar produto|menu vazio|terminal/i,
          )
          .first(),
      );

    await expect(tpvIndicator).toBeVisible({ timeout: 20_000 });
  });
});
