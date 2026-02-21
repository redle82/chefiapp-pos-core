/**
 * Testes mínimos do sistema de papéis — canAccessPath e getAllowedRolesForPath
 */
// @ts-nocheck


import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  getAllowedRolesForPath,
  type UserRole,
} from "./rolePermissions";

describe("getAllowedRolesForPath", () => {
  it("retorna owner para /admin/config/integrations, modules, status, payments", () => {
    expect(getAllowedRolesForPath("/admin/config/integrations")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/admin/config/modules")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/admin/config/status")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/admin/config/payments")).toEqual(["owner"]);
  });

  it("retorna owner e manager para /dashboard, /admin/config, /admin/config/perception, /mentor, /health", () => {
    expect(getAllowedRolesForPath("/dashboard")).toEqual(["owner", "manager"]);
    expect(getAllowedRolesForPath("/admin/config")).toEqual(["owner", "manager"]);
    expect(getAllowedRolesForPath("/admin/config/perception")).toEqual([
      "owner",
      "manager",
    ]);
    expect(getAllowedRolesForPath("/mentor")).toEqual(["owner", "manager"]);
    expect(getAllowedRolesForPath("/health")).toEqual(["owner", "manager"]);
  });

  it("retorna todos para /tpv, /kds-minimal, /tasks, /people, /garcom, /alerts", () => {
    const all: UserRole[] = ["owner", "manager", "staff"];
    expect(getAllowedRolesForPath("/tpv")).toEqual(all);
    expect(getAllowedRolesForPath("/kds-minimal")).toEqual(all);
    expect(getAllowedRolesForPath("/tasks")).toEqual(all);
    expect(getAllowedRolesForPath("/people")).toEqual(all);
    expect(getAllowedRolesForPath("/garcom")).toEqual(all);
    expect(getAllowedRolesForPath("/alerts")).toEqual(all);
  });

  it("normaliza path (query/hash/trailing slash) e devolve roles corretos", () => {
    expect(getAllowedRolesForPath("/admin/config/integrations?x=1")).toEqual([
      "owner",
    ]);
    expect(getAllowedRolesForPath("/dashboard/")).toEqual(["owner", "manager"]);
  });

  it("prefix match: /admin/config/general usa regra de /admin/config", () => {
    expect(getAllowedRolesForPath("/admin/config/general")).toEqual([
      "owner",
      "manager",
    ]);
  });

  it("retorna owner para /app/billing, /owner, /system-tree, /billing, /groups", () => {
    expect(getAllowedRolesForPath("/app/billing")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/app/backoffice")).toEqual([
      "owner",
      "manager",
    ]);
    expect(getAllowedRolesForPath("/owner/vision")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/system-tree")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/billing")).toEqual(["owner"]);
    expect(getAllowedRolesForPath("/groups")).toEqual(["owner"]);
  });
});

describe("canAccessPath", () => {
  describe("staff", () => {
    it("não acede a /dashboard, /admin/config, /admin/config/integrations", () => {
      expect(canAccessPath("staff", "/dashboard")).toBe(false);
      expect(canAccessPath("staff", "/admin/config")).toBe(false);
      expect(canAccessPath("staff", "/admin/config/integrations")).toBe(false);
    });

    it("accede a /garcom, /tpv, /kds-minimal, /tasks, /people, /alerts", () => {
      expect(canAccessPath("staff", "/garcom")).toBe(true);
      expect(canAccessPath("staff", "/tpv")).toBe(true);
      expect(canAccessPath("staff", "/kds-minimal")).toBe(true);
      expect(canAccessPath("staff", "/tasks")).toBe(true);
      expect(canAccessPath("staff", "/people")).toBe(true);
      expect(canAccessPath("staff", "/alerts")).toBe(true);
    });
  });

  describe("manager", () => {
    it("accede a /dashboard, /tasks, /kds-minimal, /admin/config/perception", () => {
      expect(canAccessPath("manager", "/dashboard")).toBe(true);
      expect(canAccessPath("manager", "/tasks")).toBe(true);
      expect(canAccessPath("manager", "/kds-minimal")).toBe(true);
      expect(canAccessPath("manager", "/admin/config/perception")).toBe(true);
    });

    it("não acede a /admin/config/integrations, modules, status, payments", () => {
      expect(canAccessPath("manager", "/admin/config/integrations")).toBe(false);
      expect(canAccessPath("manager", "/admin/config/modules")).toBe(false);
      expect(canAccessPath("manager", "/admin/config/status")).toBe(false);
      expect(canAccessPath("manager", "/admin/config/payments")).toBe(false);
    });
  });

  describe("owner", () => {
    it("accede a todas as rotas cobertas pela matriz", () => {
      expect(canAccessPath("owner", "/dashboard")).toBe(true);
      expect(canAccessPath("owner", "/admin/config")).toBe(true);
      expect(canAccessPath("owner", "/admin/config/integrations")).toBe(true);
      expect(canAccessPath("owner", "/admin/config/modules")).toBe(true);
      expect(canAccessPath("owner", "/admin/config/status")).toBe(true);
      expect(canAccessPath("owner", "/admin/config/payments")).toBe(true);
      expect(canAccessPath("owner", "/garcom")).toBe(true);
      expect(canAccessPath("owner", "/tpv")).toBe(true);
      expect(canAccessPath("owner", "/system-tree")).toBe(true);
      expect(canAccessPath("owner", "/billing")).toBe(true);
      expect(canAccessPath("owner", "/app/billing")).toBe(true);
      expect(canAccessPath("owner", "/groups")).toBe(true);
    });
  });

  it("manager não acede a /app/billing (owner-only)", () => {
    expect(canAccessPath("manager", "/app/billing")).toBe(false);
  });
});
