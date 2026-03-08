import { describe, expect, it } from "vitest";
import {
  createAppChromeState,
  getInstalledDesktopOperationalRoute,
  normalizeLastRoute,
  resolveNativeAppStaffRedirect,
  shouldPersistLastRoute,
} from "./appShellRouting";

describe("appShellRouting", () => {
  it("normalizes nested TPV and KDS paths to their canonical operational routes", () => {
    expect(normalizeLastRoute("/op/tpv/orders")).toBe("/op/tpv");
    expect(normalizeLastRoute("/op/kds/queue")).toBe("/op/kds");
    expect(normalizeLastRoute("/op/cash/close")).toBe("/op/cash");
  });

  it("returns allowed top-level routes unchanged and rejects unsupported paths", () => {
    expect(normalizeLastRoute("/dashboard")).toBe("/dashboard");
    expect(normalizeLastRoute("/admin/config")).toBe("/admin/config");
    expect(normalizeLastRoute("/app/staff/home")).toBeNull();
  });

  it("reads the installed desktop route from terminal type storage", () => {
    const tpvStorage = {
      getItem: (key: string) =>
        key === "chefiapp_terminal_type" ? "TPV" : null,
    };
    const kdsStorage = {
      getItem: (key: string) =>
        key === "chefiapp_terminal_type" ? "kds" : null,
    };

    expect(getInstalledDesktopOperationalRoute(tpvStorage)).toBe("/op/tpv");
    expect(getInstalledDesktopOperationalRoute(kdsStorage)).toBe("/op/kds");
    expect(
      getInstalledDesktopOperationalRoute({ getItem: () => null }),
    ).toBeNull();
  });

  it("blocks persistence of admin/dashboard last routes when a desktop terminal is installed", () => {
    expect(shouldPersistLastRoute("/dashboard", "/op/tpv")).toBe(false);
    expect(shouldPersistLastRoute("/admin/config", "/op/kds")).toBe(false);
    expect(shouldPersistLastRoute("/op/tpv", "/op/tpv")).toBe(true);
    expect(shouldPersistLastRoute("/op/kds", "/op/kds")).toBe(true);
    expect(shouldPersistLastRoute("/dashboard", null)).toBe(true);
  });

  it("computes chrome visibility flags from the current route", () => {
    expect(createAppChromeState("/dashboard")).toEqual({
      isBillingManagement: false,
      isDashboard: true,
      isOperationalSurface: false,
      shouldShowBillingBanner: false,
    });

    expect(createAppChromeState("/app/staff/home/manager")).toEqual({
      isBillingManagement: false,
      isDashboard: false,
      isOperationalSurface: false,
      shouldShowBillingBanner: false,
    });

    expect(createAppChromeState("/op/tpv/orders")).toEqual({
      isBillingManagement: false,
      isDashboard: false,
      isOperationalSurface: true,
      shouldShowBillingBanner: false,
    });
  });

  it("forces AppStaff home in native runtime for admin and desktop surfaces", () => {
    expect(resolveNativeAppStaffRedirect("/admin/reports/overview", true)).toBe(
      "/app/staff/home",
    );
    expect(resolveNativeAppStaffRedirect("/dashboard", true)).toBe(
      "/app/staff/home",
    );
    expect(resolveNativeAppStaffRedirect("/op/tpv", true)).toBe(
      "/app/staff/home",
    );
  });

  it("does not redirect when already inside AppStaff or outside native runtime", () => {
    expect(resolveNativeAppStaffRedirect("/app/staff/home", true)).toBeNull();
    expect(
      resolveNativeAppStaffRedirect("/app/staff/home/mode/tpv", true),
    ).toBe(null);
    expect(
      resolveNativeAppStaffRedirect("/admin/reports/overview", false),
    ).toBe(null);
  });
});
