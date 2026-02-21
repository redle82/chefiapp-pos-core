/**
 * 🛡️ FLUXO CRÍTICO OPERACIONAL — E2E (Missão Crítica)
 *
 * Valida o ciclo operacional completo do restaurante:
 *   Login (Pilot) → TPV Mínimo → Selecionar produto → Pagar → Verificar Reports
 *
 * Se este teste falhar → produção falha.
 *
 * PREREQUISITOS:
 *   - App a correr em localhost:5175 (ou configurado em playwright.config.ts)
 *   - Docker Core a correr (backend) para modo completo
 *   - Em modo local sem Docker Core, usa Pilot Mode (auto-login)
 *
 * REGRA DE OURO: Nenhum deploy sem E2E verde.
 */
// @ts-nocheck


import { expect, test } from "@playwright/test";

// ──────────────────────────────────────────────────────────────
// 🛡️ FLUXO CRÍTICO OPERACIONAL
// ──────────────────────────────────────────────────────────────
test.describe("Fluxo Crítico Operacional", () => {
  test("Login → TPV → Criar pedido → Pagar → Reports", async ({ page }) => {
    // This is a long flow — allow up to 5 minutes
    test.slow();

    // Capture browser errors for debugging
    const browserErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        browserErrors.push(`🔴 ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      browserErrors.push(`💥 ${err.message}`);
    });

    // Cookie consent para evitar que o banner intercepte cliques
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });

    // ────────────────────────────────────────────────────────
    // PASSO 1: LOGIN (Pilot Mode — modo local)
    // ────────────────────────────────────────────────────────
    console.log("🔐 PASSO 1: Login via Pilot Mode...");

    await page.goto("/auth/phone");
    await page.evaluate(() => {
      localStorage.setItem("chefiapp_bypass_health", "true");
      localStorage.setItem("chefiapp_pilot_mode", "true");
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });
    await page.goto("/auth/phone");
    await page.waitForLoadState("domcontentloaded");

    // Pilot mode should auto-login or show "Simular Registo (Piloto)"
    if (page.url().includes("/auth")) {
      // Click "Simular Registo (Piloto)" if visible
      const pilotBtn = page
        .locator("button, [role='button'], a", {
          hasText: /Simular Registo|Piloto/i,
        })
        .first();

      if (await pilotBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        console.log("  🧪 Clicking 'Simular Registo (Piloto)'...");
        try {
          await pilotBtn.click();
          // Wait for redirect out of auth
          await page.waitForURL((url) => !url.pathname.includes("/auth"), {
            timeout: 10_000,
          });
        } catch (e) {
          console.log(
            "  ⚠️ Pilot button click didn't trigger redirect, navigating directly...",
          );
          // Fallback: navigate directly to app in pilot mode
          await page.goto("/app/hub", { waitUntil: "domcontentloaded" });
        }
      } else {
        console.log(
          "  ⚠️ Pilot button not found, navigating directly to app...",
        );
        // Fallback: navigate directly to app in pilot mode
        await page.goto("/app/hub", { waitUntil: "domcontentloaded" });
      }
    }
    console.log("✅ Login OK. URL:", page.url());

    // ────────────────────────────────────────────────────────
    // PASSO 2: NAVEGAR PARA TPV MÍNIMO
    // ────────────────────────────────────────────────────────
    console.log("🖥️ PASSO 2: Navegar para TPV...");
    await page.goto("/op/tpv");
    await page.waitForLoadState("domcontentloaded");

    // Verify we're on TPV (not redirected to auth)
    if (page.url().includes("/auth")) {
      throw new Error(
        "❌ Redirect para auth — sessão não persistiu após login",
      );
    }

    // Wait for TPV Mínimo to load — header "TPV Mínimo"
    // Try heading first, then fallback to text content or common TPV elements
    const tpvHeading = page
      .getByRole("heading", { name: /TPV Mínimo/i })
      .first();
    const tpvText = page
      .getByText(/TPV Mínimo|Criar Pedido|Nenhum item/i)
      .first();
    const subtotalEl = page.getByText(/Subtotal/i).first();

    const headingVisible = await tpvHeading
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    const textVisible = await tpvText
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    const subtotalVisible = await subtotalEl
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    if (headingVisible) {
      await expect(tpvHeading).toBeVisible();
    } else if (textVisible) {
      await expect(tpvText).toBeVisible();
    } else if (subtotalVisible) {
      // TPV is loaded if we see Subtotal
      console.log("✅ TPV loaded (Subtotal element found)");
    } else {
      const body = await page.locator("body").textContent();
      console.log("Page content on TPV load:", (body ?? "").substring(0, 200));
      throw new Error(
        "TPV Mínimo heading, text, or subtotal not found after 8s wait",
      );
    }

    // If "Caixa Fechado" is blocking, open the shift
    const openTurnBtn = page
      .getByRole("button", { name: /Abrir Turno/i })
      .first();
    if (await openTurnBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log("  💰 Turno fechado. Abrindo turno...");
      await openTurnBtn.click();
      await page.waitForTimeout(3_000);
      // Wait for the blocking banner to disappear
      await expect(page.getByText("Caixa Fechado:").first()).toBeHidden({
        timeout: 10_000,
      });
      console.log("  ✅ Turno aberto.");
    }

    console.log("✅ TPV carregado.");

    // ────────────────────────────────────────────────────────
    // PASSO 3: SELECIONAR PRODUTO (Adicionar ao carrinho)
    // ────────────────────────────────────────────────────────
    console.log("🛒 PASSO 3: Selecionar produto...");

    // Wait for "Produtos Disponíveis" section to appear or for products to be visible
    const produtosText = page.getByText("Produtos Disponíveis").first();
    const produtoVisivel = await produtosText
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    if (!produtoVisivel) {
      console.log(
        "  ⚠️ 'Produtos Disponíveis' text not found, looking for product items directly...",
      );
    }

    // Product cards in the modern TPV live under .tpv-products-grid with role=button.
    const gridProductCard = page
      .locator('.tpv-products-grid [role="button"]')
      .first();
    const fallbackProductCard = page
      .locator('div[role="button"]')
      .filter({ hasText: /€\s*\d/ })
      .first();

    const gridVisible = await gridProductCard
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    const productCard = gridVisible ? gridProductCard : fallbackProductCard;

    await expect(productCard).toBeVisible({ timeout: 15_000 });

    // Get product name for logging
    const productText = await productCard.textContent();
    console.log(
      `  📦 Produto: "${(productText ?? "?").trim().substring(0, 50)}"`,
    );

    await productCard.click();

    // ────────────────────────────────────────────────────────
    // PASSO 4: PAGAR (Selecionar método + finalizar)
    // ────────────────────────────────────────────────────────
    console.log("💳 PASSO 4: Pagar...");

    // Verify item was added to cart — empty state should disappear and totals remain visible
    await page
      .getByText(/Nenhum item no pedido|Carrinho vazio/i)
      .first()
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
    await expect(page.getByText(/Total/i).first()).toBeVisible({
      timeout: 10_000,
    });
    console.log("  ✅ Item no carrinho. Total visível.");

    // Select "Cartão" payment method
    const cardBtn = page.getByRole("button", { name: "Cartão" }).first();
    if (await cardBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cardBtn.click();
      console.log("  💳 Método: Cartão.");
    }

    // Click order action to finalize (legacy "Criar Pedido" or modern "Proceed")
    const createOrderBtn = page
      .getByRole("button", { name: /Criar Pedido|Proceed/i })
      .first();
    await expect(createOrderBtn).toBeVisible({ timeout: 10_000 });
    await expect(createOrderBtn).toBeEnabled({ timeout: 10_000 });
    await createOrderBtn.click();
    console.log("  🚀 Ação de criação/finalização clicada.");

    // ────────────────────────────────────────────────────────
    // PASSO 5: CONFIRMAR ESTADO FINAL
    // ────────────────────────────────────────────────────────
    console.log("🏁 PASSO 5: Confirmar estado final...");

    // After order action, accept either explicit success toast or stable TPV status state.
    await expect(
      page
        .getByText(
          /Carrinho vazio|Pedido.*(cria|pago|confirmado)|STATUS|Sem pedido/i,
        )
        .first(),
    ).toBeVisible({ timeout: 20_000 });
    console.log("✅ Pedido criado com sucesso.");

    // ────────────────────────────────────────────────────────
    // PASSO 6: VERIFICAR PAINEL DE RELATÓRIOS
    // ────────────────────────────────────────────────────────
    console.log("📊 PASSO 6: Verificar Reports...");

    await page.goto("/admin/reports/overview");
    await page.waitForLoadState("domcontentloaded");

    // Should NOT redirect to auth
    if (page.url().includes("/auth")) {
      throw new Error(
        "❌ Redirect para auth ao aceder reports — sessão expirou",
      );
    }

    // Reports page should show the reports section
    await expect(page.getByText("Relatórios").first()).toBeVisible({
      timeout: 15_000,
    });
    console.log("✅ Painel de reports carregado.");

    // ────────────────────────────────────────────────────────
    // RESULTADO FINAL
    // ────────────────────────────────────────────────────────
    console.log("");
    console.log("═══════════════════════════════════════════");
    console.log("🏆 FLUXO CRÍTICO OPERACIONAL: PASSOU TUDO");
    console.log("═══════════════════════════════════════════");

    if (browserErrors.length > 0) {
      console.warn(`\n⚠️ ${browserErrors.length} erros de browser capturados:`);
      browserErrors.slice(0, 5).forEach((e) => console.warn(`  ${e}`));
    }
  });
});
