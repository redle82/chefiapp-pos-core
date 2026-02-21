/**
 * Shared E2E fixtures — reusable helpers for all test layers.
 *
 * Provides:
 *  - cleanPage: a page with localStorage cleared (no stale sessions)
 *  - pilotLogin(): sets pilot mode + bypass flags, navigates to auth
 *  - waitForApp(): waits for the loading spinner to disappear
 *  - collectErrors(): captures browser errors during a test
 */

import { type Page, test as base } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

/** Wait for the global loading view ("Carregando ChefIApp…") to disappear. */
export async function waitForApp(page: Page, timeoutMs = 25_000) {
  await page
    .getByText("Carregando ChefIApp…")
    .waitFor({ state: "hidden", timeout: timeoutMs })
    .catch(() => {
      /* may already be gone */
    });
}

/** Set localStorage flags to enable pilot mode (auto-login, bypass health). */
export async function enablePilotMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("chefiapp_bypass_health", "true");
    localStorage.setItem("chefiapp_pilot_mode", "true");
    localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
  });
}

/** Clear all client storage so the test starts from a clean VISITOR state. */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Seed pilot-operator state into localStorage and navigate to an operational route.
 *
 * This is deterministic and fast — no UI interaction needed.
 * The UI pilot button flow is tested separately in auth-flow contract tests.
 */
const SOFIA_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export async function pilotLogin(page: Page) {
  await page.evaluate(
    ({ restaurantId }) => {
      localStorage.setItem("chefiapp_pilot_mode", "true");
      localStorage.setItem("chefiapp_bypass_health", "true");
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
      localStorage.setItem("chefiapp_restaurant_id", restaurantId);
    },
    { restaurantId: SOFIA_RESTAURANT_ID },
  );

  // Navigate to dashboard — FlowGate allows it with isPilot + hasLocalOrg
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await waitForApp(page);
}

/* ------------------------------------------------------------------ */
/*  Extended test fixture                                              */
/* ------------------------------------------------------------------ */

type Fixtures = {
  /** A page with clean storage. No stale session, no cookies. */
  cleanPage: Page;
};

export const test = base.extend<Fixtures>({
  cleanPage: async ({ page }, use) => {
    // Navigate to origin so we can manipulate localStorage
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await clearStorage(page);
    // Dismiss cookie consent + block Docker AUTO-PILOT from re-seeding pilot state.
    // AUTH_CONTRACT: AuthProvider auto-seeds pilot_mode + restaurant_id when
    // DEBUG_DIRECT_FLOW + Docker (see AuthProvider.tsx "AUTO-PILOT" block).
    // cleanPage must disable this so the page starts as a genuine VISITOR.
    await page.evaluate(() => {
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
      localStorage.setItem("chefiapp_skip_auto_pilot", "true");
    });
    await use(page);
  },
});

export { expect } from "@playwright/test";
