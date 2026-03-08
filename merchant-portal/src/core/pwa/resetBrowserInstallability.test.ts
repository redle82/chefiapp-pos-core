/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetBrowserInstallability } from "./resetBrowserInstallability";

describe("resetBrowserInstallability", () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<link rel="manifest" href="/manifest.webmanifest" />';
    localStorage.setItem("k", "v");
    sessionStorage.setItem("k", "v");
  });

  it("removes manifest links and clears storages", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations },
    });

    const keys = vi.fn().mockResolvedValue(["a", "b"]);
    const del = vi.fn().mockResolvedValue(true);
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: { keys, delete: del },
    });

    await resetBrowserInstallability();

    expect(document.head.querySelector('link[rel="manifest"]')).toBeNull();
    expect(localStorage.getItem("k")).toBeNull();
    expect(sessionStorage.getItem("k")).toBeNull();
    expect(getRegistrations).toHaveBeenCalledTimes(1);
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(keys).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledTimes(2);
  });
});
