/**
 * routeGuards — wrappers sobre CoreFlow; travam contrato de navegação.
 */

import { describe, expect, it } from "vitest";
import {
  guardDashboard,
  guardOpsRoutes,
  resolveEntryRoute,
} from "./routeGuards";

describe("routeGuards", () => {
  describe("resolveEntryRoute", () => {
    it("no session → stays on entry path /auth/email (CoreFlow ALLOW)", () => {
      const dest = resolveEntryRoute({ isAuthenticated: false }, {});
      expect(dest).toBe("/auth/email");
    });

    it("authenticated without org → /welcome", () => {
      const dest = resolveEntryRoute(
        { isAuthenticated: true },
        { hasOrganization: false },
      );
      expect(dest).toBe("/welcome");
    });

    it("authenticated with org, not activated → /app/activation", () => {
      const dest = resolveEntryRoute(
        { isAuthenticated: true },
        { hasOrganization: true, activated: false },
      );
      expect(dest).toBe("/app/activation");
    });

    it("authenticated with org, activated → /app/dashboard", () => {
      const dest = resolveEntryRoute(
        { isAuthenticated: true },
        { hasOrganization: true, activated: true },
      );
      expect(dest).toBe("/app/dashboard");
    });
  });

  describe("guardOpsRoutes", () => {
    it("SETUP state → false (redirect to activation)", () => {
      const allowed = guardOpsRoutes({
        isAuthenticated: true,
        hasOrganization: true,
        currentPath: "/",
        systemState: "SETUP",
      });
      expect(allowed).toBe(false);
    });

    it("ACTIVE state → true", () => {
      const allowed = guardOpsRoutes({
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
        currentPath: "/",
        systemState: "ACTIVE",
      });
      expect(allowed).toBe(true);
    });
  });

  describe("guardDashboard", () => {
    it("no org → false", () => {
      const allowed = guardDashboard({
        isAuthenticated: true,
        hasOrganization: false,
        currentPath: "/",
      });
      expect(allowed).toBe(false);
    });

    it("has org and activated → true", () => {
      const allowed = guardDashboard({
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
        currentPath: "/",
      });
      expect(allowed).toBe(true);
    });
  });
});
