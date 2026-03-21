/**
 * Unit tests for BootState — Reducer + FSM integrity
 *
 * Tests the pure bootReducer function to verify every state transition
 * produces the correct BootStep and snapshot shape.
 *
 * @tag BOOT-PIPELINE UNIT
 */

import { describe, expect, it } from "@jest/globals";
import {
  BootStep,
  ERROR_STEPS,
  TERMINAL_STEPS,
  bootReducer,
  createInitialSnapshot,
} from "../../../merchant-portal/src/core/boot/BootState";

describe("createInitialSnapshot", () => {
  it("starts at BOOT_START with default values", () => {
    const snap = createInitialSnapshot();
    expect(snap.step).toBe(BootStep.BOOT_START);
    expect(snap.auth.isAuthenticated).toBe(false);
    expect(snap.auth.userId).toBeNull();
    expect(snap.auth.loading).toBe(true);
    expect(snap.tenant.hasOrg).toBe(false);
    expect(snap.tenant.restaurantId).toBeNull();
    expect(snap.destination).toBeNull();
    expect(snap.error).toBeNull();
    expect(snap.elapsedMs).toBe(0);
    expect(snap.startedAt).toBeGreaterThan(0);
  });
});

describe("bootReducer — happy path", () => {
  it("BOOT_START → AUTH_CHECKING via AUTH_CHECK_START", () => {
    const s0 = createInitialSnapshot();
    const s1 = bootReducer(s0, { type: "AUTH_CHECK_START" });
    expect(s1.step).toBe(BootStep.AUTH_CHECKING);
    expect(s1.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("AUTH_CHECKING → AUTH_RESOLVED via AUTH_RESOLVED", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    const auth = { isAuthenticated: true, userId: "user-1", loading: false };
    s = bootReducer(s, { type: "AUTH_RESOLVED", auth });
    expect(s.step).toBe(BootStep.AUTH_RESOLVED);
    expect(s.auth).toEqual(auth);
  });

  it("AUTH_RESOLVED → TENANT_LOADING via TENANT_LOAD_START", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    expect(s.step).toBe(BootStep.TENANT_LOADING);
  });

  it("TENANT_LOADING → TENANT_RESOLVED via TENANT_RESOLVED", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    const tenant = {
      hasOrg: true,
      restaurantId: "r-1",
      billingStatus: "active",
      activated: true,
      sealed: true,
      isBootstrapComplete: true,
    };
    s = bootReducer(s, { type: "TENANT_RESOLVED", tenant });
    expect(s.step).toBe(BootStep.TENANT_RESOLVED);
    expect(s.tenant).toEqual(tenant);
  });

  it("TENANT_RESOLVED → LIFECYCLE_DERIVED via LIFECYCLE_DERIVED", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    s = bootReducer(s, {
      type: "TENANT_RESOLVED",
      tenant: {
        hasOrg: true,
        restaurantId: "r-1",
        billingStatus: null,
        activated: false,
        sealed: false,
        isBootstrapComplete: false,
      },
    });
    s = bootReducer(s, { type: "LIFECYCLE_DERIVED" });
    expect(s.step).toBe(BootStep.LIFECYCLE_DERIVED);
  });

  it("full happy path reaches BOOT_DONE", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    s = bootReducer(s, {
      type: "TENANT_RESOLVED",
      tenant: {
        hasOrg: true,
        restaurantId: "r-1",
        billingStatus: "trial",
        activated: true,
        sealed: true,
        isBootstrapComplete: true,
      },
    });
    s = bootReducer(s, { type: "LIFECYCLE_DERIVED" });
    s = bootReducer(s, {
      type: "ROUTE_DECIDED",
      destination: {
        type: "ALLOW",
        reasonCode: "ROUTE_ALLOW",
        reason: "CoreFlow ALLOW",
      },
    });
    expect(s.step).toBe(BootStep.ROUTE_DECIDING);
    expect(s.destination?.type).toBe("ALLOW");

    s = bootReducer(s, { type: "BOOT_DONE" });
    expect(s.step).toBe(BootStep.BOOT_DONE);
    expect(TERMINAL_STEPS.has(s.step)).toBe(true);
    expect(ERROR_STEPS.has(s.step)).toBe(false);
  });
});

