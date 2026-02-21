/**
 * 🔹 Smoke Tests — Route Health
 *
 * Layer: SMOKE (runs first, fastest)
 * Purpose: Verify every critical route responds without 5xx errors.
 *          Does NOT assert content — only that the server handles the route.
 *
 * CONTRACT: SMOKE-ROUTES — HTTP status < 500, page loads within timeout.
 *
 * These tests run WITHOUT authentication.
 * Routes behind auth guards will redirect — that's expected and valid (status < 500).
 *
 * @tag SMOKE-ROUTES
 */
// @ts-nocheck


import { expect, test } from "../fixtures/base";

test.describe("🔹 Smoke — Public Routes", () => {
  const PUBLIC_ROUTES = [
    { path: "/", label: "Landing Page" },
    { path: "/pricing", label: "Pricing" },
    { path: "/features", label: "Features" },
    { path: "/changelog", label: "Changelog" },
    { path: "/security", label: "Security" },
    { path: "/about", label: "About" },
    { path: "/status", label: "Status" },
    { path: "/legal/terms", label: "Terms" },
    { path: "/legal/privacy", label: "Privacy" },
  ];

  for (const { path, label } of PUBLIC_ROUTES) {
    test(`${label} (${path}) → no 5xx`, async ({ page }) => {
      const res = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      expect(res?.status() ?? 999).toBeLessThan(500);
    });
  }
});

test.describe("🔹 Smoke — Auth Routes", () => {
  const AUTH_ROUTES = [
    { path: "/auth", label: "Auth root (→ /auth/phone)" },
    { path: "/auth/phone", label: "Phone Login" },
    { path: "/auth/login", label: "Email Login (legacy)" },
    { path: "/login", label: "/login redirect" },
  ];

  for (const { path, label } of AUTH_ROUTES) {
    test(`${label} (${path}) → no 5xx`, async ({ page }) => {
      const res = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      expect(res?.status() ?? 999).toBeLessThan(500);
    });
  }
});

test.describe("🔹 Smoke — Operational Routes (unauth → redirect)", () => {
  const OP_ROUTES = [
    { path: "/op/tpv", label: "TPV" },
    { path: "/op/kds", label: "KDS" },
    { path: "/app/staff/home", label: "AppStaff Home" },
    { path: "/admin", label: "Admin" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/app", label: "/app" },
  ];

  for (const { path, label } of OP_ROUTES) {
    test(`${label} (${path}) → no 5xx (may redirect)`, async ({ page }) => {
      const res = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      // Operational routes behind auth may redirect — that's OK.
      // We just verify no server crash (5xx).
      expect(res?.status() ?? 999).toBeLessThan(500);
    });
  }
});
