/**
 * COMPREHENSIVE UI CLICK AUDIT
 *
 * Systematic testing of user interaction surfaces across current operational routes.
 */

import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

interface AuditEntry {
  screen: string;
  component: string;
  action: "click" | "input" | "submit" | "navigate";
  input?: string;
  expected: string;
  actual: string;
  severity: "P0" | "P1" | "P2" | "OK";
  notes?: string;
}

const auditResults: AuditEntry[] = [];

function addResult(entry: AuditEntry) {
  auditResults.push(entry);
  console.log(
    `[AUDIT] ${entry.screen} > ${entry.component} [${entry.action}]: ${
      entry.severity
    }${entry.notes ? ` (${entry.notes})` : ""}`,
  );
}

async function safeTitle(page: any): Promise<string | null> {
  await page
    .getByText("Carregando ChefIApp…")
    .waitFor({ state: "hidden", timeout: 8000 })
    .catch(() => {});

  return page
    .locator("h1")
    .first()
    .textContent({ timeout: 2500 })
    .catch(() => null);
}

test.describe("Comprehensive UI Click Audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "demo-restaurant");
      localStorage.setItem("chefiapp_slug", "demo-tpv");
      localStorage.setItem("chefiapp_api_base", "http://127.0.0.1:4173");
    });

    await page.route("**/internal/wizard/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: {
            status: "published",
            slug: "demo-tpv",
            web_level: "BASIC",
          },
          identity_complete: true,
          menu_complete: true,
          payments_complete: true,
          design_complete: true,
          can_publish: true,
          gates: { ok: true, tier: "pro", addons: [] },
        }),
      });
    });

    await page.route("**/api/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "UP" }),
      });
    });
  });

  test.afterEach(async ({ page }) => {
    await page.unroute("**/internal/wizard/**");
    await page.unroute("**/api/health");
  });

  test("ActivationCenter (/app/activation) - core checklist", async ({
    page,
  }) => {
    await page.goto("/app/activation");
    await page.waitForLoadState("networkidle");

    const title = await safeTitle(page);
    addResult({
      screen: "ActivationCenter",
      component: "PageLoad",
      action: "navigate",
      expected: "Page loads with visible title",
      actual: title ? "Title visible" : "Title missing",
      severity: title ? "OK" : "P0",
    });

    const linksVisible = (
      await Promise.all([
        page
          .locator('a[href="/app/setup/menu"]')
          .isVisible()
          .catch(() => false),
        page
          .locator('a[href="/app/setup/mesas"]')
          .isVisible()
          .catch(() => false),
        page
          .locator('a[href="/admin/printers"]')
          .isVisible()
          .catch(() => false),
        page
          .locator('a[href="/app/setup/equipe"]')
          .isVisible()
          .catch(() => false),
        page
          .locator('a[href="/app/billing"]')
          .isVisible()
          .catch(() => false),
      ])
    ).every(Boolean);

    addResult({
      screen: "ActivationCenter",
      component: "ChecklistLinks",
      action: "navigate",
      expected: "Checklist links visible",
      actual: linksVisible ? "Links visible" : "Missing links",
      severity: linksVisible ? "OK" : "P1",
    });

    expect(page.url()).toContain("/app/activation");
  });

  test("PublishPage (/app/publish) - surface", async ({ page }) => {
    await page.goto("/app/publish");
    await page.waitForLoadState("networkidle");

    const title = await safeTitle(page);
    addResult({
      screen: "PublishPage",
      component: "PageLoad",
      action: "navigate",
      expected: "Page loads with visible title",
      actual: title ? "Title visible" : "Title missing",
      severity: title ? "OK" : "P0",
    });

    const publishVisible = await page
      .locator('button:has-text("Publicar")')
      .first()
      .isVisible()
      .catch(() => false);

    addResult({
      screen: "PublishPage",
      component: "PublishButton",
      action: "navigate",
      expected: "Publish action visible",
      actual: publishVisible ? "Button visible" : "Button missing",
      severity: publishVisible ? "OK" : "P1",
    });

    expect(page.url()).toContain("/app/publish");
  });

  test("PaymentsPage (/admin/config/integrations/payments) - surface", async ({
    page,
  }) => {
    await page.goto("/admin/config/integrations/payments");
    await page.waitForLoadState("networkidle");

    const title = await safeTitle(page);
    addResult({
      screen: "PaymentsPage",
      component: "PageLoad",
      action: "navigate",
      expected: "Page loads with visible title",
      actual: title ? "Title visible" : "Title missing",
      severity: title ? "OK" : "P0",
    });

    const stripeVisible = await page
      .locator('h2:has-text("Stripe")')
      .isVisible()
      .catch(() => false);

    addResult({
      screen: "PaymentsPage",
      component: "StripeCard",
      action: "navigate",
      expected: "Stripe integration card visible",
      actual: stripeVisible ? "Card visible" : "Card missing",
      severity: stripeVisible ? "OK" : "P1",
    });

    expect(page.url()).toContain("/admin/config/integrations/payments");
  });

  test("TPV Ready (/app/tpv-ready) - readiness state", async ({ page }) => {
    await page.goto("/app/tpv-ready");
    await page.waitForLoadState("networkidle");

    const readyHeading = await page
      .locator("text=/O teu TPV está pronto|Online e pronto/i")
      .isVisible()
      .catch(() => false);

    addResult({
      screen: "TPVReady",
      component: "PageLoad",
      action: "navigate",
      expected: "Ready heading visible",
      actual: readyHeading ? "Ready visible" : "Ready missing",
      severity: readyHeading ? "OK" : "P0",
    });

    const openTpvVisible = await page
      .locator("button, a")
      .filter({ hasText: /Abrir TPV|Aguardar core/i })
      .first()
      .isVisible()
      .catch(() => false);

    addResult({
      screen: "TPVReady",
      component: "OpenTPVAction",
      action: "navigate",
      expected: "Action to proceed to TPV is visible",
      actual: openTpvVisible ? "Action visible" : "Action missing",
      severity: openTpvVisible ? "OK" : "P1",
    });

    expect(page.url()).toContain("/app/tpv-ready");
  });

  test("TPV Trial (/op/tpv?mode=trial) - header", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial");
    await page.waitForLoadState("networkidle");

    const badgeVisible = await page
      .locator("text=/Demo Guide Active/i")
      .isVisible()
      .catch(() => false);

    addResult({
      screen: "TPVTrial",
      component: "TrialBadge",
      action: "navigate",
      expected: "Demo guide badge visible",
      actual: badgeVisible ? "Badge visible" : "Badge missing",
      severity: badgeVisible ? "OK" : "P1",
    });

    expect(page.url()).toContain("/op/tpv");
  });
});

