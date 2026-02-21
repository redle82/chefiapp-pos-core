/**
 * Prova RBAC AppStaff — permissões por papel (ACCESS_RULES_MINIMAL).
 * Staff não vê Fechar caixa; Owner/Manager podem criar/atribuir tarefas.
 */
// @ts-nocheck


import { describe, expect, it } from "vitest";
import {
  getAppStaffPermissions,
  normalizeToAppStaffRole,
} from "./appStaffPermissions";

describe("getAppStaffPermissions", () => {
  it("owner: pode fechar caixa, criar e atribuir tarefas, ver faturação", () => {
    const p = getAppStaffPermissions("owner");
    expect(p.canCloseCash).toBe(true);
    expect(p.canCreateTask).toBe(true);
    expect(p.canAssignTask).toBe(true);
    expect(p.canSeeBilling).toBe(true);
    expect(p.canMarkServed).toBe(true);
    expect(p.readOnly).toBe(false);
  });

  it("manager: pode fechar caixa, criar e atribuir tarefas", () => {
    const p = getAppStaffPermissions("manager");
    expect(p.canCloseCash).toBe(true);
    expect(p.canCreateTask).toBe(true);
    expect(p.canAssignTask).toBe(true);
  });

  it("staff/waiter: NÃO pode fechar caixa nem criar/atribuir tarefas; pode marcar SERVED", () => {
    const pStaff = getAppStaffPermissions("staff");
    const pWaiter = getAppStaffPermissions("waiter");
    expect(pStaff.canCloseCash).toBe(false);
    expect(pStaff.canCreateTask).toBe(false);
    expect(pStaff.canAssignTask).toBe(false);
    expect(pStaff.canSeeBilling).toBe(false);
    expect(pStaff.canMarkServed).toBe(true);
    expect(pWaiter.canCloseCash).toBe(false);
    expect(pWaiter.canCreateTask).toBe(false);
  });

  it("kitchen: NÃO pode fechar caixa, criar pedido, Orders Lite de salão; pode KDS Lite", () => {
    const p = getAppStaffPermissions("kitchen");
    expect(p.canCloseCash).toBe(false);
    expect(p.canCreateTask).toBe(false);
    expect(p.canMarkServed).toBe(false);
    expect(p.canSeeOrdersLite).toBe(false);
    expect(p.canSeeKDSLite).toBe(true);
  });

  it("auditor: readOnly, sem execução", () => {
    const p = getAppStaffPermissions("auditor");
    expect(p.readOnly).toBe(true);
    expect(p.canCloseCash).toBe(false);
    expect(p.canCreateTask).toBe(false);
    expect(p.canMarkServed).toBe(false);
  });
});

describe("normalizeToAppStaffRole", () => {
  it("waiter e staff normalizam para waiter", () => {
    expect(normalizeToAppStaffRole("waiter")).toBe("waiter");
    expect(normalizeToAppStaffRole("staff")).toBe("waiter");
  });
  it("null/undefined viram worker", () => {
    expect(normalizeToAppStaffRole(null)).toBe("worker");
    expect(normalizeToAppStaffRole(undefined)).toBe("worker");
  });
});
