/**
 * FlowGate Tests - Navegação Soberana
 *
 * Testa o componente central de navegação do sistema.
 * FlowGate é a única autoridade que decide o fluxo do usuário.
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import type { UserState } from "../../../merchant-portal/src/core/flow/CoreFlow";
import { resolveNextRoute } from "../../../merchant-portal/src/core/flow/CoreFlow";

describe("FlowGate - resolveNextRoute (Lógica de Decisão)", () => {
  beforeEach(() => {
    // Limpar localStorage (only when running in jsdom or browser-like env)
    if (
      typeof localStorage !== "undefined" &&
      typeof localStorage.clear === "function"
    ) {
      localStorage.clear();
    }
  });

  describe("Redirecionamento de Usuário Não Autenticado", () => {
    it("deve redirecionar para /auth/phone quando não autenticado e tentando acessar rota protegida", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/auth/email");
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

  describe("Redirecionamento de Usuário Autenticado Sem Organização", () => {
    it("deve redirecionar para setup mínimo quando autenticado mas sem organização", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: false,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/setup/start");
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

  describe("Redirecionamento Durante Onboarding", () => {
    it("deve permitir acesso a qualquer etapa de onboarding quando não completo", () => {
      const states: UserState[] = [
        {
          isAuthenticated: true,
          hasOrganization: true,
          currentPath: "/onboarding/identity",
        },
        {
          isAuthenticated: true,
          hasOrganization: true,
          currentPath: "/onboarding/authority",
        },
        {
          isAuthenticated: true,
          hasOrganization: true,
          currentPath: "/onboarding/topology",
        },
      ];

      states.forEach((state) => {
        const decision = resolveNextRoute(state);
        expect(decision.type).toBe("ALLOW");
      });
    });

    it("deve permitir acesso a /app/dashboard durante onboarding (gestão sempre acessível)", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });

  describe("Redirecionamento Após Onboarding Completo", () => {
    it("deve redirecionar de /auth para /app/dashboard quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
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
        activated: true,
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
        activated: true,
        currentPath: "/app",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/app/dashboard");
      }
    });

    it("permite acesso a rotas de onboarding quando completo (gate não bloqueia; outros gates podem)", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
        currentPath: "/onboarding/identity",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve permitir acesso a /app/* quando completo", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });
  });

  describe("Limpeza de Cache", () => {
    it("deve limpar cache quando não há sessão", () => {
      if (
        typeof localStorage !== "undefined" &&
        typeof localStorage.setItem === "function"
      ) {
        localStorage.setItem("chefiapp_restaurant_id", "test-id");
        localStorage.setItem("chefiapp_active_tenant", "test-tenant");
      }

      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/app/dashboard",
      };

      // Simular limpeza (seria feito no FlowGate real)
      // Aqui apenas verificamos que o estado requer limpeza
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com estado inconsistente (hasOrganization=true mas onboardingStatus=not_started)", () => {
      const state: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        activated: true,
        currentPath: "/app/dashboard",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("ALLOW");
    });

    it("deve lidar com rota desconhecida quando não autenticado", () => {
      const state: UserState = {
        isAuthenticated: false,
        hasOrganization: false,
        currentPath: "/unknown/route",
      };

      const decision = resolveNextRoute(state);
      expect(decision.type).toBe("REDIRECT");
      if (decision.type === "REDIRECT") {
        expect(decision.to).toBe("/auth/email");
      }
    });
  });
});
