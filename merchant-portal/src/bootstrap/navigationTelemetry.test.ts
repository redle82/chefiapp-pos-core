import { describe, expect, it, vi } from "vitest";
import { initNavigationTelemetry } from "./navigationTelemetry";

describe("navigationTelemetry", () => {
  it("records a page_view when pushState changes the path", () => {
    const increment = vi.fn();
    const listeners: Record<string, () => void> = {};
    const windowObj = {
      location: { pathname: "/admin" },
      addEventListener: vi.fn((event: "popstate", listener: () => void) => {
        listeners[event] = listener;
      }),
    };
    const historyObj = {
      pushState: vi.fn(() => {
        windowObj.location.pathname = "/admin/devices";
      }),
    };

    initNavigationTelemetry({
      metrics: {
        increment,
        distribution: vi.fn(),
        gauge: vi.fn(),
      },
      isElectronRuntime: false,
      windowObj,
      historyObj,
    });

    historyObj.pushState({}, "", "/admin/devices");

    expect(increment).toHaveBeenCalledWith("navigation.page_view", 1, {
      tags: { from: "/admin", to: "/admin/devices" },
    });
    expect(windowObj.addEventListener).toHaveBeenCalledTimes(1);
    expect(typeof listeners.popstate).toBe("function");
  });
});
