import { describe, expect, it } from "vitest";
import { resolveNextRoute, type UserState } from "./CoreFlow";

describe("CoreFlow Logic — telefone → setup mínimo → dashboard", () => {
  const baseState: UserState = {
    isAuthenticated: true,
    hasOrganization: false,
    currentPath: "/",
    systemState: "SETUP",
  };

  it("permite acesso público a / e /public/* sem sessão", () => {
    expect(
      resolveNextRoute({
        ...baseState,
        isAuthenticated: false,
        currentPath: "/public/menu/123",
      })
    ).toEqual({ type: "ALLOW" });

    expect(
      resolveNextRoute({
        ...baseState,
        isAuthenticated: false,
        currentPath: "/",
      })
    ).toEqual({ type: "ALLOW" });
  });

  it("redireciona não autenticado para /auth/phone", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: false,
      currentPath: "/dashboard",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/auth/phone",
      reason: "Auth required",
    });
  });

  it("utilizador autenticado sem restaurante vai sempre para /setup/restaurant-minimal", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: false,
      hasRestaurant: false,
      currentPath: "/dashboard",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/setup/restaurant-minimal",
      reason:
        "No org → setup mínimo (telefone/identidade) antes do Dashboard",
    });
  });

  it("utilizador autenticado com restaurante cai no /dashboard ao entrar por /auth/phone", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      currentPath: "/auth/phone",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/dashboard",
      reason: "Sovereign Entry to Dashboard",
    });
  });

  it("bloqueia TPV/KDS em SETUP redirecionando para /dashboard", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      systemState: "SETUP",
      currentPath: "/op/tpv",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/dashboard",
      reason: "Complete o setup no Dashboard para aceder ao TPV/KDS",
    });
  });
});
