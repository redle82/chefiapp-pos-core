// @ts-nocheck
import { describe, expect, it } from "vitest";
import { resolveNextRoute, type UserState } from "./CoreFlow";

describe("CoreFlow Logic — auth → welcome → activation → dashboard", () => {
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
      }),
    ).toEqual({ type: "ALLOW" });

    expect(
      resolveNextRoute({
        ...baseState,
        isAuthenticated: false,
        currentPath: "/",
      }),
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

  it("utilizador autenticado sem restaurante vai para /welcome", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: false,
      hasRestaurant: false,
      currentPath: "/dashboard",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/welcome",
      reason: "No org → Bem-vindo (primeira tela pós-auth)",
    });
  });

  it("utilizador autenticado com restaurante não ativado vai para /app/activation ao entrar por /auth/phone", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      currentPath: "/auth/phone",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/app/activation",
      reason: "Not activated → Centro de Ativação (checklist)",
    });
  });

  it("utilizador com restaurante não ativado em /dashboard vai para /app/activation", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      activated: false,
      currentPath: "/dashboard",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/app/activation",
      reason: "Not activated → Centro de Ativação (checklist)",
    });
  });

  it("utilizador ativado vai para /app/dashboard ao entrar por /auth/phone", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      activated: true,
      currentPath: "/auth/phone",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/app/dashboard",
      reason: "Activated → última área (default dashboard)",
    });
  });

  it("utilizador ativado com lastRoute válido vai para última área", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      activated: true,
      lastRoute: "/op/tpv",
      currentPath: "/auth",
    });
    expect(decision).toEqual({
      type: "REDIRECT",
      to: "/op/tpv",
      reason: "Activated → última área (default dashboard)",
    });
  });

  it("bloqueia TPV/KDS em SETUP redirecionando para /app/activation", () => {
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
      to: "/app/activation",
      reason: "Complete o setup no Centro de Ativação para aceder ao TPV/KDS",
    });
  });

  it("permite /op/tpv em SETUP quando mode=trial (Testar pedido no Centro de Ativação)", () => {
    const decision = resolveNextRoute({
      ...baseState,
      isAuthenticated: true,
      hasOrganization: true,
      hasRestaurant: true,
      systemState: "SETUP",
      currentPath: "/op/tpv",
      currentSearch: "?mode=trial",
    });
    expect(decision).toEqual({ type: "ALLOW" });
  });
});
