/**
 * CoreFlow Tests - Lógica de Decisão de Fluxo
 *
 * Testa a função resolveNextRoute que implementa a REGRA DE OURO das 7 Telas Douradas.
 */

import { beforeAll, describe, expect, it } from "@jest/globals";
import type { UserState } from "../../../merchant-portal/src/core/flow/CoreFlow";
import { resolveNextRoute } from "../../../merchant-portal/src/core/flow/CoreFlow";

// Mock window before importing CoreFlow
beforeAll(() => {
  if (typeof (global as any).window === "undefined") {
    (global as any).window = {
      navigator: {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      innerWidth: 1920,
      innerHeight: 1080,
    };
  }
});

describe("CoreFlow - resolveNextRoute", () => {
  describe("Barreira de Autenticação", () => {
    it("deve redirecionar para /auth quando não autenticado e acessando rota protegida", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        onboardingStatus: "not_started",
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/auth");
        expect(decision.reason).toContain("Auth required");
      }
    });

    it("deve permitir acesso a /public/* quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        onboardingStatus: "not_started",
        currentPath: "/public/menu/abc123",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve permitir acesso a / quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        onboardingStatus: "not_started",
        currentPath: "/",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve permitir acesso a /auth quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        onboardingStatus: "not_started",
        currentPath: "/auth",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });

  describe("Barreira de Organização", () => {
    it("deve redirecionar para bootstrap quando sem organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: false,
        onboardingStatus: "not_started",
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/bootstrap");
      }
    });

    it("deve permitir acesso a /onboarding/first-product quando sem organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: false,
        onboardingStatus: "not_started",
        currentPath: "/onboarding/first-product",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });

  describe("Regra das 7 Telas Douradas", () => {
    const onboardingStatuses = [
      "identity",
      "authority",
      "topology",
      "flow",
      "cash",
      "team",
    ] as const;

    onboardingStatuses.forEach((status) => {
      it(`deve permitir acesso a /onboarding/* quando status é ${status}`, () => {
        const state: UserState = {
          isAuthenticated: true,
          hasOrganization: true,
          onboardingStatus: status,
          currentPath: `/onboarding/${status}`,
        };

        const decision = resolveNextRoute(state);
        expect(decision.type).toBe("ALLOW");
      });

      it(`permite acesso a /app/dashboard durante ${status} (gestão sempre acessível)`, () => {
        const state: UserState = {
          isAuthenticated: true,
          hasOrganization: true,
          onboardingStatus: status,
          currentPath: "/app/dashboard",
        };

        const decision = resolveNextRoute(state);
        expect(decision.type).toBe("ALLOW");
      });
    });
  });

  describe("Estado Soberano (Completed)", () => {
    it("deve redirecionar de /auth para /app/dashboard quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: "completed",
        currentPath: "/auth",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/app/dashboard");
      }
    });

    it("deve redirecionar de / para /app/dashboard quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: "completed",
        currentPath: "/",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/app/dashboard");
      }
    });

    it("deve redirecionar de /app para /app/dashboard quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: "completed",
        currentPath: "/app",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/app/dashboard");
      }
    });

    it("permite acesso a rotas de onboarding quando completo (gate não bloqueia)", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: "completed",
        currentPath: "/onboarding/identity",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve permitir acesso a /app/* quando completo", () => {
      const routes = ["/app/dashboard", "/app/tpv", "/app/menu", "/app/orders"];

      routes.forEach((route) => {
        const state: UserState = {
          isAuthenticated: true,
          hasOrganization: true,
          onboardingStatus: "completed",
          currentPath: route,
        };

        const decision = resolveNextRoute(state);
        expect(decision.type).toBe("ALLOW");
      });
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com estado inconsistente (hasOrganization=true mas onboardingStatus=not_started)", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: "not_started",
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("permite acesso a /app/dashboard quando status é not_started com organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: "not_started",
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });
});
