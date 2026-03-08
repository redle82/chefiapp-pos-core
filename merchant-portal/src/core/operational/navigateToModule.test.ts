import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildModuleDeepLink,
  buildModulePath,
  navigateToModule,
} from "./navigateToModule";

vi.mock("./platformDetection", () => ({
  wouldGuardAllow: vi.fn(),
}));

import { wouldGuardAllow } from "./platformDetection";

describe("navigateToModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("builds canonical module paths", () => {
    expect(buildModulePath("tpv")).toBe("/op/tpv");
    expect(buildModulePath("kds")).toBe("/op/kds");
    expect(buildModulePath("appstaff")).toBe("/app/staff/home");
    expect(buildModulePath("tpv", "mode=trial")).toBe("/op/tpv?mode=trial");
  });

  it("builds deep links with encoded path", () => {
    expect(buildModuleDeepLink("tpv", "mode=trial")).toBe(
      "chefiapp-pos://open?app=tpv&path=%2Fop%2Ftpv%3Fmode%3Dtrial",
    );
  });

  it("navigates directly when guard allows module in runtime", () => {
    vi.mocked(wouldGuardAllow).mockReturnValue(true);

    const navigate = vi.fn();
    const openExternalUrl = vi.fn();

    navigateToModule("tpv", { navigate, openExternalUrl });

    expect(navigate).toHaveBeenCalledWith("/op/tpv");
    expect(openExternalUrl).not.toHaveBeenCalled();
  });

  it("attempts deeplink and executes fallback in browser context", () => {
    vi.useFakeTimers();
    vi.mocked(wouldGuardAllow).mockReturnValue(false);

    const openExternalUrl = vi.fn();
    const onBrowserBlocked = vi.fn();
    const onBrowserFallback = vi.fn();

    navigateToModule("tpv", {
      searchParams: "mode=trial",
      openExternalUrl,
      onBrowserBlocked,
      onBrowserFallback,
      fallbackDelayMs: 1500,
    });

    expect(onBrowserBlocked).toHaveBeenCalledTimes(1);
    expect(openExternalUrl).toHaveBeenCalledWith(
      "chefiapp-pos://open?app=tpv&path=%2Fop%2Ftpv%3Fmode%3Dtrial",
    );

    vi.advanceTimersByTime(1499);
    expect(onBrowserFallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onBrowserFallback).toHaveBeenCalledTimes(1);
  });
});
