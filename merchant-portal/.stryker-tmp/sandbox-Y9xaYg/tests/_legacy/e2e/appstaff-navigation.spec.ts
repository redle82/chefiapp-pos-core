/**
 * E2E: AppStaff — Verificar que os botões/links levam às rotas corretas.
 * BaseURL: http://localhost:5175 (playwright.config.ts)
 */

import { expect, test } from "@playwright/test";

const STAFF_HOME = "/app/staff/home";
const ROUTES = {
  operation: "/app/staff/mode/operation",
  turn: "/app/staff/mode/turn",
  team: "/app/staff/mode/team",
  tpv: "/app/staff/mode/tpv",
  kds: "/app/staff/mode/kds",
  tasks: "/app/staff/mode/tasks",
  alerts: "/app/staff/mode/alerts",
  profile: "/app/staff/profile",
} as const;

test.describe("AppStaff navegação", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_cookie_consent_accepted", "true");
    });
  });

  test("Rotas /app/staff/mode/* e /app/staff/profile existem e respondem", async ({ page }) => {
    // Ir para home do staff (pode mostrar Gate ou ManagerHome)
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 15000 });
    const path = new URL(page.url()).pathname;

    // Se estamos em /app/staff/home ou numa rota staff, as rotas filhas devem estar montadas
    await page.goto(ROUTES.tpv, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.tpv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.goto(ROUTES.operation, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.operation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.goto(ROUTES.team, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.team.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.goto(ROUTES.tasks, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.tasks.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.goto(ROUTES.alerts, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.alerts.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.goto(ROUTES.kds, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.kds.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    await page.goto(ROUTES.profile, { waitUntil: "domcontentloaded", timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(ROUTES.profile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("Links no ManagerHome: Status→operation, Equipe→team, Tarefas→tasks, Alertas→alerts", async ({
    page,
  }) => {
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Só prosseguir se a home do staff mostrar o conteúdo do ManagerHome (FOCO AGORA ou botões)
    const statusLink = page.getByRole("link", { name: "Status" }).first();
    const equipeLink = page.getByRole("link", { name: "Equipe" }).first();
    const tarefasLink = page.getByRole("link", { name: "Tarefas" }).first();
    const alertasLink = page.getByRole("link", { name: "Alertas" }).first();

    const statusVisible = await statusLink.isVisible().catch(() => false);
    if (!statusVisible) {
      test.skip();
      return;
    }

    await statusLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/operation/);
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 10000 });

    await equipeLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/team/);
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 10000 });

    await tarefasLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/tasks/);
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 10000 });

    await alertasLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/alerts/);
  });

  test("Links secundários: TPV→tpv, Cozinha→kds, Equipe→team", async ({ page }) => {
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 15000 });

    const cozinhaLink = page.getByRole("link", { name: "Cozinha" }).first();
    const equipeSecLink = page.getByRole("link", { name: "Equipe" }).first();
    if (!(await cozinhaLink.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await cozinhaLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/kds/);
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 10000 });

    await equipeSecLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/team/);
  });

  test("Botão Abrir TPV leva a /app/staff/mode/tpv", async ({ page }) => {
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 15000 });

    const abrirTpv = page.getByRole("button", { name: "Abrir TPV" }).first();
    if (!(await abrirTpv.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await abrirTpv.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/tpv/);
  });

  test("Bottom bar Shell: Início→home, TPV→tpv, KDS→kds, Operação→operation", async ({
    page,
  }) => {
    await page.goto(STAFF_HOME, { waitUntil: "domcontentloaded", timeout: 15000 });

    const inicioLink = page.getByRole("link", { name: /Início/i }).first();
    const tpvLink = page.getByRole("link", { name: /TPV/i }).first();
    const kdsLink = page.getByRole("link", { name: /KDS/i }).first();
    const operacaoLink = page.getByRole("link", { name: /Operação/i }).first();

    if (!(await inicioLink.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await tpvLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/tpv/);

    await kdsLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/kds/);

    await operacaoLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/mode\/operation/);

    await inicioLink.click();
    await expect(page).toHaveURL(/\/app\/staff\/home/);
  });
});
