// @ts-nocheck
import { describe, expect, it } from "vitest";
import { isTrialModeParam } from "./TrialMode";

describe("isTrialModeParam", () => {
  it("returns true when mode=trial", () => {
    const params = new URLSearchParams({ mode: "trial" });
    expect(isTrialModeParam(params)).toBe(true);
  });

  it("returns false for other modes", () => {
    const params = new URLSearchParams({ mode: "production" });
    expect(isTrialModeParam(params)).toBe(false);
  });

  it("returns false when mode is missing", () => {
    const params = new URLSearchParams();
    expect(isTrialModeParam(params)).toBe(false);
  });
});
