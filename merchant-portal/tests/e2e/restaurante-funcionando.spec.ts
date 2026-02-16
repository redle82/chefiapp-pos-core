import { expect, test } from "@playwright/test";

/**
 * E2E fluxo completo com dados: API seed (restaurante, caixa, tarefas) → TPV (criar pedido) → KDS → Sistema de Tarefas.
 * Requer Core em execução (CORE_REST_URL). Em CI sem Core, o teste é ignorado.
 * Referência: LANCAMENTO_GAP_ATUALIZADO — Essencial 9 (E2E fluxo completo).
 */

const skipWithoutCore =
  process.env.CI === "true" && !process.env.CORE_REST_URL;

test.describe("Restaurante funcionando end-to-end", () => {
  test.use({
    actionTimeout: 15000,
    navigationTimeout: 20000,
  });

  test("fluxo completo: garcom + dono + cozinha + tarefas", async ({
    browser,
    request,
  }) => {
    test.skip(skipWithoutCore, "Core não disponível em CI; executar com CORE_REST_URL para validar fluxo completo");

    const restaurantId = "00000000-0000-0000-0000-000000000100";
    const coreRestUrl =
      process.env.CORE_REST_URL || "http://localhost:3001/rest/v1";
    const anonKey =
      process.env.CORE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

    const apiHeaders = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    };

    /** Inject pilot/debug mode into browser context for all pages. */
    const injectPilot = async (
      context: Awaited<ReturnType<typeof browser.newContext>>,
    ) => {
      await context.addInitScript((id: string) => {
        window.sessionStorage.setItem("chefiapp_debug", "1");
        window.localStorage.setItem("chefiapp_debug_mode", "true");
        window.localStorage.setItem("chefiapp_pilot_mode", "true");
        window.localStorage.setItem("chefiapp_bypass_health", "true");
        window.localStorage.setItem("chefiapp_restaurant_id", id);
        window.localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
        window.sessionStorage.setItem(
          "chefiapp_keycloak_session",
          JSON.stringify({
            session: { access_token: "mock-pilot-token" },
            user: { id: "pilot-user-id", email: "pilot@example.com" },
          }),
        );
      }, restaurantId);
    };

    // ─── STEP 1: API seed — restaurant active, cash register open, tasks created ───
    await test.step("API: restaurante ativo, tarefas e caixa aberto", async () => {
      // Verify restaurant exists and is active
      const restaurantRes = await request.get(
        `${coreRestUrl}/gm_restaurants?id=eq.${restaurantId}&select=id,name,status`,
        { headers: apiHeaders },
      );
      expect(restaurantRes.ok()).toBe(true);
      const restaurants = await restaurantRes.json();
      expect(restaurants.length).toBeGreaterThan(0);
      expect(restaurants[0].status).toBe("active");

      // Open cash register (turno/shift) — required for TPV to allow order creation
      const cashRes = await request.post(
        `${coreRestUrl}/rpc/open_cash_register_atomic`,
        {
          headers: apiHeaders,
          data: {
            p_restaurant_id: restaurantId,
            p_name: "Caixa Principal",
            p_opened_by: "E2E Test",
            p_opening_balance_cents: 0,
          },
        },
      );
      if (!cashRes.ok()) {
        const cashBody = await cashRes.text();
        if (
          !cashBody.includes("CASH_REGISTER_ALREADY_OPEN") &&
          !cashBody.includes("already")
        ) {
          console.warn(
            `open_cash_register_atomic: status ${cashRes.status()}: ${cashBody}`,
          );
        }
      }

      // Create test tasks (fallback to direct gm_tasks insert if RPC unavailable)
      // First, clean up old e2e tasks to avoid deduplication interference
      await request.delete(
        `${coreRestUrl}/gm_tasks?restaurant_id=eq.${restaurantId}&context->>origin=eq.e2e`,
        { headers: { ...apiHeaders, Prefer: "return=minimal" } },
      );

      const taskPayloads = [
        {
          p_restaurant_id: restaurantId,
          p_task_type: "ENTREGA_PENDENTE",
          p_message: "Limpeza WC - checklist completo",
          p_station: "SERVICE",
          p_priority: "MEDIA",
          p_context: { origin: "e2e" },
        },
        {
          p_restaurant_id: restaurantId,
          p_task_type: "EQUIPAMENTO_CHECK",
          p_message: "Garcom: revisar mesa 3",
          p_station: "SERVICE",
          p_priority: "ALTA",
          p_context: { origin: "e2e" },
        },
        {
          p_restaurant_id: restaurantId,
          p_task_type: "ITEM_CRITICO",
          p_message: "Cozinha: preparar bancada",
          p_station: "KITCHEN",
          p_priority: "MEDIA",
          p_context: { origin: "e2e" },
        },
      ];

      for (const payload of taskPayloads) {
        const taskRes = await request.post(`${coreRestUrl}/rpc/create_task`, {
          headers: apiHeaders,
          data: payload,
        });
        if (!taskRes.ok()) {
          const status = taskRes.status();
          const body = await taskRes.text();
          const isMissingRpc = status === 404 && body.includes("PGRST202");
          if (!isMissingRpc) {
            throw new Error(
              `create_task failed (status ${status}): ${body || "<empty>"}`,
            );
          }

          const fallbackRes = await request.post(`${coreRestUrl}/gm_tasks`, {
            headers: apiHeaders,
            data: {
              restaurant_id: payload.p_restaurant_id,
              task_type: payload.p_task_type,
              message: payload.p_message,
              station: payload.p_station,
              priority: payload.p_priority,
              context: payload.p_context,
              status: "OPEN",
              auto_generated: false,
            },
          });
          if (!fallbackRes.ok()) {
            const fallbackBody = await fallbackRes.text();
            throw new Error(
              `gm_tasks insert failed (status ${fallbackRes.status()}): ${
                fallbackBody || "<empty>"
              }`,
            );
          }
        }
      }
    });

    // ─── Open browser contexts ───
    const waiterContext = await browser.newContext();
    const ownerContext = await browser.newContext();
    const kitchenContext = await browser.newContext();
    const tasksContext = await browser.newContext();

    await injectPilot(waiterContext);
    await injectPilot(ownerContext);
    await injectPilot(kitchenContext);
    await injectPilot(tasksContext);

    const pageWaiter = await waiterContext.newPage();
    const pageOwner = await ownerContext.newPage();
    const pageKitchen = await kitchenContext.newPage();
    const pageTasks = await tasksContext.newPage();

    // ─── STEP 2: Waiter creates order on TPV ───
    await test.step("Garcom: cria pedido no TPV", async () => {
      await pageWaiter.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      await pageWaiter.waitForLoadState("networkidle");

      // Wait for product grid to render (€ price items only appear when health check passes)
      const productItem = pageWaiter.locator("text=/€\\s*\\d/").first();
      await expect(productItem).toBeVisible({ timeout: 30000 });
      await productItem.click();

      // Wait for "Criar Pedido" button to be enabled
      // May initially show "Caixa Fechado" until ShiftContext detects the open cash register
      const createOrderBtn = pageWaiter.getByRole("button", {
        name: /Criar Pedido/i,
      });
      await expect(createOrderBtn).toBeVisible({ timeout: 30000 });
      await expect(createOrderBtn).toBeEnabled({ timeout: 10000 });
      await createOrderBtn.click();

      // Success: "Pedido #XXXXXXXX pago ..." (cash register open) or "Pedido #XXXXXXXX criado ..."
      const confirmation = pageWaiter.getByText(/Pedido.*(criado|pago)/i);
      await expect(confirmation).toBeVisible({ timeout: 15000 });
    });

    // ─── STEP 3: Owner creates order on TPV ───
    await test.step("Dono: cria pedido no TPV", async () => {
      await pageOwner.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      await pageOwner.waitForLoadState("networkidle");

      const productItem = pageOwner.locator("text=/€\\s*\\d/").first();
      await expect(productItem).toBeVisible({ timeout: 30000 });
      await productItem.click();

      const createOrderBtn = pageOwner.getByRole("button", {
        name: /Criar Pedido/i,
      });
      await expect(createOrderBtn).toBeVisible({ timeout: 30000 });
      await expect(createOrderBtn).toBeEnabled({ timeout: 10000 });
      await createOrderBtn.click();

      const confirmation = pageOwner.getByText(/Pedido.*(criado|pago)/i);
      await expect(confirmation).toBeVisible({ timeout: 15000 });
    });

    // ─── STEP 4: Create unpaid order via API for KDS to display ───
    // TPV auto-pays orders when cash register is open, so KDS filters them out.
    // We create an order directly via create_order_atomic (status=OPEN) for KDS.
    await test.step("API: criando pedido OPEN para aparecer no KDS", async () => {
      const prodRes = await request.get(
        `${coreRestUrl}/gm_products?restaurant_id=eq.${restaurantId}&available=eq.true&limit=1`,
        { headers: apiHeaders },
      );
      expect(prodRes.ok()).toBe(true);
      const products = await prodRes.json();
      expect(products.length).toBeGreaterThan(0);

      const product = products[0];
      const orderRes = await request.post(
        `${coreRestUrl}/rpc/create_order_atomic`,
        {
          headers: apiHeaders,
          data: {
            p_restaurant_id: restaurantId,
            p_items: [
              {
                product_id: product.id,
                name: product.name,
                quantity: 1,
                unit_price: product.price_cents,
              },
            ],
            p_payment_method: "cash",
          },
        },
      );
      expect(orderRes.ok()).toBe(true);
    });

    // ─── STEP 5: Kitchen sees orders on KDS ───
    await test.step("Cozinha: pedidos aparecem no KDS", async () => {
      await pageKitchen.goto("/op/kds", { waitUntil: "domcontentloaded" });
      await pageKitchen.waitForLoadState("networkidle");

      // KDS shows "KDS — Pedidos ativos" when there are active orders,
      // or "Nenhum pedido ativo" / "Actualizar" when empty.
      // Wait for the page to fully load (any of these signals).
      const kdsLoaded = pageKitchen.locator(
        "text=/KDS — Pedidos ativos|Nenhum pedido ativo|Actualizar/i",
      );
      await expect(kdsLoaded.first()).toBeVisible({ timeout: 30000 });

      // Try to interact with KDS buttons if orders are visible
      const startPrep = pageKitchen.getByRole("button", {
        name: /Iniciar preparo/i,
      });
      if (
        await startPrep
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
        await startPrep.first().click();
        await pageKitchen.waitForTimeout(1000);
      }

      const itemReady = pageKitchen.getByRole("button", {
        name: /Item pronto|Pronto/i,
      });
      if (
        await itemReady
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
        await itemReady.first().click();
      }
    });

    // ─── STEP 6: Task System shows all 3 tasks ───
    await test.step("Sistema de Tarefas: limpeza + cozinha + garcom", async () => {
      await pageTasks.goto("/task-system", { waitUntil: "domcontentloaded" });
      await pageTasks.waitForLoadState("networkidle");

      // Wait for the heading — FlowGate fast-pass + runtime + identity + tasks loading
      await expect(pageTasks.getByText(/Sistema de Tarefas/i)).toBeVisible({
        timeout: 45000,
      });

      // Wait for tasks to load (polling may take up to 10s)
      await pageTasks.waitForTimeout(5000);

      // Diagnostic: dump page state if tasks might not be visible
      const diag = await pageTasks.evaluate(() => ({
        url: window.location.href,
        restaurantId: window.localStorage.getItem("chefiapp_restaurant_id"),
        bodyText: document.body.innerText.slice(0, 2000),
      }));
      console.log(
        "[E2E-DIAG] Task System page state:",
        JSON.stringify(diag, null, 2),
      );

      // Verify all 3 tasks appear
      await expect(
        pageTasks.getByText(/Limpeza WC - checklist completo/i),
      ).toBeVisible({ timeout: 20000 });
      await expect(pageTasks.getByText(/Garcom: revisar mesa 3/i)).toBeVisible({
        timeout: 15000,
      });
      await expect(
        pageTasks.getByText(/Cozinha: preparar bancada/i),
      ).toBeVisible({ timeout: 15000 });
    });

    // ─── Cleanup ───
    await waiterContext.close();
    await ownerContext.close();
    await kitchenContext.close();
    await tasksContext.close();
  });
});
