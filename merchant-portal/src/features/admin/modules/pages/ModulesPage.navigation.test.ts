/**
 * NAVIGATION_CONTRACT: cada card do Hub tem ação primária com destino válido.
 * Nenhum id cai no default sem destino; default = /app/activation.
 */

import { describe, expect, it } from "vitest";
import { MODULES_DEFINITIONS } from "../data/modulesDefinitions";
import { getModulePrimaryPath } from "./ModulesPage";

/** Paths permitidos como destino da ação primária (NAVIGATION_CONTRACT). */
const ALLOWED_PRIMARY_DESTINATIONS = [
  "/op/tpv",
  "/op/kds",
  "/app/staff",
  "/app/activation",
  "/admin/reports/overview",
  "/admin/config",
  "/admin/modules",
  "/admin/reservations",
  "/admin/config/integrations",
  "/admin/config/delivery",
  "/inventory-stock",
];

function isAllowedPath(path: string): boolean {
  return (
    ALLOWED_PRIMARY_DESTINATIONS.includes(path) ||
    path.startsWith("/admin/") ||
    path.startsWith("/app/")
  );
}

describe("ModulesPage navigation contract", () => {
  it("every defined module id has a valid primary path", () => {
    for (const def of MODULES_DEFINITIONS) {
      const path = getModulePrimaryPath(def.id);
      expect(path, `module ${def.id} should have valid path`).toBeTruthy();
      expect(
        path.startsWith("/") && path.length > 1,
        `module ${def.id} path should be absolute`,
      ).toBe(true);
      expect(
        isAllowedPath(path),
        `module ${def.id} path "${path}" should be an allowed destination`,
      ).toBe(true);
    }
  });

  it("default for unknown module id is /app/activation", () => {
    expect(getModulePrimaryPath("unknown-module")).toBe("/app/activation");
    expect(getModulePrimaryPath("")).toBe("/app/activation");
    expect(getModulePrimaryPath("new-future-module")).toBe("/app/activation");
  });

  it("no module id results in dead button (no empty or invalid path)", () => {
    const ids = MODULES_DEFINITIONS.map((d) => d.id);
    const paths = ids.map((id) => getModulePrimaryPath(id));
    const invalid = paths.filter((p) => !p || !p.startsWith("/"));
    expect(invalid).toHaveLength(0);
  });
});
