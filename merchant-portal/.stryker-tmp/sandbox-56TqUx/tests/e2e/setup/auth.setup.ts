/**
 * 🔐 Auth Setup — Pilot State (run once, reuse state)
 *
 * CONTRACT: SETUP-PILOT-01 — Seed pilot storageState for downstream projects
 *
 * This file runs as a Playwright "setup" project BEFORE contracts/core.
 * It seeds localStorage with the pilot-mode flags that FlowGate needs
 * to treat the browser as an authenticated pilot operator, then saves
 * the storageState so downstream projects inherit it automatically.
 *
 * Why not click the UI pilot button?
 *   The login flow is tested by contracts/auth-flow.spec.ts.
 *   Setup must be deterministic and fast — no UI interaction needed.
 *
 * Ref: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
 *
 * @tag SETUP-PILOT-01
 */
// @ts-nocheck


import { expect, test as setup } from "@playwright/test";

export const AUTH_STATE_PATH = "tests/e2e/.auth/pilot.json";

/**
 * Sofia Gastrobar — the seed restaurant in Docker Core.
 * Valid for hasOperationalRestaurant() in Docker backend.
 */
const SOFIA_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

setup("seed pilot browser state", async ({ page }) => {
  // 1. Navigate to origin so we can manipulate localStorage
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // 2. Seed all flags FlowGate needs for pilot operator state
  await page.evaluate(
    ({ restaurantId }) => {
      localStorage.setItem("chefiapp_pilot_mode", "true");
      localStorage.setItem("chefiapp_bypass_health", "true");
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
      localStorage.setItem("chefiapp_restaurant_id", restaurantId);
    },
    { restaurantId: SOFIA_RESTAURANT_ID },
  );

  // 3. Verify pilot state takes effect — navigate to /dashboard
  //    FlowGate: isPilot && hasLocalOrg → allow operational paths
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  // Wait for the app to finish loading (spinner disappears)
  await page
    .getByText("Carregando ChefIApp…")
    .waitFor({ state: "hidden", timeout: 25_000 })
    .catch(() => {});

  // Should be on an operational page (dashboard redirects to /admin/reports/overview or stays)
  const url = page.url();
  expect(url).not.toContain("/auth/");

  // 4. Save the authenticated browser state (cookies + localStorage)
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
