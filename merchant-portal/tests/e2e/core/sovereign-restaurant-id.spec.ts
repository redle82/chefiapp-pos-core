/**
 * P2/P3/P4 Soberano — Validação automática: tenant + funcional + integração entre superfícies
 *
 * P2: em cada superfície, localStorage.getItem('chefiapp_restaurant_id') === seed.
 * P3: em cada superfície, evidência funcional mínima (UI carregada no contexto do restaurante).
 * P4: integração Admin → TPV — nome do restaurante visível no Admin = nome visível no TPV (mesmo contexto).
 * P4.1: integração operacional TPV → KDS — criar pedido no TPV, ver ticket no KDS (mesmo restaurante).
 * P4.2: KDS OPEN → IN_PREP; P4.3: IN_PREP → READY; P4.4: após READY pedido sai da lista (ciclo fechado).
 *
 * Pré-requisitos:
 * - Backend Supabase (VITE_SUPABASE_URL com supabase.co)
 * - Seed executado: pnpm tsx scripts/seed-e2e-user.ts
 * - tests/e2e/e2e-creds.json com email, password, restaurant_id
 *
 * Execução:
 *   E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/core/sovereign-restaurant-id.spec.ts --project=sovereign
 *
 * @tag P2-SOVEREIGN-RESTAURANT-ID
 * @tag P3-SOVEREIGN-FUNCTIONAL
 * @tag P4-SOVEREIGN-INTEGRATION
 * @tag P4.1-SOVEREIGN-TPV-KDS
 * @tag P4.2-SOVEREIGN-KDS-STATE
 * @tag P4.3-SOVEREIGN-KDS-READY
 * @tag P4.4-SOVEREIGN-KDS-CYCLE-CLOSED
 * @tag P5-WEB-ORIGIN-KDS
 * @tag P5-QR-MESA-ORIGIN-KDS
 * @tag P5-STATION-ROUTING
 * @tag P5-PEDIDO-MISTO
 * @tag P5-PEDIDO-MISTO-WEB
 * @tag P5-PEDIDO-MISTO-QR
 * @tag P5-PEDIDO-MISTO-GARCOM
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { expect, test } from "../fixtures/base";

const CREDENTIALS_PATH = path.resolve(
  process.cwd(),
  "tests/e2e/e2e-creds.json",
);

interface SovereignCreds {
  email?: string;
  password?: string;
  restaurant_id?: string;
  slug?: string;
  table_id?: string;
}

function loadSovereignCreds(): SovereignCreds | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw) as SovereignCreds;
  } catch {
    return null;
  }
}

/** Superfície, path e asserção funcional mínima (que a página opera sobre o restaurante). */
const SURFACES: {
  name: string;
  path: string;
  /** Assertão funcional mínima: UI carregada no contexto do restaurante. */
  assertFunctional: (page: import("@playwright/test").Page) => Promise<void>;
}[] = [
  {
    name: "Admin",
    path: "/admin/config/general",
    assertFunctional: async (page) => {
      await expect(
        page
          .getByRole("heading", { name: /Identidade do Restaurante|Idioma e localização/i })
          .first(),
      ).toBeVisible({ timeout: 12_000 });
    },
  },
  {
    name: "TPV",
    path: "/op/tpv",
    assertFunctional: async (page) => {
      const productCard = page.locator('[data-testid="product-card"]');
      const tpvContent = page.locator(
        '[data-testid*="tpv"], [data-testid*="pos"], [class*="tpv"]',
      );
      const emptyState = page.getByText(
        /sem produtos|nenhum produto|adicionar produto|menu vazio/i,
      );
      await expect(
        productCard.first().or(tpvContent.first()).or(emptyState.first()),
      ).toBeVisible({ timeout: 15_000 });
    },
  },
  {
    name: "KDS",
    path: "/op/kds",
    assertFunctional: async (page) => {
      const kdsHeading = page.getByRole("heading", { name: /KDS|Pedidos ativos/i });
      const emptyState = page.getByText(
        /sem pedidos|nenhum pedido|a aguardar|cozinha|bootstrap/i,
      );
      await expect(kdsHeading.first().or(emptyState.first())).toBeVisible({
        timeout: 12_000,
      });
    },
  },
  {
    name: "AppStaff",
    path: "/app/staff/home",
    assertFunctional: async (page) => {
      const launcherTile = page.getByRole("button", {
        name: /Operação|Turno|TPV|Cozinha|Equipa/i,
      });
      const staffContent = page.getByText(/Operação|Turno|Staff|AppStaff/i);
      await expect(launcherTile.first().or(staffContent.first())).toBeVisible({
        timeout: 12_000,
      });
    },
  },
];

