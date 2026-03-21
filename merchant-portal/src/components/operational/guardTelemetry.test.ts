/**
 * Tests for guardTelemetry — issue #14 DoD items 1–6.
 *
 * 3 cases:
 *   1. Prod + BLOCK + Sentry available + sampling passes → addBreadcrumb called
 *   2. Prod + BLOCK + Sentry absent (throws) + sampling passes → console.warn fallback
 *   3. Dev mode → verbose console.log, no breadcrumb/warn
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock @sentry/react                                                 */
/* ------------------------------------------------------------------ */
const mockAddBreadcrumb = vi.fn();

vi.mock("@sentry/react", () => ({
  addBreadcrumb: (...args: unknown[]) => mockAddBreadcrumb(...args),
}));

/* ------------------------------------------------------------------ */
/*  Import AFTER mocks are declared (Vitest hoists vi.mock)            */
/* ------------------------------------------------------------------ */
import { emitGuardTelemetry, type GuardTelemetryPayload } from "./guardTelemetry";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const BLOCK_PAYLOAD: GuardTelemetryPayload = {
  pathname: "/op/tpv",
  decision: "BLOCK",
  runtime: "browser",
  guard: "operational",
};

const ALLOW_PAYLOAD: GuardTelemetryPayload = {
  pathname: "/op/tpv",
  decision: "ALLOW",
  runtime: "electron",
  guard: "operational",
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe("guardTelemetry", () => {
  let originalDev: boolean;

  beforeEach(() => {
    originalDev = import.meta.env.DEV;
    mockAddBreadcrumb.mockReset();
  });

  afterEach(() => {
    import.meta.env.DEV = originalDev;
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────────────
  // 1. Prod + BLOCK + Sentry available + sampling passes
  // ────────────────────────────────────────────────────────
  it("emits Sentry breadcrumb when decision=BLOCK in prod and sampling passes", () => {
    import.meta.env.DEV = false;
    vi.spyOn(Math, "random").mockReturnValue(0.05); // < 0.1 → passes sampling

    emitGuardTelemetry(BLOCK_PAYLOAD);

    expect(mockAddBreadcrumb).toHaveBeenCalledOnce();
    expect(mockAddBreadcrumb).toHaveBeenCalledWith({
      category: "op-guard",
      level: "info",
      data: BLOCK_PAYLOAD,
    });
  });

  // ────────────────────────────────────────────────────────
  // 2. Prod + BLOCK + Sentry absent (throws) + sampling passes
  // ────────────────────────────────────────────────────────
  it("falls back to console.warn when Sentry throws", () => {
    import.meta.env.DEV = false;
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    mockAddBreadcrumb.mockImplementation(() => {
      throw new Error("Sentry not initialized");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitGuardTelemetry(BLOCK_PAYLOAD);

    expect(warnSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(logged).toEqual(BLOCK_PAYLOAD);
  });

  // ────────────────────────────────────────────────────────
  // 3. Dev mode keeps verbose console.log, no breadcrumb
  // ────────────────────────────────────────────────────────
  it("logs verbose [OP_GUARD] in dev mode and does NOT call Sentry", () => {
    import.meta.env.DEV = true;
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    emitGuardTelemetry(BLOCK_PAYLOAD);

    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toContain("[OP_GUARD]");
    expect(logSpy.mock.calls[0][0]).toContain("pathname=/op/tpv");
    expect(logSpy.mock.calls[0][0]).toContain("decision=BLOCK");
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────
  // Extra: ALLOW in prod is silently dropped (DoD #1)
  // ────────────────────────────────────────────────────────
  it("does NOT emit anything for ALLOW in prod (no noise)", () => {
    import.meta.env.DEV = false;
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitGuardTelemetry(ALLOW_PAYLOAD);

    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────
  // Extra: Sampling gate — random ≥ 0.1 drops the event
  // ────────────────────────────────────────────────────────
  it("drops BLOCK event when sampling gate rejects (random ≥ 0.1)", () => {
    import.meta.env.DEV = false;
    vi.spyOn(Math, "random").mockReturnValue(0.5); // > 0.1 → rejected

    emitGuardTelemetry(BLOCK_PAYLOAD);

    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────
  // Extra: standalone-pwa ALLOW still emits (DoD #1 — "or runtime=standalone-pwa")
  // ────────────────────────────────────────────────────────
  it("emits breadcrumb for standalone-pwa even when decision=ALLOW", () => {
    import.meta.env.DEV = false;
    vi.spyOn(Math, "random").mockReturnValue(0.05);

    const pwaPayload: GuardTelemetryPayload = {
      pathname: "/op/tpv",
      decision: "ALLOW",
      runtime: "standalone-pwa",
      guard: "operational",
    };

    emitGuardTelemetry(pwaPayload);

    expect(mockAddBreadcrumb).toHaveBeenCalledOnce();
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: "op-guard", data: pwaPayload }),
    );
  });
});
