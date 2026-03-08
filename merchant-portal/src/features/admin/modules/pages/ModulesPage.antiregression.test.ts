/**
 * @vitest-environment jsdom
 */

/**
 * Anti-regression tests for Fase 1 — Installation Hub refactoring.
 *
 * Guarantees:
 *  1. No window.open() for TPV/KDS/AppStaff from Admin web
 *  2. getModulePrimaryPath returns /admin/devices for all operational modules
 *  3. openOperationalWindow functions are no-ops (deprecated)
 *
 * Ref: MODULES_AND_DEVICES_ANTIREGRESSION.md
 */

import { describe, expect, it, vi } from "vitest";
import {
  openAppStaffInNewWindow,
  openKdsInNewWindow,
  openOperationalInNewWindow,
  openTpvInNewWindow,
} from "../../../../core/operational/openOperationalWindow";
import { getModulePrimaryPath } from "./ModulesPage";

describe("Fase 1 anti-regression: zero popups", () => {
  it("TPV primary path → /admin/devices (not /op/tpv)", () => {
    expect(getModulePrimaryPath("tpv")).toBe("/admin/devices");
  });

  it("KDS primary path → /admin/devices (not /op/kds)", () => {
    expect(getModulePrimaryPath("kds")).toBe("/admin/devices");
  });

  it("AppStaff primary path → /admin/devices (not /app/staff/home)", () => {
    expect(getModulePrimaryPath("appstaff")).toBe("/admin/devices");
  });

  it("openTpvInNewWindow is a no-op (no window.open)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    openTpvInNewWindow();
    openTpvInNewWindow("mode=trial");

    expect(openSpy).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("DEPRECATED"));

    spy.mockRestore();
    openSpy.mockRestore();
  });

  it("openKdsInNewWindow is a no-op (no window.open)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    openKdsInNewWindow();

    expect(openSpy).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("DEPRECATED"));

    spy.mockRestore();
    openSpy.mockRestore();
  });

  it("openAppStaffInNewWindow is a no-op (no window.open)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    openAppStaffInNewWindow();

    expect(openSpy).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("DEPRECATED"));

    spy.mockRestore();
    openSpy.mockRestore();
  });

  it("openOperationalInNewWindow is a no-op for all module types", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    openOperationalInNewWindow("tpv");
    openOperationalInNewWindow("kds");
    openOperationalInNewWindow("appstaff");

    expect(openSpy).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(3);

    spy.mockRestore();
    openSpy.mockRestore();
  });

  it("non-operational modules keep their specific paths", () => {
    expect(getModulePrimaryPath("fichaje")).toBe("/app/staff");
    expect(getModulePrimaryPath("stock")).toBe("/inventory-stock");
    expect(getModulePrimaryPath("tienda-online")).toBe(
      "/admin/config/tienda-online",
    );
    expect(getModulePrimaryPath("reservas")).toBe("/admin/reservations");
  });
});
