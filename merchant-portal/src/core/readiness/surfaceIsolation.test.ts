/**
 * @vitest-environment jsdom
 *
 * Surface Isolation Tests — ORE redirectFor & uiDirectiveFor
 *
 * Critical invariant: TPV/KDS surfaces must NEVER receive /admin/* redirects.
 * These are the operational surfaces that run inside Electron desktop windows.
 */
import { describe, expect, it } from "vitest";
import type { Surface } from "./types";
import { redirectFor, uiDirectiveFor } from "./useOperationalReadiness";

const OPERATIONAL_SURFACES: Surface[] = ["TPV", "KDS"];
const ALL_SURFACES: Surface[] = ["TPV", "KDS", "DASHBOARD", "WEB"];

describe("redirectFor — surface isolation invariant", () => {
  it("returns /admin/modules for MODULE_NOT_ENABLED on all surfaces", () => {
    for (const surface of ALL_SURFACES) {
      expect(redirectFor(surface, "MODULE_NOT_ENABLED")).toBe("/admin/modules");
    }
  });

  it("returns /admin/modules for MODULE_NOT_ENABLED on DASHBOARD", () => {
    expect(redirectFor("DASHBOARD", "MODULE_NOT_ENABLED")).toBe(
      "/admin/modules",
    );
  });

  it("returns /admin/modules for MODULE_NOT_ENABLED on WEB", () => {
    expect(redirectFor("WEB", "MODULE_NOT_ENABLED")).toBe("/admin/modules");
  });

  it("returns /admin/modules for RESTAURANT_NOT_FOUND on TPV/KDS", () => {
    expect(redirectFor("TPV", "RESTAURANT_NOT_FOUND")).toBe("/admin/modules");
    expect(redirectFor("KDS", "RESTAURANT_NOT_FOUND")).toBe("/admin/modules");
  });

  it("returns /app/dashboard for BOOTSTRAP_INCOMPLETE on TPV/KDS", () => {
    expect(redirectFor("TPV", "BOOTSTRAP_INCOMPLETE")).toBe("/app/dashboard");
    expect(redirectFor("KDS", "BOOTSTRAP_INCOMPLETE")).toBe("/app/dashboard");
  });
});

describe("uiDirectiveFor — operational surfaces", () => {
  it("shows blocking screen for MODULE_NOT_ENABLED on TPV/KDS", () => {
    for (const surface of OPERATIONAL_SURFACES) {
      expect(uiDirectiveFor(surface, "MODULE_NOT_ENABLED")).toBe(
        "SHOW_BLOCKING_SCREEN",
      );
    }
  });

  it("redirects for BOOTSTRAP_INCOMPLETE on TPV/KDS", () => {
    for (const surface of OPERATIONAL_SURFACES) {
      expect(uiDirectiveFor(surface, "BOOTSTRAP_INCOMPLETE")).toBe("REDIRECT");
    }
  });
});
