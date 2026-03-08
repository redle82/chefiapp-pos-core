import { describe, expect, it } from "vitest";
import { assertOperationalAccess } from "./assertOperationalAccess";

describe("assertOperationalAccess", () => {
  it("permite TPV no Electron", () => {
    expect(
      assertOperationalAccess({ module: "tpv", runtime: "electron" }),
    ).toEqual({ allowed: true });
  });

  it("bloqueia KDS no browser com redirect para dispositivos", () => {
    expect(
      assertOperationalAccess({ module: "kds", runtime: "browser" }),
    ).toEqual({
      allowed: false,
      reason: "RUNTIME_FORBIDDEN",
      redirectTo: "/admin/devices",
    });
  });

  it("bloqueia AppStaff no browser", () => {
    expect(
      assertOperationalAccess({ module: "appstaff", runtime: "browser" }),
    ).toEqual({
      allowed: false,
      reason: "RUNTIME_FORBIDDEN",
      redirectTo: "/admin/devices",
    });
  });

  it("bloqueia AppStaff no Electron por padrão", () => {
    expect(
      assertOperationalAccess({ module: "appstaff", runtime: "electron" }),
    ).toEqual({
      allowed: false,
      reason: "RUNTIME_FORBIDDEN",
    });
  });

  it("permite AppStaff no Electron quando override explícito", () => {
    expect(
      assertOperationalAccess({
        module: "appstaff",
        runtime: "electron",
        allowAppStaffInElectron: true,
      }),
    ).toEqual({ allowed: true });
  });
});
