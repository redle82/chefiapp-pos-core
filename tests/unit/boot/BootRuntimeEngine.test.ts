import { describe, expect, it } from "@jest/globals";
import { BootStep } from "../../../merchant-portal/src/core/boot/BootState";
import {
  getBootCheckKey,
  getBootTimeoutBudget,
  isBootErrorStep,
  shouldNavigateToDecision,
  shouldResetPipelineForUserChange,
} from "../../../merchant-portal/src/core/boot/runtime/BootRuntimeEngine";

describe("BootRuntimeEngine", () => {
  describe("getBootTimeoutBudget", () => {
    it("returns docker timeout budget when isDocker=true", () => {
      const budget = getBootTimeoutBudget(true);
      expect(budget).toEqual({ auth: 4000, tenant: 3000, global: 6000 });
    });

    it("returns default timeout budget when isDocker=false", () => {
      const budget = getBootTimeoutBudget(false);
      expect(budget).toEqual({ auth: 8000, tenant: 6000, global: 12000 });
    });
  });

  describe("getBootCheckKey", () => {
    it("builds stable key with user id", () => {
      expect(getBootCheckKey("user-1", "/app/dashboard")).toBe(
        "user-1::/app/dashboard",
      );
    });

    it("uses anon when user id is null", () => {
      expect(getBootCheckKey(null, "/")).toBe("anon::/");
    });
  });

  describe("shouldNavigateToDecision", () => {
    it("returns true for redirect decision to different target", () => {
      expect(
        shouldNavigateToDecision(
          {
            type: "REDIRECT",
            to: "/app/dashboard",
            reasonCode: "ROUTE_REDIRECT",
          },
          "/auth/phone",
          "",
        ),
      ).toBe(true);
    });

    it("returns false for null or non-redirect decision", () => {
      expect(shouldNavigateToDecision(null, "/auth/phone", "")).toBe(false);
      expect(
        shouldNavigateToDecision(
          { type: "ALLOW", reasonCode: "ROUTE_ALLOW" },
          "/app/dashboard",
          "",
        ),
      ).toBe(false);
    });

    it("returns false when target equals current pathname", () => {
      expect(
        shouldNavigateToDecision(
          {
            type: "REDIRECT",
            to: "/app/dashboard",
            reasonCode: "ROUTE_REDIRECT",
          },
          "/app/dashboard",
          "",
        ),
      ).toBe(false);
    });

    it("returns false when target equals current path+search", () => {
      expect(
        shouldNavigateToDecision(
          {
            type: "REDIRECT",
            to: "/op/tpv?mode=trial",
            reasonCode: "ROUTE_REDIRECT",
          },
          "/op/tpv",
          "?mode=trial",
        ),
      ).toBe(false);
    });
  });

  describe("shouldResetPipelineForUserChange", () => {
    it("returns false on first observation (undefined previous)", () => {
      expect(shouldResetPipelineForUserChange(undefined, "user-1")).toBe(false);
    });

    it("returns false when user remains the same", () => {
      expect(shouldResetPipelineForUserChange("user-1", "user-1")).toBe(false);
    });

    it("returns true when user identity changes", () => {
      expect(shouldResetPipelineForUserChange("user-1", "user-2")).toBe(true);
      expect(shouldResetPipelineForUserChange("user-1", null)).toBe(true);
    });
  });

  describe("isBootErrorStep", () => {
    it("returns true for error terminal steps", () => {
      expect(isBootErrorStep(BootStep.AUTH_TIMEOUT)).toBe(true);
      expect(isBootErrorStep(BootStep.TENANT_ERROR)).toBe(true);
      expect(isBootErrorStep(BootStep.TENANT_TIMEOUT)).toBe(true);
      expect(isBootErrorStep(BootStep.ROUTE_ERROR)).toBe(true);
    });

    it("returns false for non-error steps", () => {
      expect(isBootErrorStep(BootStep.BOOT_START)).toBe(false);
      expect(isBootErrorStep(BootStep.BOOT_DONE)).toBe(false);
      expect(isBootErrorStep(BootStep.AUTH_CHECKING)).toBe(false);
    });
  });
});
