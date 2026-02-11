import { expect, test } from "@playwright/test";

test.describe("E2E humano operacional", () => {
  test.use({
    actionTimeout: 15000,
    navigationTimeout: 20000,
  });

  test("operador percorre admin, inventario, compras, TPV e KDS", async ({
    page,
    request,
  }) => {
    const restaurantId = "00000000-0000-0000-0000-000000000100";
    const coreRestUrl =
      process.env.CORE_REST_URL || "http://localhost:3001/rest/v1";
    const anonKey =
      process.env.CORE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

    await page.context().addInitScript((id: string) => {
      window.sessionStorage.setItem("chefiapp_debug", "1");
      window.localStorage.setItem("chefiapp_debug_mode", "true");
      window.localStorage.setItem("chefiapp_pilot_mode", "true");
      window.localStorage.setItem("chefiapp_bypass_health", "true");
      window.localStorage.setItem("chefiapp_restaurant_id", id);
      window.sessionStorage.setItem(
        "chefiapp_keycloak_session",
        JSON.stringify({
          session: { access_token: "mock-pilot-token" },
          user: { id: "pilot-user-id", email: "pilot@example.com" },
        }),
      );
    }, restaurantId);

    const apiHeaders = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    };

    await test.step("Admin: abrir overview de relatórios", async () => {
      await page.goto("/admin/reports/overview", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: /Relat[óo]rios/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/Hist[óo]rico e an[áa]lise/i)).toBeVisible();
    });

    await test.step("Admin: abrir catálogo de produtos", async () => {
      await page.goto("/admin/catalog/products", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByText(/Gest[ãa]o massiva de produtos/i),
      ).toBeVisible({
        timeout: 20000,
      });
      await expect(
        page.getByRole("button", { name: /Criar produto/i }),
      ).toBeVisible();
    });

    await test.step("Inventário: ver estoque e ingredientes", async () => {
      await page.goto("/inventory-stock", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Invent[áa]rio e Estoque/i)).toBeVisible({
        timeout: 20000,
      });
      await page.getByRole("button", { name: /Estoque/i }).click();
      await page.getByRole("button", { name: /Ingredientes/i }).click();
      await expect(
        page.getByRole("heading", { name: /Ingredientes/i }),
      ).toBeVisible();
    });

    await test.step("Compras: abrir lista de compras", async () => {
      await page.goto("/shopping-list", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Lista de Compras/i)).toBeVisible({
        timeout: 20000,
      });
      await page.getByRole("button", { name: /Atualizar/i }).click();
    });

    await test.step("TPV: abrir turno e criar pedido", async () => {
      await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      const openTurn = page.getByRole("button", { name: /Abrir Turno/i });
      if (await openTurn.isVisible().catch(() => false)) {
        await openTurn.click();
      }

      const productItem = page.locator("text=/€\\s*\\d/").first();
      await expect(productItem).toBeVisible({ timeout: 30000 });
      await productItem.click();

      const createOrderBtn = page.getByRole("button", {
        name: /Criar Pedido/i,
      });
      await expect(createOrderBtn).toBeEnabled({ timeout: 15000 });
      await createOrderBtn.click();

      const confirmation = page.getByText(/Pedido.*(criado|pago)/i);
      await expect(confirmation).toBeVisible({ timeout: 15000 });
    });

    await test.step("API: criar pedido aberto para KDS", async () => {
      const productRes = await request.get(
        `${coreRestUrl}/gm_products?restaurant_id=eq.${restaurantId}&available=eq.true&limit=1`,
        { headers: apiHeaders },
      );
      expect(productRes.ok()).toBe(true);
      const products = await productRes.json();
      expect(products.length).toBeGreaterThan(0);

      const orderRes = await request.post(
        `${coreRestUrl}/rpc/create_order_atomic`,
        {
          headers: apiHeaders,
          data: {
            p_restaurant_id: restaurantId,
            p_items: [
              {
                product_id: products[0].id,
                name: products[0].name,
                quantity: 1,
                unit_price: products[0].price_cents,
              },
            ],
            p_payment_method: "cash",
          },
        },
      );
      expect(orderRes.ok()).toBe(true);
    });

    await test.step("KDS: verificar pedidos e iniciar preparo", async () => {
      await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      const kdsLoaded = page.locator(
        "text=/KDS — Pedidos ativos|Nenhum pedido ativo|Actualizar/i",
      );
      await expect(kdsLoaded.first()).toBeVisible({ timeout: 30000 });

      const startPrep = page.getByRole("button", { name: /Iniciar preparo/i });
      if (
        await startPrep
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await startPrep.first().click();
      }
    });

    await test.step("Tarefas: abrir sistema de tarefas", async () => {
      await page.goto("/task-system", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/Sistema de Tarefas/i)).toBeVisible({
        timeout: 30000,
      });
    });

    await test.step("AppStaff: validar chamados, tarefas e abrir TPV", async () => {
      await page.goto("/app/staff", { waitUntil: "domcontentloaded" });

      // StaffModule blocks on runtime/identity/auth loading — allow generous timeout
      const quickRole = page.getByRole("button", { name: /Gar[çc]om/i });
      await expect(quickRole).toBeVisible({ timeout: 30000 });
      await quickRole.click({ force: true });

      await expect(page.getByText(/contract:✓/i)).toBeVisible({
        timeout: 20000,
      });
      await expect(page.getByText(/worker:✓/i)).toBeVisible({
        timeout: 20000,
      });

      await expect(page).toHaveURL(/\/app\/staff\/home(\/|$)/);
      const chamadosButton = page.getByRole("button", { name: /Chamados/i });
      await expect(chamadosButton).toBeVisible({ timeout: 20000 });
      await chamadosButton.click();
      await expect(page).toHaveURL(/\/app\/staff\/mode\/alerts/);

      const homeLink = page.getByRole("link", { name: /In[ií]cio/i });
      await homeLink.click();
      await expect(page).toHaveURL(/\/app\/staff\/home/);
      const tarefasButton = page.getByRole("button", { name: /Tarefas/i });
      await expect(tarefasButton).toBeVisible({ timeout: 20000 });
      await tarefasButton.click();
      await expect(page).toHaveURL(/\/app\/staff\/mode\/tasks/);

      await homeLink.click();
      await expect(page).toHaveURL(/\/app\/staff\/home/);
      const turnoButton = page.getByRole("button", { name: /Turno/i });
      await expect(turnoButton).toBeVisible({ timeout: 20000 });
      await turnoButton.click();
      await expect(page).toHaveURL(/\/app\/staff\/mode\/turn/);

      await homeLink.click();
      await expect(page).toHaveURL(/\/app\/staff\/home/);
      const pedidosButton = page.getByRole("button", { name: /Pedidos/i });
      await expect(pedidosButton).toBeVisible({ timeout: 20000 });
      await pedidosButton.click();
      await expect(page).toHaveURL(/\/app\/staff\/mode\/tpv/);
    });
  });
});
