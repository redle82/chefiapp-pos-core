import { describe, expect, it } from "vitest";
import { UserState, resolveNextRoute } from "./CoreFlow";

describe("CoreFlow Logic", () => {
  // Default valid state helper
  const baseState: UserState = {
    isAuthenticated: true,
    hasOrganization: true,
    onboardingStatus: "completed",
    currentPath: "/app/dashboard",
  };

  describe("1. Authentication Barrier", () => {
    it("should allow public access to /public/*", () => {
      const decision = resolveNextRoute({
        ...baseState,
        isAuthenticated: false,
        currentPath: "/public/menu/123",
      });
      expect(decision).toEqual({ type: "ALLOW" });
    });

    it("should allow public access to /", () => {
      const decision = resolveNextRoute({
        ...baseState,
        isAuthenticated: false,
        currentPath: "/",
      });
      expect(decision).toEqual({ type: "ALLOW" });
    });

    it("should redirect unauthenticated user to /auth", () => {
      const decision = resolveNextRoute({
        ...baseState,
        isAuthenticated: false,
        currentPath: "/app/dashboard",
      });
      expect(decision).toEqual({
        type: "REDIRECT",
        to: "/auth",
        reason: "Auth required",
      });
    });
  });

  describe("2. Organization Barrier (Bootstrap gate)", () => {
    it("should redirect to /bootstrap when organization is missing (contract: auth → bootstrap)", () => {
      const decision = resolveNextRoute({
        ...baseState,
        hasOrganization: false,
        currentPath: "/app/dashboard",
      });
      expect(decision).toEqual({
        type: "REDIRECT",
        to: "/bootstrap",
        reason: "No org → bootstrap (contract: auth → bootstrap obrigatório)",
      });
    });

    it("should allow /bootstrap and /onboarding/first-product when organization is missing", () => {
      expect(
        resolveNextRoute({
          ...baseState,
          hasOrganization: false,
          currentPath: "/bootstrap",
        })
      ).toEqual({ type: "ALLOW" });
      expect(
        resolveNextRoute({
          ...baseState,
          hasOrganization: false,
          currentPath: "/onboarding/first-product",
        })
      ).toEqual({ type: "ALLOW" });
    });
  });

  describe("3. Authenticated with organization (Sovereign Entry)", () => {
    it("should allow /app/dashboard when hasOrganization", () => {
      const decision = resolveNextRoute({
        ...baseState,
        onboardingStatus: "completed",
        currentPath: "/app/dashboard",
      });
      expect(decision).toEqual({ type: "ALLOW" });
    });

    it("should redirect /auth to dashboard when hasOrganization", () => {
      const decision = resolveNextRoute({
        ...baseState,
        currentPath: "/auth",
      });
      expect(decision).toEqual({
        type: "REDIRECT",
        to: "/app/dashboard",
        reason: "Sovereign Entry to Dashboard",
      });
    });
  });
});
