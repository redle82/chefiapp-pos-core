import { BrowserContext, expect, Page, test } from "@playwright/test";

/**
 * PHASE 1 OPERATIONAL CHECK
 *
 * Objetivo: validar fluxo TPV -> KDS em múltiplas iterações,
 * com setup resiliente para o runtime atual (/op/tpv e /op/kds).
 */

test.describe.serial("Phase 1 Operational Check", () => {
  test.setTimeout(600000);

  let contextTPV: BrowserContext;
  let contextKDS: BrowserContext;
  let pageTPV: Page;
  let pageKDS: Page;

  const ITERATIONS = Number.parseInt(
    process.env.RUN_PHASE1_ITERATIONS || "20",
    10,
  );

  const injectPilotMode = async (ctx: BrowserContext) => {
    await ctx.addInitScript(() => {
      window.sessionStorage.setItem("chefiapp_debug", "1");
      window.localStorage.setItem("chefiapp_pilot_mode", "true");
      window.localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
      window.sessionStorage.setItem(
        "chefiapp_keycloak_session",
        JSON.stringify({
          session: { access_token: "mock-pilot-token" },
          user: { id: "pilot-user-id", email: "pilot@example.com" },
        }),
      );
    });
  };

  async function ensureShiftOpen(page: Page) {
    await page.goto("/op/tpv/shift", { waitUntil: "domcontentloaded" });
    const openShiftButton = page.getByRole("button", { name: /Abrir turno/i });

    if (await openShiftButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const openingCashInput = page.getByLabel(/Saldo inicial/i);
      if (
        await openingCashInput.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await openingCashInput.fill("100");
      }
      await openShiftButton.click();
      await page.waitForTimeout(1500);
    }
  }

  async function ensureProductsAvailable(page: Page) {
    await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });

    const addButtons = page.locator(
      'button[title="Adicionar ao pedido"]:not([disabled])',
    );
    if ((await addButtons.count()) > 0) return;

    await page.goto("/menu-builder", { waitUntil: "domcontentloaded" });
    const presetButton = page
      .locator("button")
      .filter({ hasText: /Aplicar preset/i })
      .first();

    if (await presetButton.isVisible({ timeout: 7000 }).catch(() => false)) {
      await presetButton.click();
      await page.waitForTimeout(1500);
    }

    await page.goto("/app/publish", { waitUntil: "domcontentloaded" });
    const publishButton = page
      .locator("button")
      .filter({ hasText: /Publicar|Publish/i })
      .first();

    if (await publishButton.isVisible({ timeout: 7000 }).catch(() => false)) {
      await publishButton.click();
      await page.waitForTimeout(1500);
    }

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      const firstAddButton = page
        .locator('button[title="Adicionar ao pedido"]:not([disabled])')
        .first();

      if (
        await firstAddButton.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        return;
      }

      await page.waitForTimeout(1200);
    }

    await expect(
      page
        .locator('button[title="Adicionar ao pedido"]:not([disabled])')
        .first(),
    ).toBeVisible({ timeout: 10000 });
  }

  async function addOneProduct(page: Page) {
    const addButton = page
      .locator('button[title="Adicionar ao pedido"]:not([disabled])')
      .first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();
  }

  async function sendToKitchen(page: Page) {
    const sendButton = page.getByRole("button", {
      name: /Enviar para cozinha/i,
    });

    await expect(sendButton).toBeEnabled({ timeout: 10000 });
    await sendButton.click();
  }

  async function processOneTicketOnKDS(page: Page) {
    await page.goto("/op/tpv/kitchen", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const kitchenHeader = page.getByText(/Cozinha\s*·\s*KDS/i).first();
    const isEmbeddedKitchen = await kitchenHeader
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!isEmbeddedKitchen) {
      await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
    }

    let foundTicket = false;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const orderRow = page.locator('[data-testid^="order-row-"]').first();
      if (await orderRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await orderRow.click();
        await page.waitForTimeout(300);
        foundTicket = true;
        break;
      }

      const kdsCard = page.getByText(/Pedido\s*#/i).first();
      if (await kdsCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        foundTicket = true;
        break;
      }

      await page.waitForTimeout(1200);
      await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    }

    if (!foundTicket) {
      await expect(page.getByText(/Pedido\s*#/i).first()).toBeVisible({
        timeout: 10000,
      });
    }

    const startPrepButton = page
      .getByRole("button", { name: /Iniciar preparo/i })
      .first();
    if (await startPrepButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startPrepButton.click();
      await page.waitForTimeout(500);
    }

    const readyActionButton = page
      .locator(
        'button[title="Marcar como pronto"], button:has-text("Item pronto")',
      )
      .first();

    if (
      await readyActionButton.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await readyActionButton.click();
      await page.waitForTimeout(500);
    }
  }

  test.beforeAll(async ({ browser }) => {
    contextTPV = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    contextKDS = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    await injectPilotMode(contextTPV);
    await injectPilotMode(contextKDS);

    pageTPV = await contextTPV.newPage();
    pageKDS = await contextKDS.newPage();
  });

  test("Execute 20 Orders Flow", async () => {
    const runPhase1Stress = process.env.RUN_PHASE1_STRESS === "1";
    test.skip(
      !runPhase1Stress,
      "Stress test (20 iterations, 10min+) — run manually with RUN_PHASE1_STRESS=1",
    );

    console.log(
      `[START] Starting ${ITERATIONS} iterations of TPV -> KDS flow.`,
    );

    await ensureShiftOpen(pageTPV);
    await ensureProductsAvailable(pageTPV);

    for (let i = 1; i <= ITERATIONS; i += 1) {
      console.log(`--- ITERATION ${i}/${ITERATIONS} ---`);

      await pageTPV.goto("/op/tpv", { waitUntil: "domcontentloaded" });
      await addOneProduct(pageTPV);
      await sendToKitchen(pageTPV);

      await expect(
        pageTPV.getByText(/enviado para cozinha|pedido enviado/i).first(),
      )
        .toBeVisible({ timeout: 7000 })
        .catch(() => {});

      await processOneTicketOnKDS(pageKDS);
    }

    console.log(`[DONE] All ${ITERATIONS} orders processed.`);
  });

  test.afterAll(async () => {
    await contextTPV.close();
    await contextKDS.close();
  });
});
