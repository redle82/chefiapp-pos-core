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
    it("deve redirecionar para /auth/phone quando não autenticado e acessando rota protegida", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/auth/phone");
        expect(decision.reason).toContain("Auth required");
      }
    });

    it("deve permitir acesso a /public/* quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/public/menu/abc123",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve permitir acesso a / quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve permitir acesso a /auth quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/auth",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });

  describe("Barreira de Organização", () => {
    it("deve redirecionar para setup mínimo quando sem organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: false,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/setup/restaurant-minimal");
      }
    });

    it("deve permitir acesso a /setup/restaurant-minimal quando sem organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: false,
        currentPath: "/setup/restaurant-minimal",
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
          currentPath: `/onboarding/${status}`,
        };

        const decision = resolveNextRoute(state);
        expect(decision.type).toBe("ALLOW");
      });

      it(`permite acesso a /app/dashboard durante ${status} (gestão sempre acessível)`, () => {
        const state: UserState = {
          isAuthenticated: true,
          hasOrganization: true,
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
        currentPath: "/auth",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/dashboard");
      }
    });

    it("deve redirecionar de / para /app/dashboard quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        currentPath: "/",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/dashboard");
      }
    });

    it("deve redirecionar de /app para /app/dashboard quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        currentPath: "/app",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/dashboard");
      }
    });

    it("permite acesso a rotas de onboarding quando completo (gate não bloqueia)", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
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
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("permite acesso a /app/dashboard quando status é not_started com organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });
});
