import { describe, expect, it, vi } from "vitest";

import {
  coreGating,
  getBlockReason,
  isActionAllowed,
  withGating,
} from "./gating";

describe("coreGating", () => {
  it("allows all actions when health is UP", () => {
    const result = coreGating({ health: "UP", action: "payment" });
    expect(result).toEqual({ allowed: true, reason: null });
  });

  it("blocks payment when DEGRADED and allows non-critical", () => {
    expect(coreGating({ health: "DEGRADED", action: "payment" })).toMatchObject(
      {
        allowed: false,
        fallbackAction: "wait",
      },
    );

    expect(coreGating({ health: "DEGRADED", action: "save" })).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it("UNKNOWN allows non_critical and blocks critical", () => {
    expect(coreGating({ health: "UNKNOWN", action: "non_critical" })).toEqual({
      allowed: true,
      reason: null,
    });

    const blocked = coreGating({ health: "UNKNOWN", action: "publish" });
    expect(blocked.allowed).toBe(false);
    expect(blocked.fallbackAction).toBe("wait");
  });

  it("DOWN allows create with trialConsent and blocks critical actions", () => {
    expect(
      coreGating({ health: "DOWN", action: "create", trialConsent: true }),
    ).toMatchObject({
      allowed: true,
      fallbackAction: "trial_consent",
    });

    expect(coreGating({ health: "DOWN", action: "non_critical" })).toEqual({
      allowed: true,
      reason: null,
    });

    const blockedCreate = coreGating({ health: "DOWN", action: "create" });
    expect(blockedCreate.allowed).toBe(false);
    expect(blockedCreate.fallbackAction).toBe("trial_consent");

    const blockedPublish = coreGating({ health: "DOWN", action: "publish" });
    expect(blockedPublish.allowed).toBe(false);
    expect(blockedPublish.fallbackAction).toBe("retry");
  });

  it("uses custom message overrides", () => {
    const degraded = coreGating({
      health: "DEGRADED",
      action: "payment",
      customMessage: "custom degraded",
    });
    expect(degraded.reason).toBe("custom degraded");

    const down = coreGating({
      health: "DOWN",
      action: "critical",
      customMessage: "custom down",
    });
    expect(down.reason).toBe("custom down");
  });

  it("falls back to generic DOWN message for unknown action", () => {
    const result = coreGating({
      health: "DOWN",
      action: "unknown_action" as any,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Sistema indisponivel.");
    expect(result.fallbackAction).toBe("retry");
  });
});

describe("helpers", () => {
  it("isActionAllowed and getBlockReason reflect coreGating", () => {
    expect(isActionAllowed("UP", "critical")).toBe(true);
    expect(isActionAllowed("DOWN", "payment")).toBe(false);

    expect(getBlockReason("UP", "publish")).toBeNull();
    expect(getBlockReason("DOWN", "save")).toContain("Alteracoes");
  });

  it("withGating executes action when allowed", async () => {
    const action = vi.fn(async () => "ok");
    const onBlocked = vi.fn();

    const result = await withGating(
      { health: "UP", action: "critical" },
      action,
      onBlocked,
    );

    expect(result).toBe("ok");
    expect(action).toHaveBeenCalledTimes(1);
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it("withGating blocks action and invokes callback", async () => {
    const action = vi.fn(async () => "ok");
    const onBlocked = vi.fn();

    const result = await withGating(
      { health: "DOWN", action: "payment" },
      action,
      onBlocked,
    );

    expect(result).toBeNull();
    expect(action).not.toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledTimes(1);
  });

  it("withGating blocks action even when callback is omitted", async () => {
    const action = vi.fn(async () => "ok");
    const result = await withGating(
      { health: "DOWN", action: "payment" },
      action,
    );

    expect(result).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });
});
