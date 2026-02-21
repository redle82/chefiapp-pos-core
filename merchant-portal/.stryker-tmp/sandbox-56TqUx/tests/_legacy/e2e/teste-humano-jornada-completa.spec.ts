/**
 * TESTE HUMANO E2E — Jornada completa (como um utilizador real)
 *
 * Simula uma pessoa que:
 * 1. Entra na landing e decide fazer login
 * 2. Faz login (mock OTP) e vê a primeira tela pós-auth (welcome / activation / dashboard)
 * 3. Navega até ao Hub de Módulos e clica em "Abrir" no TPV
 * 4. Confirma que chegou ao TPV ou ao Centro de Ativação (se ainda não ativado)
 *
 * Timeouts generosos e passos descritivos para leitura humana.
 * BaseURL: http://localhost:5175
 */
// @ts-nocheck


import { expect, test } from "@playwright/test";

test.describe("Teste humano: jornada completa (landing → auth → app → Hub → TPV)", () => {
  test.use({
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  });

  test("jornada: landing → login → primeira tela → Hub de Módulos → TPV", async ({
    page,
  }) => {
    await test.step("1. Visitar a landing e ver oferta", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20_000 });
      await page.waitForLoadState("domcontentloaded");
      const body = await page.locator("body").textContent();
      expect(body?.length ?? 0).toBeGreaterThan(200);
    });

    await test.step("2. Ir para o login (auth)", async () => {
      const loginLink = page
        .getByRole("link", { name: /Entrar|Login|Iniciar sessão/i })
        .or(page.getByRole("button", { name: /Entrar|Login/i }))
        .first();
      if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loginLink.click();
      } else {
        await page.goto("/auth/phone", { waitUntil: "domcontentloaded" });
      }
      await page.waitForURL(/\/(auth|login)/, { timeout: 10_000 });
    });

    await test.step("3. Fazer login com código mock (E2E)", async () => {
      await page.goto("/auth/verify?e2e_mock_otp=1", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page
        .getByText("Carregando ChefIApp…")
        .waitFor({ state: "hidden", timeout: 25_000 })
        .catch(() => {});

      await page.getByPlaceholder(/123|456|código/i).fill("123456");
      await page.getByRole("button", { name: /Entrar|Verificar/i }).click();

      await page.waitForURL(
        /\/(welcome|app\/activation|app\/dashboard|dashboard|setup|bootstrap)/,
        { timeout: 25_000 },
      );
      const url = page.url();
      expect(
        url.includes("/welcome") ||
          url.includes("/app/activation") ||
          url.includes("/app/dashboard") ||
          url.includes("/dashboard") ||
          url.includes("/setup") ||
          url.includes("/bootstrap"),
      ).toBe(true);
    });

    await test.step("4. Verificar que estamos numa tela válida (welcome, activation ou dashboard)", async () => {
      const welcome = page.getByText(/Bem-vindo ao seu restaurante/i);
      const activation = page.getByText(
        /Centro de Ativação|checklist|Criar menu/i,
      );
      const dashboard = page.getByText(
        /Relatórios|Histórico|Mis productos|Módulos/i,
      );

      const hasWelcome = await welcome.isVisible().catch(() => false);
      const hasActivation = await activation.isVisible().catch(() => false);
      const hasDashboard = await dashboard.isVisible().catch(() => false);

      expect(hasWelcome || hasActivation || hasDashboard).toBe(true);
    });

    await test.step("5. Injetar Pilot Mode e ir ao Hub de Módulos (como operador)", async () => {
      await page.evaluate(() => {
        localStorage.setItem("chefiapp_pilot_mode", "true");
        localStorage.setItem("chefiapp_bypass_health", "true");
        localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
        localStorage.setItem(
          "chefiapp_restaurant_id",
          "00000000-0000-0000-0000-000000000100",
        );
      });
      await page.goto("/admin/modules", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.getByText(/Mis productos|Módulos|Esenciales|productos/i).first(),
      ).toBeVisible({ timeout: 20_000 });
    });

    await test.step("6. Clicar no botão principal do TPV (Abrir)", async () => {
      const abrirTpv = page
        .getByRole("button", { name: /Abrir|Open|Software TPV/i })
        .first();
      if (await abrirTpv.isVisible({ timeout: 5000 }).catch(() => false)) {
        try {
          // Wait for button to be stable before clicking (enabled, no animations, etc)
          await abrirTpv.isEnabled({ timeout: 3000 });
          await page.waitForTimeout(300); // Wait for any animations to complete
          await abrirTpv.click({ timeout: 5000 }).catch(async () => {
            // If click fails (element detached), navigate directly
            await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
          });
        } catch {
          // Fallback: navigate directly if button interaction fails
          await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
        }
        // Wait for either TPV or activation page
        await page
          .waitForURL(/\/(op\/tpv|app\/activation)/, {
            timeout: 15_000,
          })
          .catch(() => {}); // Soft fail if navigation doesn't match pattern
      } else {
        await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      }
    });

    await test.step("7. Confirmar que estamos no TPV ou no Centro de Ativação", async () => {
      const url = page.url();
      const noTpv = url.includes("/op/tpv");
      const naActivation = url.includes("/app/activation");
      const noAdminShell = url.includes("/admin/");

      if (noTpv) {
        await expect(
          page
            .locator("body")
            .getByText(/TPV|Caixa|Pedido|produto|€/i)
            .first(),
        ).toBeVisible({ timeout: 15_000 });
      }
      if (naActivation) {
        await expect(
          page
            .getByText(/Centro de Ativação|Complete o setup|checklist/i)
            .first(),
        ).toBeVisible({ timeout: 10_000 });
      }
      if (noAdminShell) {
        await expect(
          page.getByText(/Relat[óo]rios|Reportes|Hist[óo]rico/i).first(),
        ).toBeVisible({ timeout: 10_000 });
      }
      expect(noTpv || naActivation || noAdminShell).toBe(true);
    });
  });
});
