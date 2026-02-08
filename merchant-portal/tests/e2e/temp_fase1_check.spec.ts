import { BrowserContext, expect, Page, test } from "@playwright/test";

/**
 * PHASE 1 OPERATIONAL CHECK - 20 REPETITIONS
 *
 * Objective: Validate TPV -> KDS flow 20 times strictly.
 * Pre-conditions assumed: Shift Open, Menu Published.
 */

test.describe.serial("Phase 1 Operational Check", () => {
  test.setTimeout(600000);

  let contextTPV: BrowserContext;
  let contextKDS: BrowserContext;
  let pageTPV: Page;
  let pageKDS: Page;

  const ITERATIONS = 20;

  // --- HELPER: Pilot Mode Injection ---
  const injectPilotMode = async (ctx: BrowserContext) => {
    await ctx.addInitScript(() => {
      window.sessionStorage.setItem("chefiapp_debug", "1");
      window.localStorage.setItem("chefiapp_pilot_mode", "true");
      window.sessionStorage.setItem(
        "chefiapp_keycloak_session",
        JSON.stringify({
          session: { access_token: "mock-pilot-token" },
          user: { id: "pilot-user-id", email: "pilot@example.com" },
        }),
      );
    });
  };

  test.beforeAll(async ({ browser }) => {
    contextTPV = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    contextKDS = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    await injectPilotMode(contextTPV);
    await injectPilotMode(contextKDS);

    pageTPV = await contextTPV.newPage();
    pageKDS = await contextKDS.newPage();
  });

  test("Execute 20 Orders Flow", async () => {
    // Stress test (20 iterations, 10min+) — run manually:
    // npx playwright test temp_fase1_check --timeout 0
    test.skip(
      true,
      "Stress test (20 iterations, 10min+) — run manually with --grep",
    );

    console.log(
      `[START] Starting ${ITERATIONS} iterations of TPV -> KDS flow.`,
    );

    // --- SETUP PHASE ---
    // --- SETUP PHASE ---
    console.log("[SETUP] Navigating to TPV to force state check...");
    await pageTPV.goto("/app/tpv");
    await pageTPV.waitForLoadState("domcontentloaded");
    await pageTPV.waitForTimeout(3000);

    // Check where we ended up
    const startUrl = pageTPV.url();
    const startBody = await pageTPV.innerText("body");
    console.log(`[SETUP] Initial URL: ${startUrl}`);

    if (
      startBody.includes("Criar o teu restaurante") ||
      startUrl.includes("/bootstrap") ||
      startUrl.includes("/onboarding")
    ) {
      console.log("[SETUP] Redirected to Bootstrap. Creating Restaurant...");
      await pageTPV.screenshot({ path: "debug-bootstrap-detected.png" });

      await pageTPV
        .locator('input[type="text"]')
        .first()
        .fill("Restaurante Teste Auto");

      // Select Type
      await pageTPV.getByText("Restaurante", { exact: true }).first().click();

      const submitBtn = pageTPV
        .locator(
          'button:has-text("Criar"), button:has-text("Salvar"), button:has-text("Continuar")',
        )
        .first();
      await submitBtn.click();
      await pageTPV.waitForTimeout(5000);
    }

    if ((await pageTPV.innerText("body")).includes("Criar e continuar")) {
      console.log("[SETUP] Redirected to First Product. Creating Product...");
      await pageTPV.screenshot({ path: "debug-firstproduct-detected.png" });

      await pageTPV
        .locator('input[placeholder*="Nome"], input[name="name"]')
        .first()
        .fill("Item Auto");
      await pageTPV
        .locator('input[placeholder*="Preço"], input[name="price"]')
        .first()
        .fill("15.00");
      await pageTPV.getByRole("button", { name: /Criar e continuar/i }).click();
      await pageTPV.waitForTimeout(5000);
    }

    // Retry TPV navigation
    console.log("[SETUP] Re-navigating to TPV...");
    await pageTPV.goto("/app/tpv");
    await pageKDS.goto("/app/kds");
    await pageTPV.waitForLoadState("domcontentloaded");
    await pageTPV.waitForTimeout(2000);

    // Check if we are on Dashboard or need to install terminal
    if (
      (await pageTPV.innerText("body")).includes("TPV — Não instalado") ||
      pageTPV.url().includes("/dashboard")
    ) {
      console.log("[SETUP] Terminal not installed. Installing...");

      // Find "Instalar terminal" button
      const installBtn = pageTPV.getByText("Instalar terminal").first();
      if (await installBtn.isVisible()) {
        console.log("[SETUP] Clicking 'Instalar terminal'...");
        await installBtn.click({ force: true });

        console.log("[SETUP] Waiting for modal...");
        await pageTPV.waitForTimeout(2000);

        // Fill Name in Modal
        console.log("[SETUP] Waiting for name input...");
        const nameInput = pageTPV.getByRole("textbox").first();
        try {
          await nameInput.waitFor({ state: "visible", timeout: 5000 });
          await nameInput.fill("PDV Auto");

          // Click "Instalar como TPV"
          console.log("[SETUP] Clicking 'Instalar como TPV'...");
          await pageTPV
            .getByRole("button", { name: "Instalar como TPV" })
            .first()
            .click({ force: true });

          await pageTPV.waitForTimeout(5000);
          console.log("[SETUP] Terminal creation attempted.");
        } catch (e) {
          console.log(`[SETUP] Failed to find input or create: ${e}`);
          console.log("[DEBUG] Modal HTML Dump:");
          console.log((await pageTPV.innerHTML("body")).slice(0, 5000));
          await pageTPV.screenshot({ path: "debug-install-fail.png" });
        }
      }
    }

    // --- OPEN SHIFT FIRST ---
    // Check if shift is closed (on TPV now)
    console.log("[SETUP] Checking Shift Status...");
    // Force TPV to be sure
    await pageTPV.goto("/app/tpv");
    await pageTPV.waitForTimeout(3000);

    if (
      (await pageTPV.innerText("body")).includes("Abrir Turno") ||
      (await pageTPV.innerText("body")).includes("Turno Fechado")
    ) {
      console.log("[SETUP] Detected Closed Shift on TPV. Opening...");
      const openBtn = pageTPV
        .locator("button")
        .filter({ hasText: /Abrir Turno|Abrir/i })
        .first();

      if (await openBtn.isVisible()) {
        await openBtn.click();
        await pageTPV.waitForTimeout(1000);
        const amtInput = pageTPV.locator('input[type="number"]');
        if (await amtInput.isVisible()) await amtInput.fill("100");
        // Use stricter match to avoid 'Abrir TPV'
        const shiftActionBtn = pageTPV
          .locator("button")
          .filter({ hasText: /(^Confirmar$|^Abrir Turno$)/i })
          .last();

        if (await shiftActionBtn.isVisible()) {
          await shiftActionBtn.click();
        }
        await pageTPV.waitForTimeout(3000);
      }
    }

    if ((await pageTPV.innerText("body")).includes("HISTÓRICO POR TURNO")) {
      console.log("[SETUP] Stuck on History. Trying 'Novo Turno'...");
      const openBtn = pageTPV
        .locator("button")
        .filter({ hasText: /Novo|Abrir/i })
        .first();
      if (await openBtn.isVisible()) {
        await openBtn.click();
        await pageTPV.waitForTimeout(1000);
        const amtInput = pageTPV.locator('input[type="number"]');
        if (await amtInput.isVisible()) await amtInput.fill("100");
        await pageTPV
          .getByRole("button", { name: /Confirmar|Abrir/i })
          .last()
          .click();
        await pageTPV.waitForTimeout(3000);
      }
    }

    // --- DETECT & SEED PRODUCTS ---
    console.log("[SETUP] Checking for products...");
    await pageTPV.goto("/app/tpv");
    await pageTPV.waitForLoadState("domcontentloaded");
    await pageTPV.waitForTimeout(2000);

    if (pageTPV.url().includes("dashboard")) {
      console.log(
        "[SETUP] On Dashboard. Clicking 'Abrir TPV' to check products...",
      );
      await pageTPV.getByRole("button", { name: "Abrir TPV" }).first().click();
      await pageTPV.waitForTimeout(3000);
    }

    const bodyText = await pageTPV.innerText("body");
    // Check actual elements too
    const productCheck = pageTPV
      .locator("div")
      .filter({ hasText: /€ \d+\.\d+/ })
      .first();
    const hasProducts = await productCheck.isVisible();

    if (
      !hasProducts ||
      bodyText.includes("Nenhum produto disponível") ||
      bodyText.includes("Adicione produtos") ||
      bodyText.includes("Menu Builder")
    ) {
      console.log("[SETUP] No products found. Seeding 'Item Auto'...");

      // Go to Menu
      console.log("[SETUP] Navigating to Menu Builder: /menu-builder");
      await pageTPV.goto("/menu-builder");
      await pageTPV.waitForLoadState("domcontentloaded");
      await pageTPV.waitForTimeout(5000);
      console.log(`[SETUP] In Menu. URL: ${pageTPV.url()}`);

      // Check for Preset Button (using locator filter for robustness)
      const presetBtn = pageTPV
        .locator("button")
        .filter({ hasText: /Aplicar preset/i })
        .first();
      try {
        console.log("[SETUP] Waiting for Preset Button...");
        await presetBtn.waitFor({ state: "visible", timeout: 10000 });
        console.log("[SETUP] Found 'Aplicar preset'. Clicking...");
        await presetBtn.click();
        await pageTPV.waitForTimeout(5000); // Wait for generation
      } catch (e) {
        console.log("[SETUP] Preset button NOT found after 10s. Dumping body:");
        console.log((await pageTPV.innerText("body")).slice(0, 2000));
        console.log("[SETUP] URL: " + pageTPV.url());
        // Don't fallback to manual to avoid crash? Or try?
        // Let's try manual but log
        console.log("[SETUP] Trying manual seeding...");
        // Fallback to manual
        console.log("[SETUP] Preset not found. Trying manual seeding...");
        // Try clicking 'Manual' first if it acts as a tab toggler
        const manualTab = pageTPV.getByText("Manual").first();
        if (await manualTab.isVisible()) await manualTab.click();
        await pageTPV.waitForTimeout(1000);

        // Try create category if needed
        const catBtn = pageTPV
          .locator("button")
          .filter({ hasText: /Adicionar Categoria|Nova Categoria/i })
          .first();
        if (await catBtn.isVisible()) {
          await catBtn.click();
          await pageTPV.waitForTimeout(500);
          await pageTPV.getByRole("textbox").first().fill("Geral");
          await pageTPV
            .getByRole("button", { name: /Salvar/i })
            .last()
            .click();
          await pageTPV.waitForTimeout(1000);
        }

        // Try create product with "+"
        const plusBtn = pageTPV.getByText("+").last();
        if (await plusBtn.isVisible()) {
          await plusBtn.click();
          await pageTPV.waitForTimeout(1000);
          await pageTPV.getByPlaceholder("Nome do produto").fill("Item Auto");
          await pageTPV.getByPlaceholder("Preço").fill("10");
          await pageTPV
            .getByRole("button", { name: /Salvar|Criar/i })
            .last()
            .click();
          await pageTPV.waitForTimeout(2000);
        }
      }

      // Publish
      console.log("[SETUP] Publishing Menu...");
      // Publish via Page
      console.log("[SETUP] Navigating to /app/publish...");
      await pageTPV.goto("/app/publish");
      await pageTPV.waitForLoadState("domcontentloaded");
      await pageTPV.waitForTimeout(2000);

      const publishActionBtn = pageTPV
        .locator("button")
        .filter({ hasText: /Publicar Agora|Publicar Alterações/i })
        .first();
      // If button exists, click it. If not, maybe already published?
      // Just try generic "Publicar" button on this page.
      const genericPubBtn = pageTPV
        .getByRole("button", { name: /Publicar/i })
        .first();

      if (await genericPubBtn.isVisible()) {
        console.log("[SETUP] Found Publish Button on page. Clicking...");
        await genericPubBtn.click({ force: true });
        await pageTPV.waitForTimeout(3000);
      } else {
        console.log(
          "[SETUP] Publish button not found on /app/publish. Assuming auto-published or 'Pronto'.",
        );
      }

      console.log("[SETUP] Publishing action checks done. Returning to TPV...");
    }

    // Force TPV again
    console.log("[SETUP] Navigating back to TPV...");
    await pageTPV.goto("/app/tpv");
    await pageTPV.waitForTimeout(2000);

    // Final TPV Health Check
    await expect(pageTPV.locator("body")).not.toContainText("Erro");

    for (let i = 1; i <= ITERATIONS; i++) {
      console.log(`\n--- ITERATION ${i}/${ITERATIONS} ---`);

      // Check Shift Status (Red Banner)
      const openShiftBtn = pageTPV
        .locator("button")
        .filter({ hasText: /^Abrir Turno$/ })
        .first();
      if (await openShiftBtn.isVisible()) {
        console.log("   [INFO] Shift is closed (Banner visible). Opening...");
        await openShiftBtn.click();
        await pageTPV.waitForTimeout(2000);
      }

      // Ensure we are on TPV
      if (pageTPV.url().includes("dashboard")) {
        console.log("   [INFO] On Dashboard. Clicking 'Abrir TPV'...");
        await pageTPV
          .getByRole("button", { name: "Abrir TPV" })
          .first()
          .click();
        await pageTPV.waitForLoadState("domcontentloaded");
        await pageTPV.waitForTimeout(2000);
      }

      console.log(`   [DEBUG] Current URL: ${pageTPV.url()}`);

      // Check for Products
      // Products are divs with inline styles and price text like "€ 1.80"
      const productCard = pageTPV
        .locator("div")
        .filter({ hasText: /€ \d+\.\d+/ })
        .first();
      // Click the parent if the filter matched the price line, or just click the product container if matched by text
      // Actually, identifying by "€" is robust. The click propagates.
      // If we are deep in a menu, hitting "Mesa" or "Voltar" might be needed.
      // Safest: go to /app/tpv again? No, that might refresh too much.
      // Better: finding the "Home" or "Tables" mode.

      // If we see "Produtos", we might be inside a completed order or new order.
      // Let's rely on finding a Table/Counter button.
      const tableBtn = pageTPV
        .locator(
          'button:has-text("Balcão"), button:has-text("Mesa"), .zone-selector',
        )
        .first();

      // If table button isn't visible, maybe we are inside an order?
      if (!(await tableBtn.isVisible())) {
        // If we are in an order, we might see the Cart or "Confirmar".
        console.log(
          "   [INFO] Table selection not visible, checking context...",
        );
        // Try to cancel/back if possible, or maybe we are just ready to add products?
      } else {
        await tableBtn.click({ force: true }).catch(() => {});
      }

      // Open Order / Click Table
      // Just click randomly on "Mesa 1" or "Balcão 1" if available
      // Or if we are already in order mode (products visible), skip this.
      const itemAuto = pageTPV.getByText("Item Auto", { exact: false }).first();
      // Also look for "Caña" or "Patatas" if sticking to existing restaurant
      const genericProduct = pageTPV
        .locator("div")
        .filter({ hasText: /€ \d+\.\d+/ })
        .first();

      if (
        !(await itemAuto.isVisible()) &&
        !(await genericProduct.isVisible())
      ) {
        console.log("   [INFO] No products visible. Trying to open table...");
        const specificTable = pageTPV
          .locator(
            'button:has-text("Mesa 1"), button:has-text("1"), button:has-text("Balcão")',
          )
          .first();
        if (await specificTable.isVisible()) {
          await specificTable.click();
        } else {
          const newSale = pageTPV
            .locator(
              'button:has-text("Nova"), button:has-text("Rapida"), .zone-selector',
            )
            .first();
          if (await newSale.isVisible()) await newSale.click();
        }
        await pageTPV.waitForTimeout(1000);
      }

      await pageTPV.waitForTimeout(500);

      // --- STEP 1: Add Item ---
      // Prefer "Item Auto" if available
      let activeLocator = genericProduct;
      // If Item Auto exists, use it.
      if (await itemAuto.isVisible()) {
        activeLocator = itemAuto;
      } else {
        // Use parent of price div (LEAF Node fix using getByText)
        const priceDiv = pageTPV.getByText(/€ \d+\.\d+/).first();
        activeLocator = priceDiv.locator("..");
      }

      if (await activeLocator.isVisible()) {
        const text = await activeLocator.innerText();
        console.log(
          `   [INFO] Clicking product: "${text.replace(/\n/g, " ")}"`,
        );
        await activeLocator.evaluate((e: HTMLElement) => e.click());
        await pageTPV.waitForTimeout(500);
      } else {
        // Error handling (dump body)
        console.error("   [ERROR] No products found! Dumping body text:");
        const bodyText = await pageTPV.innerText("body");
        console.log(bodyText.slice(0, 1000));
        await pageTPV.screenshot({ path: `debug-error-iteration-${i}.png` });
        throw new Error("No products found in TPV.");
      }

      // --- STEP 2: Confirm ---
      const confirmBtn = pageTPV
        .locator(
          'button:has-text("Criar Pedido"), button:has-text("Confirmar")',
        )
        .last();

      // Retry if not visible
      if (!(await confirmBtn.isVisible())) {
        console.log(
          "   [INFO] Confirm button not visible (Cart empty?). Retrying click...",
        );
        console.log("   [INFO] Body Dump:");
        console.log((await pageTPV.innerText("body")).slice(0, 500));
        await activeLocator.evaluate((e: HTMLElement) => e.click());
        await pageTPV.waitForTimeout(1000);
      }

      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Wait for success toast or transition
      await pageTPV.waitForTimeout(1500);
      console.log(`   [TPV] Order ${i} confirmed.`);

      // --- STEP 3: KDS Flow ---
      await pageKDS.bringToFront();

      // Find Ticket (using text content as KDSMinimal uses inline styles)
      console.log(`   [KDS] Waiting for order ticket...`);
      const ticketText = pageKDS.getByText(/Pedido #/).first();

      try {
        await expect(ticketText).toBeVisible({ timeout: 10000 });
      } catch (e) {
        console.error("   [ERROR] KDS did not show ticket. DUMP BODY:");
        const body = await pageKDS
          .innerText("body")
          .catch(() => "PAGE_KDS_CLOSED");
        console.log(body.slice(0, 1000));
        throw e;
      }

      // Step 1: Start Prep
      const startPrepBtn = pageKDS
        .getByRole("button", { name: "Iniciar preparo" })
        .first();
      if (await startPrepBtn.isVisible()) {
        console.log("   [KDS] Starting preparation...");
        await startPrepBtn.click();
        await pageKDS.waitForTimeout(1000);
      }

      // Step 2: Mark Items Ready
      let itemReadyBtn = pageKDS
        .getByRole("button", { name: "✅ Item pronto" })
        .first();
      let clickCount = 0;
      while (await itemReadyBtn.isVisible()) {
        console.log(`   [KDS] Marking item ready (${++clickCount})...`);
        await itemReadyBtn.click();
        await pageKDS.waitForTimeout(500);
        itemReadyBtn = pageKDS
          .getByRole("button", { name: "✅ Item pronto" })
          .first();
      }

      console.log(`   [KDS] Order processed.`);
      await pageKDS.waitForTimeout(500);

      // Verification: Check for error logs
      // (Implicit via Playwright failure if elements missing)
    }

    console.log("[DONE] All 20 orders processed cleanly.");
  });

  test.afterAll(async () => {
    await contextTPV.close();
    await contextKDS.close();
  });
});
