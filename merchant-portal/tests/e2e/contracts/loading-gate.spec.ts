/**
 * 🔸 Contract — Loading Gate (FlowGate isChecking lifecycle)
 *
 * Layer: CONTRACT
 * Purpose: Verify that the FlowGate loading state resolves PROMPTLY
 *          on operational paths, not just via the timeout fallback.
 *
 * CONTRACT: LOADING-GATE-01 — FlowGate sets isChecking=false within 3s on operational paths
 *
 * Mutation targets (FlowGate.tsx L146-149):
 *   - if(mounted) → if(false)  ⇒ loading stuck until 5s timeout
 *   - { clearLoadingTimeout(); setIsChecking(false) } → {}  ⇒ same
 *   These mutations survive because the 5s loading timeout fallback rescues
 *   the loading state. By asserting loading disappears in <3s, we catch them.
 *
 * @tag CONTRATO-LOADING-GATE-01 MUTATION-HARDENING
 */

import { expect, test, waitForApp } from "../fixtures/base";

test.describe("🔸 Contract — Loading Gate", () => {
  /**
   * On an operational path (pilot + hasLocalOrg + isTrialOrPilot),
   * FlowGate must call setIsChecking(false) DIRECTLY (not via timeout).
   *
   * The loading timeout in Docker is 5000ms. If the mounted-block mutation
   * prevents direct setIsChecking(false), loading persists for 5s.
   * We assert it disappears within 3s — well before the timeout.
   */
  test("operational path: loading resolves promptly (not via timeout fallback)", async ({
    page,
  }) => {
    // `page` uses storageState (pilot auth) — has restaurant_id, pilot_mode
    // Navigate to /dashboard (operational path)
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // The FlowGate loading message is "Verificando acesso..."
    // It must disappear within 3000ms (direct resolution, not 5s timeout).
    const loadingText = page.getByText("Verificando acesso...");

    // Wait for loading to appear (it may already be gone if resolution was instant)
    const wasVisible = await loadingText
      .waitFor({ state: "visible", timeout: 2000 })
      .then(() => true)
      .catch(() => false);

    if (wasVisible) {
      // If loading was visible, it must disappear within 3s (not 5s timeout)
      await expect(loadingText).toBeHidden({ timeout: 3000 });
    }

    // After resolution: app content must be visible (not stuck on loading)
    await waitForApp(page);
    const body = page.locator("body");
    const bodyText = await body.textContent();
    expect((bodyText ?? "").length).toBeGreaterThan(20);

    // Must NOT still show the loading message
    await expect(loadingText).toBeHidden();
  });

  /**
   * Same contract for a different operational path: /op/tpv.
   * This ensures FlowGate resolves promptly on all operational routes,
   * not just /dashboard.
   */
  test("TPV path: loading resolves promptly", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial", { waitUntil: "domcontentloaded" });

    const loadingText = page.getByText("Verificando acesso...");

    const wasVisible = await loadingText
      .waitFor({ state: "visible", timeout: 2000 })
      .then(() => true)
      .catch(() => false);

    if (wasVisible) {
      await expect(loadingText).toBeHidden({ timeout: 3000 });
    }

    await waitForApp(page);

    // TPV must show content (not loading forever)
    const body = page.locator("body");
    const bodyText = await body.textContent();
    expect((bodyText ?? "").length).toBeGreaterThan(20);
    await expect(loadingText).toBeHidden();
  });
});
