/**
 * NAVIGATION_CONTRACT: cada card do Hub tem ação primária com destino válido.
 * Nenhum id cai no default sem destino; todos os paths são permitidos.
 * Ref: docs/architecture/NAVIGATION_CONTRACT.md §6
 */

import { describe, expect, it } from "vitest";
import { MODULES_DEFINITIONS } from "../data/modulesDefinitions";
import { getModulePrimaryPath } from "./ModulesPage";

/** Paths permitidos para ação primária do Hub (operacionais via hub, admin, activation). */
const PERMITTED_PRIMARY_PATHS = [
  "/admin/devices",
  "/app/staff",
  "/app/activation",
  "/inventory-stock",
  "/admin/config/integrations",
  "/admin/config/delivery",
  "/admin/reservations",
];

function isPermittedPath(path: string): boolean {
  if (!path || typeof path !== "string" || !path.startsWith("/")) return false;
  return (
    PERMITTED_PRIMARY_PATHS.includes(path) ||
    path.startsWith("/admin/") ||
    path.startsWith("/op/") ||
    path.startsWith("/app/staff/") ||
    path === "/app/activation"
  );
}

describe("ModulesPage navigation (Hub primary action)", () => {
  it("every module id has a valid primary path from getModulePrimaryPath", () => {
    for (const def of MODULES_DEFINITIONS) {
      const path = getModulePrimaryPath(def.id);
      expect(
        path,
        `Module "${def.id}" must resolve to a permitted path`,
      ).toBeDefined();
      expect(path, `Module "${def.id}" path must start with /`).toMatch(/^\//);
      expect(
        isPermittedPath(path),
        `Module "${def.id}" path "${path}" must be a permitted destination`,
      ).toBe(true);
    }
  });

  it("unknown module id defaults to /app/activation (no dead button)", () => {
    const path = getModulePrimaryPath("unknown-module-id");
    expect(path).toBe("/app/activation");
  });

  it("no module id returns empty or undefined path", () => {
    const ids = MODULES_DEFINITIONS.map((d) => d.id);
    for (const id of ids) {
      const path = getModulePrimaryPath(id);
      expect(path).not.toBe("");
      expect(path).not.toBeUndefined();
    }
  });
});
