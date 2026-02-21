/**
 * 🔸 Contract — Navigation Guards (FlowGate)
 *
 * Layer: CONTRACT
 * Purpose: Verify FlowGate redirects based on RestaurantLifecycleState.
 *
 * CONTRACT: NAV-GUARD-01 — FlowGate canonical redirects
 *   1. /trial → /op/tpv?mode=trial
 *   2. /login → /auth/login, /register → /auth/phone, /signup → /auth/phone
 * CONTRACT: LEGACY-ROUTE-01 — Backward-compatible route aliases
 *   /tpv → /op/tpv, /kds → /op/kds, /kds-minimal → /op/kds,
 *   /tpv-minimal → /op/tpv, /op/cash → /op/tpv, /op/pos → /op/tpv
 *
 * @tag CONTRATO-NAV-GUARD-01 CONTRATO-LEGACY-ROUTE-01
 */
// @ts-nocheck


import { expect, test, waitForApp } from "../fixtures/base";

test.describe("🔸 Contract — Navigation Guards", () => {
  test("/trial redirects to /op/tpv with trial mode", async ({ page }) => {
    // Uses storageState (pilot) — trial route needs operational access
    await page.goto("/trial", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/tpv/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/tpv");
    expect(page.url()).toContain("mode=trial");
  });

  test("/login redirects to /auth/login", async ({ cleanPage: page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/auth/login");
  });

  test("/register redirects to /auth/phone", async ({ cleanPage: page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/auth\/phone/, { timeout: 10_000 });
    expect(page.url()).toContain("/auth/phone");
  });

  test("/signup redirects to /auth/phone", async ({ cleanPage: page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/auth\/phone/, { timeout: 10_000 });
    expect(page.url()).toContain("/auth/phone");
  });
});

test.describe("🔸 Contract — Legacy Route Aliases", () => {
  // Legacy operational aliases need pilot state — FlowGate redirects VISITOR from /op/*
  test("/tpv → /op/tpv", async ({ page }) => {
    await page.goto("/tpv", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/tpv/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/tpv");
  });

  test("/kds → /op/kds", async ({ page }) => {
    await page.goto("/kds", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/kds/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/kds");
  });

  test("/kds-minimal → /op/kds", async ({ page }) => {
    await page.goto("/kds-minimal", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/kds/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/kds");
  });

  test("/tpv-minimal → /op/tpv", async ({ page }) => {
    await page.goto("/tpv-minimal", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/tpv/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/tpv");
  });

  test("/op/cash → /op/tpv", async ({ page }) => {
    await page.goto("/op/cash", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/tpv/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/tpv");
  });

  test("/op/pos → /op/tpv", async ({ page }) => {
    await page.goto("/op/pos", { waitUntil: "domcontentloaded" });
    await waitForApp(page);

    await page.waitForURL(/\/op\/tpv/, { timeout: 15_000 });
    expect(page.url()).toContain("/op/tpv");
  });
});
