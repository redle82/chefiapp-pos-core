/**
 * E2E — Demo 5 simuladores (cenário de referência)
 *
 * Documenta os passos da demo: Login → Welcome → Onboarding → Centro de Ativação
 * → TPV central e KDS central. Não cobre os 5 dispositivos móveis (isso é manual).
 * BaseURL: http://localhost:5175
 *
 * Referência: docs/demo/DEMO_5_SIMULADORES_GUIA.md
 */

import { expect, test } from "@playwright/test";

test.describe("Demo 5 simuladores: fluxo web (nova empresa → TPV/KDS central)", () => {
  test.use({
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  });

  test("jornada: login → welcome → onboarding → activation → TPV e KDS", async ({
    page,
  }) => {
    await test.step("1. Login e primeira tela (welcome ou activation)", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20_000 });
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
        /\/(welcome|app\/activation|app\/dashboard|dashboard|setup|bootstrap|onboarding)/,
        { timeout: 25_000 },
      );
    });

    await test.step("2. Welcome: Começar Configuração Guiada → onboarding", async () => {
      const url = page.url();
      if (url.includes("/welcome")) {
        const startConfig = page
          .getByRole("link", {
            name: /Começar Configuração Guiada|Configuração Guiada/i,
          })
          .or(page.getByRole("button", { name: /Começar|Configuração/i }));
        if (
          await startConfig
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false)
        ) {
          await startConfig.first().click();
          await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
        }
      }
    });

    await test.step("3. Verificar que estamos em welcome, onboarding ou activation", async () => {
      const url = page.url();
      expect(
        url.includes("/welcome") ||
          url.includes("/onboarding") ||
          url.includes("/app/activation") ||
          url.includes("/app/dashboard") ||
          url.includes("/dashboard"),
      ).toBe(true);
    });

    await test.step("4. Navegar para Centro de Ativação (se já tiver org)", async () => {
      await page.goto("/app/activation", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForLoadState("domcontentloaded");
      const activation = page.getByText(
        /Centro de Ativação|checklist|Criar menu|Complete o setup/i,
      );
      const welcome = page.getByText(/Bem-vindo ao seu restaurante/i);
      const hasActivation = await activation
        .first()
        .isVisible()
        .catch(() => false);
      const hasWelcome = await welcome
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasActivation || hasWelcome).toBe(true);
    });

    await test.step("5. Injetar Pilot Mode e abrir TPV central (pode redirecionar para activation)", async () => {
      await page.evaluate(() => {
        localStorage.setItem("chefiapp_pilot_mode", "true");
        localStorage.setItem("chefiapp_bypass_health", "true");
        localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
        localStorage.setItem(
          "chefiapp_restaurant_id",
          "00000000-0000-0000-0000-000000000100",
        );
      });
      await page.goto("/op/tpv", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForURL(/\/(op\/tpv|app\/activation)/, { timeout: 15_000 });
      const url = page.url();
      expect(url.includes("/op/tpv") || url.includes("/app/activation")).toBe(
        true,
      );
    });

    await test.step("6. Abrir KDS central", async () => {
      await page.goto("/op/kds", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForURL(/\/op\/kds/, { timeout: 10_000 });
      const body = await page.locator("body").textContent();
      expect(body?.length ?? 0).toBeGreaterThan(100);
    });

    await test.step("7. Confirmar que TPV e KDS estão acessíveis (ou activation visível)", async () => {
      await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      const url = page.url();
      if (url.includes("/op/tpv")) {
        await expect(
          page
            .locator("body")
            .getByText(/TPV|Caixa|Pedido|produto|€|KDS|Cozinha/i)
            .first(),
        ).toBeVisible({ timeout: 15_000 });
      }
      if (url.includes("/app/activation")) {
        await expect(
          page
            .getByText(/Centro de Ativação|Complete o setup|checklist/i)
            .first(),
        ).toBeVisible({ timeout: 10_000 });
      }
    });

    await test.step("8. Relatório do dono: overview e multiunit (com pilot)", async () => {
      await page.goto("/admin/reports/overview", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForLoadState("domcontentloaded");
      const overviewBody = await page.locator("body").textContent();
      expect(overviewBody?.length ?? 0).toBeGreaterThan(100);

      await page.goto("/admin/reports/multiunit", {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForLoadState("domcontentloaded");
      const multiunitBody = await page.locator("body").textContent();
      expect(multiunitBody?.length ?? 0).toBeGreaterThan(100);
    });
  });
});