test.afterAll(async () => {
  console.log("\n" + "=".repeat(60));
  console.log("COMPREHENSIVE UI CLICK AUDIT RESULTS");
  console.log("=".repeat(60) + "\n");

  const stats = {
    total: auditResults.length,
    P0: auditResults.filter((r) => r.severity === "P0").length,
    P1: auditResults.filter((r) => r.severity === "P1").length,
    P2: auditResults.filter((r) => r.severity === "P2").length,
    OK: auditResults.filter((r) => r.severity === "OK").length,
  };

  console.log("SUMMARY:");
  console.log(`  Total interactions tested: ${stats.total}`);
  console.log(`  P0 (Critical):    ${stats.P0}`);
  console.log(`  P1 (High):        ${stats.P1}`);
  console.log(`  P2 (Medium):      ${stats.P2}`);
  console.log(`  OK:               ${stats.OK}`);
  console.log("");

  const byScreen: Record<string, AuditEntry[]> = {};
  auditResults.forEach((r) => {
    if (!byScreen[r.screen]) byScreen[r.screen] = [];
    byScreen[r.screen].push(r);
  });

  const report = {
    timestamp: new Date().toISOString(),
    summary: stats,
    byScreen: Object.entries(byScreen).map(([screen, entries]) => ({
      screen,
      total: entries.length,
      OK: entries.filter((e) => e.severity === "OK").length,
      issues: entries.filter((e) => e.severity !== "OK").length,
    })),
    results: auditResults,
  };

  const outputPath = path.resolve(process.cwd(), "audit-ui-comprehensive.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Full report written to: ${outputPath}`);
  console.log("=".repeat(60) + "\n");
});
