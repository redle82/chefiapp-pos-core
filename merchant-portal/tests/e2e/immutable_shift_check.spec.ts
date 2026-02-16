import { expect, test } from "@playwright/test";

// NOTE: This test assumes the application is running at localhost:5175 (Merchant Portal)
// It also assumes the database is reachable via RPC or has mocked APIs if needed,
// but since this is an integration test on the running app, we rely on the app's connectivity.

test.describe("Immutable Shift Contract Verification", () => {
  test("should enforce shift lock on reload", async ({ page }) => {
    // 1. Initial State: No Shift Open
    // 0. Inject Authentication Mocks & Trial Mode
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("chefiapp_trial_mode", "true");
      localStorage.setItem("chefiapp_restaurant_id", "trial-restaurant-id");
      localStorage.setItem("chefiapp_user_role", "owner");
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });

    // Hardcoded restaurant ID from the app/debug page
    const restId = "00000000-0000-0000-0000-000000000100";

    // Mock initial shift API to return closed state (no open shift)
    await page.route(
      "**/rest/v1/gm_cash_registers*status=eq.open*",
      async (route) => {
        await route.fulfill({ json: null });
      },
    );

    // 1. Initial State: No Shift Open
    await page.goto("/tpv-test");
    await page.waitForTimeout(2000);

    // Skip when TPV debug page is not available (Core/auth off → FlowGate redirects to landing)
    const tpvDebugVisible = await page
      .getByText("Debug TPV Page Loaded")
      .isVisible()
      .catch(() => false);
    if (!tpvDebugVisible) {
      test.skip(
        true,
        "TPV debug page not available (Core/auth or /tpv-test not reachable)",
      );
    }

    // Ensure we are in Debug TPV (assert after skip for same-run consistency)
    await expect(page.getByText("Debug TPV Page Loaded")).toBeVisible({
      timeout: 5000,
    });

    // Verify we can reload freely (no dialog)
    // There is no easy way to "expect no dialog" other than the test not hanging or failing if a dialog appears.
    // However, if a beforeunload listener is present, page.reload() might trigger it.
    // By default playwright handles dialogs by traversing them, but we want to assert presence.
    // Verify UI shows Closed
    await expect(page.getByText("SHIFT STATUS: CLOSED")).toBeVisible({
      timeout: 5000,
    });

    // Verify we can reload freely (no dialog) when shift is closed
    console.log("Verifying Clear Reload (Initial Closed State)...");
    let blocked = false;
    page.once("dialog", async (dialog) => {
      if (dialog.type() === "beforeunload") {
        blocked = true;
        await dialog.dismiss();
      } else {
        await dialog.dismiss();
      }
    });
    await page.reload();
    await page.waitForTimeout(1000); // Give time for any potential dialog to appear
    expect(
      blocked,
      "Reload should NOT be blocked when shift is initially closed",
    ).toBe(false);
    await expect(page.getByText("Debug TPV Page Loaded")).toBeVisible(); // Ensure page reloaded successfully

    // 2. Transition to Open Shift (by changing mock)
    console.log("Transitioning to Open Shift (by changing mock)...");
    await page.unroute(`**/rest/v1/gm_cash_registers*status=eq.open*`); // Remove previous mock
    await page.route(
      `**/rest/v1/gm_cash_registers*status=eq.open*`,
      async (route) => {
        // Return active shift
        const json = {
          id: "mock-shift-123",
          restaurant_id: restId,
          status: "open",
          opened_at: new Date().toISOString(),
          opened_by: "MOCK_USER",
          opening_balance_cents: 10000,
          total_sales_cents: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("Mocking OPEN SHIFT response");
        await route.fulfill({ json });
      },
    );

    // 2. Refresh to pick up Open Shift state
    console.log("Refreshing to pick up Open Shift...");
    // This reload should NOT be blocked, as the app's internal state is still 'closed' until it fetches the new mock.
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify UI shows Open
    await expect(page.getByText("SHIFT STATUS: OPEN (LOCKED)")).toBeVisible({
      timeout: 5000,
    });

    // 3. Verify Reload Block
    console.log("Verifying Reload Block...");

    blocked = false;
    page.once("dialog", async (dialog) => {
      console.log(`Potential Block Dialog: ${dialog.message()}`);
      if (dialog.type() === "beforeunload") {
        blocked = true;
        try {
          await dialog.dismiss();
        } catch (e) {
          /* Check if handled */
        }
      } else {
        try {
          await dialog.dismiss();
        } catch (e) {
          /* Check if handled */
        }
      }
    });

    console.log("Triggering reload...");
    await page.evaluate(() => window.location.reload());

    await page.waitForTimeout(2000);
    expect(blocked, "Reload should be blocked by ShiftGuard").toBe(true);

    // 4. Transition to "Close Shift" (by changing mock)
    console.log("Transitioning to Closed Shift (by changing mock)...");

    // Update mock to return null (Closed)
    await page.unroute(`**/rest/v1/gm_cash_registers*status=eq.open*`); // Remove previous mock
    await page.route(
      `**/rest/v1/gm_cash_registers*status=eq.open*`,
      async (route) => {
        console.log("Mocking CLOSED SHIFT response (null)");
        await route.fulfill({ json: null }); // maybeSingle returns null if empty
      },
    );

    // Refresh to pick up Closed Shift state
    console.log("Refreshing to pick up Closed Shift...");
    // This reload should NOT be blocked, as the app's internal state is still 'open' until it fetches the new mock.
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.getByText("SHIFT STATUS: CLOSED")).toBeVisible({
      timeout: 5000,
    });

    // 5. Verify Reload Free
    console.log("Verifying Clear Reload (after closing shift)...");
    blocked = false;
    page.once("dialog", async (dialog) => {
      if (dialog.type() === "beforeunload") {
        blocked = true;
        await dialog.dismiss();
      } else {
        await dialog.dismiss();
      }
    });

    await page.reload();
    await page.waitForTimeout(1000); // Give time for any potential dialog to appear
    expect(blocked, "Reload should NOT be blocked after closing shift").toBe(
      false,
    );

    await expect(page.getByText("Debug TPV Page Loaded")).toBeVisible();
  });
});
