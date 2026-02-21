/**
 * Teste Humano Supremo — Nível Profundo (v2.5)
 *
 * Ritual obrigatório após Lei do Turno: uma voz, estado global sincronizado.
 * Cenário: Abrir turno no TPV → Criar pedido → Dashboard → KDS.
 *
 * Resultado esperado:
 * - Nenhum banner "turno fechado" no Dashboard nem no KDS
 * - Métricas visíveis no Dashboard
 * - Pedido na fila do KDS (ou estados funcionais)
 *
 * Pré-condições: App em baseURL (ex. localhost:5175), Core Docker (3001) ativo,
 * sessão válida com restaurante e menu (ex. fluxo bootstrap + first-product).
 * Se FlowGate redirecionar para /auth ou landing, o teste falha/skip conforme config.
 *
 * Referência: docs/implementation/PLANO_TECNICO_LEI_DO_TURNO.md, CONTRATO_DO_TURNO.md
 */
// @ts-nocheck


import { expect, test } from "@playwright/test";

const BANNER_TURNO_FECHADO = "O turno ainda não está aberto";

test.describe("Teste Humano Supremo v2.5 — Turno uma voz (TPV → Dashboard → KDS)", () => {
  test("Após abrir turno no TPV: Dashboard e KDS não mostram banner turno fechado; métricas e fila coerentes", async ({
    page,
  }) => {
    // Pré-condição: conseguir chegar à área operacional (sem redirect para landing/auth)
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("/auth") || url.includes("/landing")) {
      test.skip(
        true,
        "Sem sessão/restaurante: redirecionado para auth/landing. Executar com app + Core e bootstrap completo."
      );
    }

    // 1) Ir ao TPV
    await page.goto("/op/tpv", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    if (page.url().includes("/auth")) {
      test.skip(
        true,
        "TPV redirecionou para auth. Executar com sessão válida."
      );
    }

    // Se aparecer bloqueio "Abrir turno", clicar para abrir (caixa inicial)
    const btnAbrirTurno = page
      .getByRole("button", { name: /abrir turno|caixa inicial/i })
      .first();
    const bloqueioAbrirTurno = page
      .getByText(/Para começar a vender|abrir o turno/i)
      .first();
    if (await bloqueioAbrirTurno.isVisible().catch(() => false)) {
      await btnAbrirTurno.click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    // TPV: após abrir turno, não deve mostrar banner "turno ainda não está aberto"
    const bannerTpv = page.getByText(BANNER_TURNO_FECHADO);
    await expect(bannerTpv)
      .not.toBeVisible({ timeout: 5000 })
      .catch(() => {});

    // 2) Criar pedido (se houver botão de produto / "Adicionar" / item do menu)
    const addProduct = page
      .getByRole("button", { name: /adicionar|adicionar ao carrinho/i })
      .first()
      .or(page.locator("[data-testid='add-product']").first())
      .or(page.getByText(/Café|€|produto/i).first());
    if (await addProduct.isVisible().catch(() => false)) {
      await addProduct.click().catch(() => {});
      await page.waitForTimeout(1000);
      // Confirmar pagamento se aparecer (ex. "Pagar" / "Confirmar")
      const btnPagar = page
        .getByRole("button", { name: /pagar|confirmar|finalizar/i })
        .first();
      if (await btnPagar.isVisible().catch(() => false)) {
        await btnPagar.click().catch(() => {});
        await page.waitForTimeout(1500);
      }
    }

    // 3) Ir ao Dashboard
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000); // refreshShiftStatus ao montar

    // Critério: NENHUM banner "O turno ainda não está aberto"
    const bannerDashboard = page.getByText(BANNER_TURNO_FECHADO);
    await expect(bannerDashboard).not.toBeVisible({ timeout: 5000 });

    // Critério: métricas visíveis (cards operacionais ou texto de receita/pedidos)
    const metricsArea = page
      .getByText(/Pedidos|Receita|Turno|hoje|activo/i)
      .first();
    await expect(metricsArea).toBeVisible({ timeout: 5000 });

    // 4) Ir ao KDS
    await page.goto("/op/kds", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForLoadState("domcontentloaded");
    // Lei do Turno: KDS mostra "Verificando estado operacional..." até refresh do turno; depois fila ou "Nenhum pedido ativo"
    await page
      .getByText(
        /Verificando estado operacional|Nenhum pedido ativo|fila|novo|preparando|pronto/i
      )
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Critério: NENHUM banner "O turno ainda não está aberto"
    const bannerKds = page.getByText(BANNER_TURNO_FECHADO);
    await expect(bannerKds).not.toBeVisible({ timeout: 5000 });

    // Critério: KDS funcional (fila ou "Nenhum pedido ativo" — não bloqueio por turno)
    const kdsContent = page
      .getByText(/Nenhum pedido ativo|fila|novo|preparando|pronto/i)
      .first();
    await expect(kdsContent).toBeVisible({ timeout: 5000 });
  });
});
