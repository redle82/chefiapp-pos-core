/**
 * E2E: Botões da página Módulos (/admin/modules) têm destino real.
 *
 * Para cada card de módulo (tpv, kds, fichaje, stock, tienda-online, qr-ordering,
 * reservas, delivery-integrator), clica no botão principal (Abrir / Activar /
 * Configurar). TPV e KDS abrem em nova janela; os restantes navegam na mesma aba.
 *
 * Ref: plano auditoria botões e rotas (Passo 7).
 */

import { expect, test } from "@playwright/test";

/** Destino esperado por módulo. TPV e KDS abrem em nova janela (openInNewWindow). */
const MODULES_AND_EXPECTED_PATH: {
  id: string;
  pathContains: string;
  openInNewWindow?: boolean;
}[] = [
  { id: "tpv", pathContains: "/op/tpv", openInNewWindow: true },
  { id: "kds", pathContains: "/op/kds", openInNewWindow: true },
  { id: "fichaje", pathContains: "/app/staff" },
  { id: "stock", pathContains: "/inventory-stock" },
  { id: "tienda-online", pathContains: "/admin/config" },
  { id: "qr-ordering", pathContains: "/admin/config" },
  { id: "reservas", pathContains: "/admin/reservations" },
  { id: "delivery-integrator", pathContains: "/admin/config" },
];

test.describe("Products / Modules page — primary action navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
      localStorage.setItem("chefiapp_bypass_health", "true");
      localStorage.setItem("chefiapp_pilot_mode", "true");
    });
  });

  test("Login (pilot) → /admin/modules → each module primary button navigates", async ({
    page,
  }) => {
    test.slow();

    // Auth (pilot)
    await page.goto("/auth/email");
    await page.evaluate(() => {
      localStorage.setItem("chefiapp_bypass_health", "true");
      localStorage.setItem("chefiapp_pilot_mode", "true");
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });
    await page.goto("/auth/email");
    await page.waitForLoadState("domcontentloaded");

    if (page.url().includes("/auth")) {
      const pilotBtn = page
        .getByRole("button", { name: /Simular Registo|Piloto/i })
        .or(page.getByText(/Simular Registo/i))
        .first();
      if (await pilotBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await pilotBtn.click();
      }
      await page.waitForURL((url) => !url.pathname.includes("/auth"), {
        timeout: 20_000,
      });
    }

    // Go to Módulos (canonical: /admin/modules; /admin/config/productos redirects here)
    await page.goto("/admin/modules");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("heading", { name: /Módulos/i }).first(),
    ).toBeVisible({
      timeout: 15_000,
    });

    for (const { id, pathContains, openInNewWindow } of MODULES_AND_EXPECTED_PATH) {
      const card = page.locator(`[data-module-id="${id}"]`).first();
      await expect(card).toBeVisible({ timeout: 5_000 });

      const primaryBtn = card
        .getByRole("button", {
          name: /Abrir|Activar|Configurar|Ver planos/i,
        })
        .first();
      await expect(primaryBtn).toBeVisible({ timeout: 2_000 });
      const disabled = await primaryBtn.getAttribute("disabled");
      if (disabled !== null) {
        continue; // locked module — skip navigation assert
      }

      if (openInNewWindow) {
        // TPV/KDS abrem em nova janela — esperar popup e validar URL
        const popupPromise = page.context().waitForEvent("page");
        await primaryBtn.click();
        const popup = await popupPromise;
        await popup.waitForLoadState("domcontentloaded");
        expect(
          popup.url(),
          `module ${id}: popup should contain "${pathContains}"`,
        ).toContain(pathContains);
        await popup.close();
      } else {
        const urlBefore = page.url();
        await primaryBtn.click();
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(500);

        const urlAfter = page.url();
        expect(
          urlAfter,
          `module ${id}: expected URL to change and contain "${pathContains}"`,
        ).toContain(pathContains);
        expect(urlAfter, `module ${id}: should not stay on same page`).not.toBe(
          urlBefore,
        );
        expect(urlAfter, `module ${id}: no about:blank`).not.toContain(
          "about:",
        );

        await page.goto("/admin/modules");
        await page.waitForLoadState("domcontentloaded");
      }
    }
  });
});
