import { describe, expect, it, vi } from "vitest";
import { createSafeMetrics, initAppSentry, shouldInitSentry } from "./sentry";

describe("bootstrap sentry", () => {
  it("only initializes in production web runtime", () => {
    expect(
      shouldInitSentry({ mode: "production", isElectronRuntime: false }),
    ).toBe(true);
    expect(
      shouldInitSentry({ mode: "development", isElectronRuntime: false }),
    ).toBe(false);
    expect(
      shouldInitSentry({ mode: "production", isElectronRuntime: true }),
    ).toBe(false);
  });

  it("initializes sentry with tracing and replay integrations", () => {
    const init = vi.fn();
    const browserTracingIntegration = vi.fn(() => "trace");
    const replayIntegration = vi.fn(() => "replay");

    initAppSentry({
      mode: "production",
      isElectronRuntime: false,
      sentry: {
        getClient: () => null,
        init,
        browserTracingIntegration,
        replayIntegration,
      },
      log: { log: vi.fn() },
    });

    expect(browserTracingIntegration).toHaveBeenCalledTimes(1);
    expect(replayIntegration).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("creates no-op metrics when sentry metrics api is unavailable", () => {
    const metrics = createSafeMetrics({ metrics: undefined });

    expect(() => metrics.increment()).not.toThrow();
    expect(() => metrics.distribution()).not.toThrow();
    expect(() => metrics.gauge()).not.toThrow();
  });
});