describe("bootReducer — error paths", () => {
  it("AUTH_TIMEOUT produces error terminal", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, { type: "AUTH_TIMEOUT" });
    expect(s.step).toBe(BootStep.AUTH_TIMEOUT);
    expect(s.error).toBeInstanceOf(Error);
    expect(s.error?.message).toContain("Auth did not resolve");
    expect(TERMINAL_STEPS.has(s.step)).toBe(true);
    expect(ERROR_STEPS.has(s.step)).toBe(true);
  });

  it("TENANT_ERROR produces error terminal", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    const err = new Error("RPC failed");
    s = bootReducer(s, { type: "TENANT_ERROR", error: err });
    expect(s.step).toBe(BootStep.TENANT_ERROR);
    expect(s.error).toBe(err);
    expect(TERMINAL_STEPS.has(s.step)).toBe(true);
  });

  it("TENANT_TIMEOUT produces error terminal", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    s = bootReducer(s, { type: "TENANT_TIMEOUT" });
    expect(s.step).toBe(BootStep.TENANT_TIMEOUT);
    expect(s.error).toBeInstanceOf(Error);
    expect(s.error?.message).toContain("Tenant resolution");
    expect(ERROR_STEPS.has(s.step)).toBe(true);
  });

  it("ROUTE_ERROR produces error terminal", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    s = bootReducer(s, { type: "TENANT_LOAD_START" });
    s = bootReducer(s, {
      type: "TENANT_RESOLVED",
      tenant: {
        hasOrg: true,
        restaurantId: "r-1",
        billingStatus: "trial",
        activated: true,
        sealed: true,
        isBootstrapComplete: true,
      },
    });
    s = bootReducer(s, { type: "LIFECYCLE_DERIVED" });
    const err = new Error("resolve blew up");
    s = bootReducer(s, { type: "ROUTE_ERROR", error: err });
    expect(s.step).toBe(BootStep.ROUTE_ERROR);
    expect(s.error).toBe(err);
    expect(ERROR_STEPS.has(s.step)).toBe(true);
  });
});

describe("bootReducer — RESET", () => {
  it("returns fresh initial snapshot", () => {
    let s = createInitialSnapshot();
    s = bootReducer(s, { type: "AUTH_CHECK_START" });
    s = bootReducer(s, {
      type: "AUTH_RESOLVED",
      auth: { isAuthenticated: true, userId: "u1", loading: false },
    });
    const reset = bootReducer(s, { type: "RESET" });
    expect(reset.step).toBe(BootStep.BOOT_START);
    expect(reset.auth.isAuthenticated).toBe(false);
    expect(reset.auth.loading).toBe(true);
    expect(reset.tenant.hasOrg).toBe(false);
    expect(reset.destination).toBeNull();
    expect(reset.error).toBeNull();
  });
});

describe("TERMINAL_STEPS and ERROR_STEPS sets", () => {
  it("ERROR_STEPS is a subset of TERMINAL_STEPS", () => {
    for (const s of ERROR_STEPS) {
      expect(TERMINAL_STEPS.has(s)).toBe(true);
    }
  });

  it("BOOT_DONE is terminal but not error", () => {
    expect(TERMINAL_STEPS.has(BootStep.BOOT_DONE)).toBe(true);
    expect(ERROR_STEPS.has(BootStep.BOOT_DONE)).toBe(false);
  });

  it("AUTH_CHECKING is not terminal", () => {
    expect(TERMINAL_STEPS.has(BootStep.AUTH_CHECKING)).toBe(false);
  });
});
