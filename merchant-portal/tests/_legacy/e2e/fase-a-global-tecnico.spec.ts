/**
 * FASE A — Teste Global Técnico (LOCAL)
 *
 * Objetivo: garantir que nenhuma tela quebra, nenhum loop, nenhuma rota morta.
 * Cada rota deve carregar (200 ou redirect para /auth); sem crash, sem tela branca.
 *
 * Referência: docs/implementation/FASE_5_HARDENING_SMOKE_CHECK.md e plano FASE A.
 */

import { expect, test } from "@playwright/test";

const ROTAS_PUBLICAS = [
  { path: "/", desc: "Landing" },
  { path: "/auth", desc: "Auth" },
  { path: "/public/trial-restaurant", desc: "Presença digital" },
  { path: "/public/trial-restaurant/mesa/1", desc: "QR mesa" },
];

const ROTAS_PROTEGIDAS = [
  "/dashboard",
  "/app/dashboard",
  "/config",
  "/config/identity",
  "/op/tpv",
  "/op/kds",
  "/op/staff",
  "/people",
  "/tasks",
  "/alerts",
  "/financial",
  "/app/reports/daily-closing",
  "/app/reports/sales-by-period",
  "/app/billing",
];

test.describe("FASE A — Teste Global Técnico LOCAL", () => {
  test("Rotas públicas carregam sem crash", async ({ page }) => {
    for (const { path, desc } of ROTAS_PUBLICAS) {
      const res = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      const ok =
        res &&
        res.status() < 500 &&
        (url.includes(path.split("?")[0]) || url.includes("/auth"));
      expect(ok, `${desc} (${path}): status=${res?.status()}, url=${url}`).toBe(
        true,
      );
    }
  });

  test("Rotas protegidas redirecionam para auth ou carregam (sem crash)", async ({
    page,
  }) => {
    for (const path of ROTAS_PROTEGIDAS) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      const ok =
        url.includes("/auth") ||
        url.includes("/login") ||
        url.includes(path) ||
        url.includes("/dashboard");
      expect(
        ok,
        `Rota ${path} deve redirecionar para auth ou carregar; URL atual: ${url}`,
      ).toBe(true);
    }
  });
});
