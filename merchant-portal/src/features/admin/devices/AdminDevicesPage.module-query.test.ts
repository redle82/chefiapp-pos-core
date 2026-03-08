import { describe, expect, it } from "vitest";
import { resolveInitialTokenType } from "./AdminDevicesPage";

describe("AdminDevicesPage module query preselection", () => {
  it("maps tpv to TPV", () => {
    expect(resolveInitialTokenType("tpv")).toBe("TPV");
  });

  it("maps kds to KDS", () => {
    expect(resolveInitialTokenType("kds")).toBe("KDS");
  });

  it("defaults to APPSTAFF for unknown module", () => {
    expect(resolveInitialTokenType("unknown")).toBe("APPSTAFF");
  });

  it("defaults to APPSTAFF for null", () => {
    expect(resolveInitialTokenType(null)).toBe("APPSTAFF");
  });
});
