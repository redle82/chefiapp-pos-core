/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deriveInitialState,
  launchDesktopWithHandshake,
  transitionDesktopLaunch,
  type DesktopLaunchMachine,
} from "./DesktopLaunchService";

describe("DesktopLaunchService state machine", () => {
  const baseContext = {
    moduleId: "tpv" as const,
    restaurantId: "rest-1",
    hasAnyInstallerUrl: true,
  };

  it("derives DESKTOP_INSTALLER_UNCONFIGURED when no installer URLs and no previous success", () => {
    const state = deriveInitialState({
      ...baseContext,
      hasAnyInstallerUrl: false,
    });
    expect(state).toBe("DESKTOP_INSTALLER_UNCONFIGURED");
  });

  it("derives DESKTOP_READY when installer URLs are configured", () => {
    const state = deriveInitialState(baseContext);
    expect(state).toBe("DESKTOP_READY");
  });

  it("CLICK_OPEN from DESKTOP_READY goes to LAUNCHING", () => {
    const machine: DesktopLaunchMachine = {
      context: baseContext,
      state: "DESKTOP_READY",
    };
    const next = transitionDesktopLaunch(machine, { type: "CLICK_OPEN" });
    expect(next.state).toBe("LAUNCHING");
  });

  it("CLICK_OPEN from DESKTOP_INSTALLER_UNCONFIGURED is ignored", () => {
    const machine: DesktopLaunchMachine = {
      context: { ...baseContext, hasAnyInstallerUrl: false },
      state: "DESKTOP_INSTALLER_UNCONFIGURED",
    };
    const next = transitionDesktopLaunch(machine, { type: "CLICK_OPEN" });
    expect(next.state).toBe("DESKTOP_INSTALLER_UNCONFIGURED");
  });

  it("HANDSHAKE_SUCCESS always returns DESKTOP_READY", () => {
    const machine: DesktopLaunchMachine = {
      context: baseContext,
      state: "LAUNCHING",
    };
    const next = transitionDesktopLaunch(machine, {
      type: "HANDSHAKE_SUCCESS",
    });
    expect(next.state).toBe("DESKTOP_READY");
  });

  it("HANDSHAKE_TIMEOUT from LAUNCHING goes to LAUNCH_FAILED", () => {
    const machine: DesktopLaunchMachine = {
      context: baseContext,
      state: "LAUNCHING",
    };
    const next = transitionDesktopLaunch(machine, {
      type: "HANDSHAKE_TIMEOUT",
    });
    expect(next.state).toBe("LAUNCH_FAILED");
  });

  it("derives DESKTOP_DETECTED when desktopHealthOk is true", () => {
    const state = deriveInitialState({
      ...baseContext,
      desktopHealthOk: true,
    });
    expect(state).toBe("DESKTOP_DETECTED");
  });

  it("DESKTOP_DETECTED takes priority over DESKTOP_READY", () => {
    const state = deriveInitialState({
      ...baseContext,
      hasAnyInstallerUrl: true,
      desktopHealthOk: true,
    });
    expect(state).toBe("DESKTOP_DETECTED");
  });

  it("CLICK_OPEN from DESKTOP_DETECTED goes to LAUNCHING", () => {
    const machine: DesktopLaunchMachine = {
      context: { ...baseContext, desktopHealthOk: true },
      state: "DESKTOP_DETECTED",
    };
    const next = transitionDesktopLaunch(machine, { type: "CLICK_OPEN" });
    expect(next.state).toBe("LAUNCHING");
  });
});

describe("launchDesktopWithHandshake", () => {
  const originalLocation = window.location;
  const originalEnv = { ...import.meta.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    // @ts-expect-error redefining for test
    delete (window as any).location;
    // @ts-expect-error redefining for test
    window.location = { href: "" } as Location;
    // @ts-expect-error tests podem mutar env
    import.meta.env.VITE_DESKTOP_LAUNCH_ACK_BASE = "";
    window.sessionStorage.clear();
    vi.useFakeTimers();
    // @ts-expect-error fetch é global no ambiente jsdom
    global.fetch = originalFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    window.location = originalLocation;
    Object.assign(import.meta.env, originalEnv);
    // @ts-expect-error fetch é global no ambiente jsdom
    global.fetch = originalFetch;
  });

  it("calls onTimeout when there is no ACK within timeout", () => {
    const onSuccess = vi.fn();
    const onTimeout = vi.fn();

    launchDesktopWithHandshake({
      url: "chefiapp-pos://open?app=tpv",
      moduleId: "tpv",
      restaurantId: "rest-1",
      timeoutMs: 2000,
      onSuccess,
      onTimeout,
    });

    vi.advanceTimersByTime(2100);

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("prefers ACK when VITE_DESKTOP_LAUNCH_ACK_BASE is configured", async () => {
    const onSuccess = vi.fn();
    const onTimeout = vi.fn();

    // @ts-expect-error tests podem mutar env
    import.meta.env.VITE_DESKTOP_LAUNCH_ACK_BASE =
      "http://localhost:4320/desktop/launch-acks";

    const fetchMock = vi
      .fn()
      // Primeiro poll já encontra o ACK
      .mockResolvedValue({
        ok: true,
        json: async () => ({ found: true }),
      } as unknown as Response);

    // @ts-expect-error sobrescrevendo fetch global em teste
    global.fetch = fetchMock;

    launchDesktopWithHandshake({
      url: "chefiapp-pos://open?app=tpv",
      moduleId: "tpv",
      restaurantId: "rest-1",
      timeoutMs: 5000,
      onSuccess,
      onTimeout,
    });

    await vi.runOnlyPendingTimersAsync();

    expect(fetchMock).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("marks ACK backend offline on network error and avoids a second poll", async () => {
    const onSuccess = vi.fn();
    const onTimeout = vi.fn();

    // @ts-expect-error tests podem mutar env
    import.meta.env.VITE_DESKTOP_LAUNCH_ACK_BASE =
      "http://localhost:4320/desktop/launch-acks";

    const fetchMock = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    // @ts-expect-error sobrescrevendo fetch global em teste
    global.fetch = fetchMock;

    launchDesktopWithHandshake({
      url: "chefiapp-pos://open?app=tpv",
      moduleId: "tpv",
      restaurantId: "rest-1",
      timeoutMs: 5000,
      onSuccess,
      onTimeout,
    });

    await vi.runOnlyPendingTimersAsync();

    // Only one network attempt should happen after first connection-refused.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("skips ACK polling during offline cooldown window", async () => {
    const onSuccess = vi.fn();
    const onTimeout = vi.fn();

    // @ts-expect-error tests podem mutar env
    import.meta.env.VITE_DESKTOP_LAUNCH_ACK_BASE =
      "http://localhost:4320/desktop/launch-acks";

    window.sessionStorage.setItem(
      "desktopLaunchAckBackendDownUntil",
      String(Date.now() + 15_000),
    );

    const fetchMock = vi.fn();

    // @ts-expect-error sobrescrevendo fetch global em teste
    global.fetch = fetchMock;

    launchDesktopWithHandshake({
      url: "chefiapp-pos://open?app=tpv",
      moduleId: "tpv",
      restaurantId: "rest-1",
      timeoutMs: 1200,
      onSuccess,
      onTimeout,
    });

    await vi.runOnlyPendingTimersAsync();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
