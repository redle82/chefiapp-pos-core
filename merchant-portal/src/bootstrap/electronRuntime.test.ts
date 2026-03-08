import { describe, expect, it, vi } from "vitest";
import {
  detectElectronRuntime,
  installServiceWorkerAutoReload,
} from "./electronRuntime";

describe("electronRuntime", () => {
  it("detects Electron via user agent", () => {
    expect(
      detectElectronRuntime({
        navigatorObj: { userAgent: "Mozilla/5.0 Electron/31.0" },
        windowObj: {},
      }),
    ).toBe(true);
  });

  it("detects Electron via injected bridge", () => {
    expect(
      detectElectronRuntime({
        navigatorObj: { userAgent: "Mozilla/5.0" },
        windowObj: { electronBridge: {} },
      }),
    ).toBe(true);
  });

  it("registers service worker reload handler outside Electron", () => {
    const reload = vi.fn();
    const addEventListener = vi.fn((event, listener: () => void) => {
      expect(event).toBe("controllerchange");
      listener();
    });
    const log = { log: vi.fn() };

    installServiceWorkerAutoReload({
      isElectronRuntime: false,
      navigatorObj: { serviceWorker: { addEventListener } },
      windowObj: { location: { reload } },
      log,
    });

    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(log.log).toHaveBeenCalledWith(
      "[ChefIApp] New service worker activated — reloading...",
    );
  });
});