test.describe("P2/P3 Soberano — tenant + evidência funcional por superfície", () => {
  test("login com seed; em cada superfície verifica restaurant_id e UI operacional", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json com email, password e restaurant_id (ou E2E_RESTAURANT_ID). Execute: pnpm tsx scripts/seed-e2e-user.ts",
    );

    // 1) Login real em /auth
    await page.goto("/auth", { waitUntil: "domcontentloaded" });

    const emailInput = page.getByTestId("sovereign-auth-email");
    const passwordInput = page.getByTestId("sovereign-auth-password");
    const submitBtn = page.getByTestId("sovereign-auth-submit");

    await expect(
      emailInput.or(passwordInput).first(),
    ).toBeVisible({ timeout: 15_000 });

    await emailInput.fill(creds!.email!);
    await passwordInput.fill(creds!.password!);
    await submitBtn.click();

    // 2) Esperar sair de /auth (redirect pós-login)
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });

    // 3) Dar tempo ao FlowGate para selar o tenant
    await page.waitForTimeout(2_000);

    let restaurantNameFromAdmin: string | null = null;

    // 4) Em cada superfície: tenant id (P2) + evidência funcional (P3) + integração (P4)
    for (const { name, path: surfacePath, assertFunctional } of SURFACES) {
      await page.goto(surfacePath, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1_500);

      const actualId = await page.evaluate(() =>
        localStorage.getItem("chefiapp_restaurant_id"),
      );
      expect(
        actualId,
        `${name} (${surfacePath}): restaurant_id deve ser o do seed`,
      ).toBe(expectedId);

      await assertFunctional(page);

      // P4: integração Admin → TPV — nome do restaurante visível no Admin = nome no TPV
      if (name === "Admin") {
        const el = page.getByTestId("sovereign-restaurant-name").first();
        await expect(el).toBeVisible({ timeout: 5_000 });
        restaurantNameFromAdmin = (await el.textContent())?.trim() ?? null;
      }
      if (name === "TPV" && restaurantNameFromAdmin !== null) {
        const el = page.getByTestId("sovereign-restaurant-name").first();
        await expect(el).toBeVisible({ timeout: 5_000 });
        const nameInTpv = (await el.textContent())?.trim() ?? "";
        const normalize = (s: string) =>
          s
            .replace(/\s*\(TEST\)\s*$/i, "")
            .replace(/\s*—\s*Sandbox\s*$/i, "")
            .trim();
        expect(
          normalize(nameInTpv),
          "P4: nome do restaurante no TPV deve coincidir com o visível no Admin",
        ).toBe(normalize(restaurantNameFromAdmin));
      }
    }
  });

  test("P4.1 TPV → KDS: criar pedido no TPV e ver ticket no KDS (integração operacional)", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json com email, password e restaurant_id. Execute: pnpm tsx scripts/seed-e2e-user.ts (com produto E2E Burger)",
    );

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2_500);

    const productCard = page.getByTestId("sovereign-tpv-product-card").first();
    await expect(productCard).toBeVisible({ timeout: 15_000 });
    await productCard.click();
    await page.waitForTimeout(500);

    const sendBtn = page.getByTestId("sovereign-tpv-send-kitchen");
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();

    await page.waitForTimeout(2_000);

    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");
    await expect(orderCards.first()).toBeVisible({ timeout: 15_000 });
    const count = await orderCards.count();
    expect(count, "P4.1: KDS deve mostrar pelo menos um pedido criado no TPV").toBeGreaterThanOrEqual(1);

    // P5 station: pedido com E2E Burger (KITCHEN) deve aparecer na aba Cozinha
    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.first(),
      "P5 Cozinha: pedido TPV (E2E Burger) deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 5_000 });

    // P4.2: transição de estado no KDS — OPEN → IN_PREP (evidência operacional)
    const startPrepBtn = page.getByTestId("kds-start-preparation").first();
    await expect(startPrepBtn).toBeVisible({ timeout: 5_000 });
    await startPrepBtn.click();
    await page.waitForTimeout(3_000);
    const firstCard = orderCards.first();
    await expect(firstCard).toContainText("IN_PREP", { timeout: 15_000 });

    // P4.3: transição IN_PREP → READY — marcar item pronto (pedido com 1 item = READY)
    const itemReadyBtn = page.getByTestId("kds-item-ready").first();
    await expect(itemReadyBtn).toBeVisible({ timeout: 5_000 });
    await itemReadyBtn.click();
    await page.waitForTimeout(3_000);

    // P4.4: fechar ciclo — após READY o pedido sai da lista de ativos (KDS exclui READY/CLOSED de activeOnly)
    await expect(
      page.getByTestId("kds-all-ready-message"),
      "P4.4: após Item pronto o pedido sai da lista (mensagem 'todos prontos ou fechados')",
    ).toBeVisible({ timeout: 15_000 });
  });

  test("P5 Web → KDS: pedido criado na página pública aparece no KDS com badge WEB", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const slug = creds?.slug ?? "sovereign-burger-hub";
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json com email, password, restaurant_id (slug opcional). Execute: pnpm tsx scripts/seed-e2e-user.ts",
    );

    // 1) Criar pedido na página pública (sem login)
    await page.goto(`/public/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const addProduct = page.getByTestId("sovereign-web-add-product-E2E-Burger");
    await expect(addProduct).toBeVisible({ timeout: 15_000 });
    await addProduct.click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-web-cart-toggle").click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-web-submit-order").click();
    await page.waitForTimeout(3_000);

    // 2) Login para aceder ao KDS
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    // 3) Ir ao KDS e confirmar pedido com badge WEB
    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");
    await expect(orderCards.first()).toBeVisible({ timeout: 15_000 });
    await expect(
      orderCards.filter({ hasText: "WEB" }).first(),
      "P5 Web: KDS deve mostrar pelo menos um pedido com badge WEB",
    ).toBeVisible({ timeout: 5_000 });

    // P5 station: pedido Web (E2E Burger = KITCHEN) deve aparecer na aba Cozinha
    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.filter({ hasText: "WEB" }).first(),
      "P5 Cozinha: pedido Web deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 5_000 });
  });

  test("P5 QR Mesa → KDS: pedido criado na mesa aparece no KDS com badge QR MESA", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const slug = creds?.slug ?? "sovereign-burger-hub";
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json com email, password, restaurant_id. Seed deve criar mesa 1 (QR Mesa E2E).",
    );

    // 1) Criar pedido na página da mesa (sem login)
    await page.goto(`/public/${slug}/mesa/1`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const addProduct = page.getByTestId("sovereign-qr-add-product-E2E-Burger");
    await expect(addProduct).toBeVisible({ timeout: 15_000 });
    await addProduct.click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-qr-submit-order").click();
    await page.waitForURL(/\/public\/[^/]+\/order\/[a-f0-9-]+/i, { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // 2) Login para aceder ao KDS
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    // 3) Ir ao KDS e confirmar pedido com badge QR MESA
    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");
    await expect(orderCards.first()).toBeVisible({ timeout: 15_000 });
    await expect(
      orderCards.filter({ hasText: "QR MESA" }).first(),
      "P5 QR Mesa: KDS deve mostrar pelo menos um pedido com badge QR MESA",
    ).toBeVisible({ timeout: 5_000 });

    // P5 station: pedido QR Mesa (E2E Burger = KITCHEN) deve aparecer na aba Cozinha
    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.filter({ hasText: "QR MESA" }).first(),
      "P5 Cozinha: pedido QR Mesa deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 5_000 });
  });

  test("P5 Bar → KDS: pedido com item Bar aparece na aba Bar", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json. Seed deve criar E2E Drink (station BAR).",
    );

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2_500);

    const drinkCard = page
      .getByTestId("sovereign-tpv-product-card")
      .filter({ hasText: "E2E Drink" })
      .first();
    await expect(drinkCard).toBeVisible({ timeout: 15_000 });
    await drinkCard.getByTitle("Adicionar ao pedido").click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-tpv-send-kitchen").click();
    await page.waitForTimeout(2_000);

    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    await page.getByTestId("kds-tab-bar").click();
    await page.waitForTimeout(800);

    const orderCards = page.getByTestId("kds-order-card");
    await expect(
      orderCards.first(),
      "P5 Bar: pedido com E2E Drink deve aparecer na aba Bar",
    ).toBeVisible({ timeout: 15_000 });
  });

  test("P5 Pedido misto → KDS: pedido com item Cozinha e item Bar aparece nas duas abas", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json. Seed deve criar E2E Burger (KITCHEN) e E2E Drink (BAR).",
    );

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto("/op/tpv", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2_500);

    const burgerCard = page
      .getByTestId("sovereign-tpv-product-card")
      .filter({ hasText: "E2E Burger" })
      .first();
    await expect(burgerCard).toBeVisible({ timeout: 15_000 });
    await burgerCard.getByTitle("Adicionar ao pedido").click();
    await page.waitForTimeout(400);

    const drinkCard = page
      .getByTestId("sovereign-tpv-product-card")
      .filter({ hasText: "E2E Drink" })
      .first();
    await expect(drinkCard).toBeVisible({ timeout: 5_000 });
    await drinkCard.getByTitle("Adicionar ao pedido").click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-tpv-send-kitchen").click();
    await page.waitForTimeout(2_000);

    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");

    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.first(),
      "P5 misto: pedido com E2E Burger deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("kds-tab-bar").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.first(),
      "P5 misto: mesmo pedido (com E2E Drink) deve aparecer na aba Bar",
    ).toBeVisible({ timeout: 5_000 });
  });

  test("P5 Pedido misto Web → KDS: pedido misto na página pública aparece nas abas Cozinha e Bar", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const slug = creds?.slug ?? "sovereign-burger-hub";
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json com slug. Seed: E2E Burger + E2E Drink.",
    );

    await page.goto(`/public/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    await page.getByTestId("sovereign-web-add-product-E2E-Burger").click();
    await page.waitForTimeout(400);
    await page.getByTestId("sovereign-web-add-product-E2E-Drink").click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-web-cart-toggle").click();
    await page.waitForTimeout(500);
    await page.getByTestId("sovereign-web-submit-order").click();
    await page.waitForTimeout(3_000);

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");
    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.filter({ hasText: "WEB" }).first(),
      "P5 misto Web: pedido com Burger deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("kds-tab-bar").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.filter({ hasText: "WEB" }).first(),
      "P5 misto Web: mesmo pedido (com Drink) deve aparecer na aba Bar",
    ).toBeVisible({ timeout: 5_000 });
  });

  test("P5 Pedido misto QR Mesa → KDS: pedido misto na mesa aparece nas abas Cozinha e Bar", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const slug = creds?.slug ?? "sovereign-burger-hub";
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId || !creds?.email || !creds?.password,
      "Requer e2e-creds.json com slug. Seed: mesa 1, E2E Burger + E2E Drink.",
    );

    await page.goto(`/public/${slug}/mesa/1`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    await page.getByTestId("sovereign-qr-add-product-E2E-Burger").click();
    await page.waitForTimeout(400);
    await page.getByTestId("sovereign-qr-add-product-E2E-Drink").click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-qr-submit-order").click();
    await page.waitForURL(/\/public\/[^/]+\/order\/[a-f0-9-]+/i, { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");
    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.filter({ hasText: "QR MESA" }).first(),
      "P5 misto QR Mesa: pedido com Burger deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("kds-tab-bar").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.filter({ hasText: "QR MESA" }).first(),
      "P5 misto QR Mesa: mesmo pedido (com Drink) deve aparecer na aba Bar",
    ).toBeVisible({ timeout: 5_000 });
  });

  test("P5 Pedido misto Garçom → KDS: pedido misto via Comandeiro aparece nas abas Cozinha e Bar", async ({
    cleanPage: page,
  }) => {
    const creds = loadSovereignCreds();
    const tableId = creds?.table_id;
    const expectedId = creds?.restaurant_id ?? process.env.E2E_RESTAURANT_ID;

    test.skip(
      !expectedId ||
        !creds?.email ||
        !creds?.password ||
        !tableId,
      "Requer e2e-creds.json com table_id (mesa 1). Execute seed com SERVICE_KEY.",
    );

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByTestId("sovereign-auth-email").fill(creds!.email!);
    await page.getByTestId("sovereign-auth-password").fill(creds!.password!);
    await page.getByTestId("sovereign-auth-submit").click();
    await page.waitForURL(/\/(admin|app|dashboard|op|bootstrap|onboarding)/, {
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    await page.goto(`/app/waiter/table/${tableId}?mode=trial`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3_000);

    await page.getByTestId("sovereign-waiter-search").fill("E2E");
    await page.waitForTimeout(1_500);

    const burgerCard = page.getByTestId("sovereign-waiter-product-E2E-Burger");
    await expect(burgerCard).toBeVisible({ timeout: 15_000 });
    await burgerCard.click();
    await page.waitForTimeout(400);
    await burgerCard.getByRole("button", { name: "1" }).click();
    await page.waitForTimeout(300);
    await burgerCard.getByTestId("sovereign-waiter-add-confirm").click();
    await page.waitForTimeout(500);

    const drinkCard = page.getByTestId("sovereign-waiter-product-E2E-Drink");
    await expect(drinkCard).toBeVisible({ timeout: 5_000 });
    await drinkCard.click();
    await page.waitForTimeout(400);
    await drinkCard.getByRole("button", { name: "1" }).click();
    await page.waitForTimeout(300);
    await drinkCard.getByTestId("sovereign-waiter-add-confirm").click();
    await page.waitForTimeout(500);

    await page.getByTestId("sovereign-waiter-send-order").click();
    await page.waitForTimeout(2_500);

    await page.goto("/op/kds", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3_000);

    const orderCards = page.getByTestId("kds-order-card");
    await page.getByTestId("kds-tab-cozinha").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.first(),
      "P5 misto Garçom: pedido com Burger deve aparecer na aba Cozinha",
    ).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("kds-tab-bar").click();
    await page.waitForTimeout(800);
    await expect(
      orderCards.first(),
      "P5 misto Garçom: mesmo pedido (com Drink) deve aparecer na aba Bar",
    ).toBeVisible({ timeout: 5_000 });
  });
});
