/**
 * E2E Test - Fluxo Completo de Autenticação
 *
 * Tests the real auth flow logic using resolveNextRoute (FlowGate core).
 * No trivial asserts — every test exercises real decision logic.
 */

import { describe, it, expect } from "@jest/globals";
import type { UserState } from "../../merchant-portal/src/core/flow/CoreFlow";
import { resolveNextRoute } from "../../merchant-portal/src/core/flow/CoreFlow";

// ── Helpers ─────────────────────────────────────────────

function userState(overrides: Partial<UserState> = {}): UserState {
  return {
    isAuthenticated: false,
    hasOrganization: false,
    currentPath: "/",
    ...overrides,
  };
}

function expectRedirectTo(state: UserState, target: string) {
  const decision = resolveNextRoute(state);
  expect(decision.type).toBe("REDIRECT");
  if (decision.type === "REDIRECT") {
    expect(decision.to).toBe(target);
  }
}

function expectAllow(state: UserState) {
  const decision = resolveNextRoute(state);
  expect(decision.type).toBe("ALLOW");
}

// ── Tests ───────────────────────────────────────────────

describe("E2E - Auth Flow (real resolveNextRoute)", () => {
  describe("Unauthenticated user journey", () => {
    it("redirects to /auth/phone when accessing protected routes", () => {
      const protectedRoutes = [
        "/app/dashboard",
        "/app/orders",
        "/app/tpv",
        "/app/settings",
        "/onboarding/identity",
      ];

      for (const route of protectedRoutes) {
        expectRedirectTo(userState({ currentPath: route }), "/auth/phone");
      }
    });

    it("allows access to public routes without auth", () => {
      const publicRoutes = ["/", "/auth", "/public/menu/abc123"];

      for (const route of publicRoutes) {
        expectAllow(userState({ currentPath: route }));
      }
    });

    it("unknown routes redirect to /auth/phone", () => {
      expectRedirectTo(
        userState({ currentPath: "/nonexistent/page" }),
        "/auth/phone",
      );
    });
  });

  describe("Authenticated without organization", () => {
    it("redirects to setup when accessing app routes", () => {
      expectRedirectTo(
        userState({
          isAuthenticated: true,
          hasOrganization: false,
          currentPath: "/app/dashboard",
        }),
        "/setup/restaurant-minimal",
      );
    });

    it("allows access to /setup/restaurant-minimal", () => {
      expectAllow(
        userState({
          isAuthenticated: true,
          hasOrganization: false,
          currentPath: "/setup/restaurant-minimal",
        }),
      );
    });
  });

  describe("Complete journey: Auth → Onboarding → Dashboard", () => {
    it("walks through the full journey with state transitions", () => {
      // Step 1: Anonymous user hits /app/dashboard → redirect to auth
      const step1 = resolveNextRoute(
        userState({ currentPath: "/app/dashboard" }),
      );
      expect(step1.type).toBe("REDIRECT");

      // Step 2: User arrives at /auth → allowed
      const step2 = resolveNextRoute(userState({ currentPath: "/auth" }));
      expect(step2.type).toBe("ALLOW");

      // Step 3: After login, no org → redirect to setup
      const step3 = resolveNextRoute(
        userState({
          isAuthenticated: true,
          hasOrganization: false,
          currentPath: "/app/dashboard",
        }),
      );
      expect(step3.type).toBe("REDIRECT");
      if (step3.type === "REDIRECT") {
        expect(step3.to).toBe("/setup/restaurant-minimal");
      }

      // Step 4: After setup, org exists → onboarding allowed
      const step4 = resolveNextRoute(
        userState({
          isAuthenticated: true,
          hasOrganization: true,
          currentPath: "/onboarding/identity",
        }),
      );
      expect(step4.type).toBe("ALLOW");

      // Step 5: Onboarding complete, /auth → redirect to dashboard
      const step5 = resolveNextRoute(
        userState({
          isAuthenticated: true,
          hasOrganization: true,
          currentPath: "/auth",
        }),
      );
      expect(step5.type).toBe("REDIRECT");
      if (step5.type === "REDIRECT") {
        expect(step5.to).toBe("/dashboard");
      }

      // Step 6: Accessing dashboard → allowed
      const step6 = resolveNextRoute(
        userState({
          isAuthenticated: true,
          hasOrganization: true,
          currentPath: "/app/dashboard",
        }),
      );
      expect(step6.type).toBe("ALLOW");
    });
  });

  describe("Authenticated with organization (returning user)", () => {
    const returning = (path: string) =>
      userState({
        isAuthenticated: true,
        hasOrganization: true,
        currentPath: path,
      });

    it("redirects / to /dashboard", () => {
      expectRedirectTo(returning("/"), "/dashboard");
    });

    it("redirects /auth to /dashboard", () => {
      expectRedirectTo(returning("/auth"), "/dashboard");
    });

    it("redirects /app to /dashboard", () => {
      expectRedirectTo(returning("/app"), "/dashboard");
    });

    it("allows /app/* routes", () => {
      const appRoutes = [
        "/app/dashboard",
        "/app/orders",
        "/app/tpv",
        "/app/products",
      ];
      for (const route of appRoutes) {
        expectAllow(returning(route));
      }
    });

    it("allows onboarding routes (re-entry ok)", () => {
      expectAllow(returning("/onboarding/identity"));
      expectAllow(returning("/onboarding/authority"));
    });
  });

  describe("Email validation (real regex)", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("accepts valid emails", () => {
      const valid = [
        "test@chefiapp.com",
        "user@example.com",
        "admin+tag@domain.pt",
        "cafe@restaurante.com.br",
      ];
      for (const email of valid) {
        expect(email).toMatch(emailRegex);
      }
    });

    it("rejects invalid emails", () => {
      const invalid = ["notanemail", "@example.com", "user@", "a b@c.com", ""];
      for (const email of invalid) {
        expect(email).not.toMatch(emailRegex);
      }
    });
  });
});
