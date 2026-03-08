import { describe, expect, it } from "vitest";
import { buildDevicesInstallPath } from "./ModulesPage";

describe("ModulesPage install routing", () => {
  it("builds canonical devices path for TPV", () => {
    expect(buildDevicesInstallPath("tpv")).toBe("/admin/devices?module=tpv");
  });

  it("builds canonical devices path for KDS", () => {
    expect(buildDevicesInstallPath("kds")).toBe("/admin/devices?module=kds");
  });
});
