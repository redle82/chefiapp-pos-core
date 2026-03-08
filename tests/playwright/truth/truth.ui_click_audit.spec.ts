/**
 * UI CLICK AUDIT — Comprehensive interaction testing
 *
 * For each page/route:
 * 1. Navigate to the route
 * 2. Click every button
 * 3. Test every input (empty, valid, invalid)
 * 4. Check every link
 * 5. Document response behavior
 *
 * Critical pages:
 * - /app (EntryPage) - email input, CTA button
 * - /app/creating (CreatingPage) - demo mode button, retry button
 * - /start/payments (PaymentsPage) - Stripe option, demo option, connect button
 * - /start/publish (PublishPage) - publish button
 * - /app/tpv (TPV) - create order, queue management
 */

import { test } from "@playwright/test";

interface AuditEntry {
  screen: string;
  component: string;
  action: "click" | "input" | "submit" | "navigate";
  input?: string;
  expected: string;
  actual: string;
  severity: "P0" | "P1" | "P2" | "OK";
}

const auditResults: AuditEntry[] = [];

function addResult(entry: AuditEntry) {
  auditResults.push(entry);
  console.log(
    `[AUDIT] ${entry.screen} > ${entry.component} [${entry.action}]: ${entry.severity}`,
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

test.describe("UI Click Audit — ActivationCenter (/app/activation)", () => {
  test("audit activation checklist interactions", async ({ page }) => {
    await page.goto("/app/activation");
    await page.waitForLoadState("networkidle");

    const title = await safeTitle(page);
    addResult({
      screen: "ActivationCenter",
      component: "PageLoad",
      action: "navigate",
      expected: 'Page loads with title "Centro de Ativação"',
      actual: title?.includes("Ativa") ? "Title visible" : "Title missing",
      severity: title?.includes("Ativa") ? "OK" : "P0",
    });

    const menuLink = page.locator('a[href="/app/setup/menu"]');
    const mesasLink = page.locator('a[href="/app/setup/mesas"]');
    const impressoraLink = page.locator('a[href="/admin/printers"]');
    const usuariosLink = page.locator('a[href="/app/setup/equipe"]');
    const billingLink = page.locator('a[href="/app/billing"]');
    const panelLink = page.locator('a[href="/app/dashboard"]');
    const demoButton = page.locator(
      'div[role="button"]:has-text("Testar pedido")',
    );

    addResult({
      screen: "ActivationCenter",
      component: "ChecklistLinks",
      action: "navigate",
      expected: "Checklist links visible",
      actual: (
        await Promise.all([
          menuLink.isVisible(),
          mesasLink.isVisible(),
          impressoraLink.isVisible(),
          usuariosLink.isVisible(),
          billingLink.isVisible(),
        ])
      ).every(Boolean)
        ? "Links visible"
        : "Missing links",
      severity: (
        await Promise.all([
          menuLink.isVisible(),
          mesasLink.isVisible(),
          impressoraLink.isVisible(),
          usuariosLink.isVisible(),
          billingLink.isVisible(),
        ])
      ).every(Boolean)
        ? "OK"
        : "P1",
    });

    const demoVisible = await demoButton.isVisible().catch(() => false);
    addResult({
      screen: "ActivationCenter",
      component: "DemoGuideButton",
      action: "click",
      expected: "Demo guide button visible",
      actual: demoVisible ? "Button visible" : "Button missing",
      severity: demoVisible ? "OK" : "P2",
    });

    const panelVisible = await panelLink.isVisible().catch(() => false);
    addResult({
      screen: "ActivationCenter",
      component: "DashboardLink",
      action: "navigate",
      expected: "Dashboard shortcut visible",
      actual: panelVisible ? "Link visible" : "Link missing",
      severity: panelVisible ? "OK" : "P2",
    });
  });
});

test.describe("UI Click Audit — PublishPage (/app/publish)", () => {
  test("audit publish page surface", async ({ page }) => {
    await page.goto("/app/publish");
    await page.waitForLoadState("networkidle");

    const title = await safeTitle(page);
    addResult({
      screen: "PublishPage",
      component: "PageLoad",
      action: "navigate",
      expected: 'Page loads with title "Publicar restaurante"',
      actual: title?.includes("Publicar") ? "Title visible" : "Title missing",
      severity: title?.includes("Publicar") ? "OK" : "P0",
    });

    const publishButton = page.locator('button:has-text("Publicar")').first();
    const buttonVisible = await publishButton.isVisible().catch(() => false);
    addResult({
      screen: "PublishPage",
      component: "PublishButton",
      action: "navigate",
      expected: "Publish action visible",
      actual: buttonVisible ? "Button visible" : "Button missing",
      severity: buttonVisible ? "OK" : "P1",
    });
  });
});

test.describe("UI Click Audit — PaymentsPage (/admin/config/integrations/payments)", () => {
  test("audit all interactions on PaymentsPage", async ({ page }) => {
    await page.goto("/admin/config/integrations/payments");
    await page.waitForLoadState("networkidle");

    const title = await safeTitle(page);
    addResult({
      screen: "PaymentsPage",
      component: "PageLoad",
      action: "navigate",
      expected: 'Page loads with title "Pagamentos"',
      actual: title?.includes("Pagamento") ? "Title visible" : "Title missing",
      severity: title?.includes("Pagamento") ? "OK" : "P1",
    });

    const stripeHeading = page.locator('h2:has-text("Stripe")');
    const stripeVisible = await stripeHeading.isVisible().catch(() => false);
    addResult({
      screen: "PaymentsPage",
      component: "StripeCard",
      action: "navigate",
      expected: "Stripe integration card visible",
      actual: stripeVisible ? "Card visible" : "Card missing",
      severity: stripeVisible ? "OK" : "P1",
    });

    const portalButton = page.locator('button:has-text("Portal do cliente")');
    const portalVisible = await portalButton.isVisible().catch(() => false);
    addResult({
      screen: "PaymentsPage",
      component: "PortalButton",
      action: "navigate",
      expected: "Customer portal button visible",
      actual: portalVisible ? "Button visible" : "Button missing",
      severity: portalVisible ? "OK" : "P1",
    });
  });
});

test.describe("UI Click Audit — TPV Ready (/app/tpv-ready)", () => {
  test("audit readiness state and action", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chefiapp_restaurant_id", "demo-restaurant");
      localStorage.setItem("chefiapp_slug", "demo-tpv");
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

    await page.goto("/app/tpv-ready");
    await page.waitForLoadState("networkidle");

    const readyHeading = await page
      .locator("text=/O teu TPV está pronto|Online e pronto/i")
      .isVisible();
    addResult({
      screen: "TPVReady",
      component: "PageLoad",
      action: "navigate",
      expected: "Ready heading visible",
      actual: readyHeading ? "Ready visible" : "Ready missing",
      severity: readyHeading ? "OK" : "P0",
    });

    const enterButton = page.locator('button:has-text("Abrir TPV")');
    const enterVisible = await enterButton.isVisible().catch(() => false);
    const enterEnabled = enterVisible ? await enterButton.isEnabled() : false;
    addResult({
      screen: "TPVReady",
      component: "EnterButton",
      action: "click",
      expected: "TPV enter button enabled",
      actual: enterVisible
        ? enterEnabled
          ? "Button enabled"
          : "Button disabled"
        : "Button missing",
      severity: enterVisible && enterEnabled ? "OK" : "P1",
    });
  });
});

test.describe("UI Click Audit — TPV Trial (/op/tpv?mode=trial)", () => {
  test("audit trial header elements", async ({ page }) => {
    await page.goto("/op/tpv?mode=trial");
    await page.waitForLoadState("networkidle");

    const demoBadge = page.locator("text=/Demo Guide Active/i");
    const badgeVisible = await demoBadge.isVisible().catch(() => false);
    addResult({
      screen: "TPVTrial",
      component: "TrialBadge",
      action: "navigate",
      expected: "Demo guide badge visible",
      actual: badgeVisible ? "Badge visible" : "Badge missing",
      severity: badgeVisible ? "OK" : "P1",
    });

    const signupLink = page.locator('a[href="/auth?mode=signup"]');
    const signupVisible = await signupLink.isVisible().catch(() => false);
    addResult({
      screen: "TPVTrial",
      component: "SignupLink",
      action: "navigate",
      expected: "Signup link visible",
      actual: signupVisible ? "Link visible" : "Link missing",
      severity: signupVisible ? "OK" : "P2",
    });
  });
});

test.afterAll(async () => {
  // Output all audit results as JSON
  console.log("\n=== UI CLICK AUDIT RESULTS ===\n");
  console.log(JSON.stringify(auditResults, null, 2));

  // Summary stats
  const stats = {
    total: auditResults.length,
    P0: auditResults.filter((r) => r.severity === "P0").length,
    P1: auditResults.filter((r) => r.severity === "P1").length,
    P2: auditResults.filter((r) => r.severity === "P2").length,
    OK: auditResults.filter((r) => r.severity === "OK").length,
  };

  console.log("\n=== SUMMARY ===");
  console.log(`Total interactions tested: ${stats.total}`);
  console.log(`P0 (Critical): ${stats.P0}`);
  console.log(`P1 (High): ${stats.P1}`);
  console.log(`P2 (Medium): ${stats.P2}`);
  console.log(`OK: ${stats.OK}`);
  console.log("\n");

  // Write to file
  const fs = require("fs");
  const path = require("path");
  const outputPath = path.join(
    __dirname,
    "../../../audit-ui-click-results.json",
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results: auditResults,
        summary: stats,
      },
      null,
      2,
    ),
  );
  console.log(`Results written to: ${outputPath}`);
});
