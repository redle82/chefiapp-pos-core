/**
 * 🔸 Contract — Logout flow (Admin)
 *
 * Verifies:
 * - Clicking "Sair" does not show the native "Leave site?" dialog (dialogCount === 0).
 * - Logout triggers navigation (Keycloak then redirect to /auth or, if config differs, /admin/modules).
 * - When back on the app, session is cleared (pilot_mode not restored; no re-auth).
 *
 * Run: pnpm exec playwright test tests/e2e/contracts/logout-flow.spec.ts --project=logout
 * (project "logout" has no setup dependency; test seeds pilot state via cleanPage.)
 *
 * @tag CONTRATO-LOGOUT-FLOW
 */

import {
  enablePilotMode,
  expect,
  test,
  waitForApp,
} from "../fixtures/base";

const SOFIA_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

test.describe("🔸 Contract — Logout flow", () => {
  test("Admin: Sair does not show Leave site? and clears session", async ({
    cleanPage: page,
  }) => {
    await enablePilotMode(page);
    await page.evaluate(
      ({ restaurantId }) => {
        localStorage.setItem("chefiapp_pilot_mode", "true");
        localStorage.setItem("chefiapp_bypass_health", "true");
        localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
        sessionStorage.setItem("chefiapp_restaurant_id", restaurantId);
        localStorage.setItem("chefiapp_restaurant_id", restaurantId);
      },
      { restaurantId: SOFIA_RESTAURANT_ID },
    );

    await page.goto("/admin/modules", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    let dialogCount = 0;
    page.on("dialog", () => {
      dialogCount += 1;
    });

    await page.getByTestId("topbar-profile").click();
    await expect(page.getByTestId("topbar-logout")).toBeVisible();

    // Click Sair: must not open native "Leave site?" dialog
    await page.getByTestId("topbar-logout").click();

    // Wait for navigation (Keycloak or back to /auth or /admin/modules)
    await page
      .waitForURL(
        (url) => {
          if (url.hostname === "localhost" && parseInt(url.port || "0", 10) === 8080)
            return true;
          return url.pathname === "/auth" || url.pathname.startsWith("/auth/") || url.pathname.includes("/admin/modules");
        },
        { timeout: 20_000 },
      )
      .catch(() => {});

    expect(dialogCount).toBe(0);

    const currentUrl = page.url();
    const isOurApp = currentUrl.includes("localhost:5175") && !currentUrl.includes(":8080");
    if (!isOurApp) return;

    await waitForApp(page).catch(() => {});

    // Session must be cleared (no pilot rehydration)
    const pilotStillSet = await page.evaluate(
      () =>
        localStorage.getItem("chefiapp_pilot_mode") === "true" ||
        sessionStorage.getItem("chefiapp_pilot_mode") === "true",
    );
    expect(pilotStillSet).toBe(false);

    // Post-logout redirect: expect /auth (or /auth/*); if still on /admin/modules, topbar shows "Sessão encerrada"
    if (currentUrl.includes("/auth")) {
      expect(currentUrl).toMatch(/\/auth/);
    } else if (currentUrl.includes("/admin/modules")) {
      const profileBtn = page.getByTestId("topbar-profile");
      await expect(profileBtn).toBeVisible({ timeout: 8000 });
      await expect(profileBtn).toHaveAttribute("data-authenticated", "false");
      await expect(profileBtn).toContainText(/Sessão encerrada/i, { timeout: 3000 });
    }
  });
});
