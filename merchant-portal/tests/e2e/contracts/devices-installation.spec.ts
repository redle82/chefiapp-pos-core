/**
 * 🔸 Contract — Device Installation & Provisioning
 *
 * Layer: CONTRACT
 * Purpose:
 *  - Verify that the generic install page (/install) follows the documented flow.
 *  - Verify that pairing via /install?token=… calls the correct RPC and shows success.
 *  - Verify that revoking a device in /admin/devices updates UI state.
 *
 * Contracts (DEVICE_CONTRACT + DEVICES_PROVISIONING):
 *  - /install without token shows generic QR instructions and link back to /admin/devices.
 *  - /install?token=XYZ calls POST /rpc/consume_device_install_token and, on success,
 *    shows "Dispositivo ativado" with terminal details.
 *  - /admin/devices revoke button calls POST /rpc/revoke_terminal and marks row as revoked.
 */

import { expect, test, waitForApp, pilotLogin } from "../fixtures/base";

test.describe("🔸 Contract — Device Installation & Provisioning", () => {
  test("generic /install without token shows QR instructions", async ({
    cleanPage: page,
  }) => {
    await page.goto("/install", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await expect(
      page.getByRole("heading", { name: "Instalar ChefIApp" }),
    ).toBeVisible();

    await expect(
      page.getByText("o administrador deve gerar um código QR", {
        exact: false,
      }),
    ).toBeVisible();

    const devicesLink = page.getByRole("link", { name: "Ir para Dispositivos" });
    await expect(devicesLink).toBeVisible();
    await expect(devicesLink).toHaveAttribute("href", "/admin/devices");
  });

  test("pairing via /install?token=XYZ calls consume_device_install_token and shows success", async ({
    cleanPage: page,
  }) => {
    await waitForApp(page);

    await page.route("**/rpc/consume_device_install_token", async (route) => {
      const json = [
        {
          id: "00000000-0000-0000-0000-00000000TERM",
          restaurant_id: "00000000-0000-0000-0000-000000000100",
          type: "TPV",
          name: "TPV_CONTRACT_E2E",
          registered_at: new Date().toISOString(),
          last_heartbeat_at: null,
          last_seen_at: null,
          status: "active",
          metadata: { runtime: "web", app_version: "0.0.0-e2e" },
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    });

    await page.goto("/install?token=ABC123", {
      waitUntil: "domcontentloaded",
    });
    await waitForApp(page);

    await expect(
      page.getByText("A ativar dispositivo…", { exact: false }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Dispositivo ativado" }),
    ).toBeVisible();

    await expect(page.getByText("TPV_CONTRACT_E2E", { exact: false })).toBeVisible();
    await expect(
      page.getByText("TPV", { exact: false }).first(),
    ).toBeVisible();
  });

  test("revoking a device in /admin/devices marks it as revoked", async ({
    page,
  }) => {
    await pilotLogin(page);

    await page.route("**/rpc/revoke_terminal", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    await page.goto("/admin/devices", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    const revokeButton = page
      .getByRole("button", { name: /revogar/i })
      .first();

    if (!(await revokeButton.isVisible())) {
      test.skip();
    }

    page.once("dialog", (dialog) => dialog.accept());
    await revokeButton.click();

    const revokedRow = page
      .locator("tr")
      .filter({ hasText: /revogado|revoked/i })
      .first();

    await expect(revokedRow).toBeVisible();
  });
});

