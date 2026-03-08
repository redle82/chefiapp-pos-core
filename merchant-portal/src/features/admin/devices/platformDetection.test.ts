/**
 * @vitest-environment jsdom
 *
 * platformDetection — unit tests for getDesktopOS() and buildDeepLink()
 * Validates desktop OS detection and chefiapp:// deep link construction.
 */
import { describe, expect, it, vi } from "vitest";

describe("platformDetection", () => {
  describe("getDesktopOS", () => {
    it("returns 'macos' for Mac UA", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
      });
      // Fresh import to avoid caching
      const { getDesktopOS } = await import(
        "../../../core/operational/platformDetection"
      );
      expect(getDesktopOS()).toBe("macos");
      vi.unstubAllGlobals();
    });

    it("returns 'windows' for Windows UA", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        platform: "Win32",
      });
      const { getDesktopOS } = await import(
        "../../../core/operational/platformDetection"
      );
      expect(getDesktopOS()).toBe("windows");
      vi.unstubAllGlobals();
    });

    it("returns 'linux' for Linux UA", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
        platform: "Linux x86_64",
      });
      const { getDesktopOS } = await import(
        "../../../core/operational/platformDetection"
      );
      expect(getDesktopOS()).toBe("linux");
      vi.unstubAllGlobals();
    });
  });

  describe("buildDeepLink", () => {
    it("constructs a chefiapp:// URL for TPV", async () => {
      const { buildDeepLink } = await import(
        "../../../core/operational/platformDetection"
      );
      const url = buildDeepLink("tpv", { restaurant: "rest-123" });
      expect(url).toBe("chefiapp://open?app=tpv&restaurant=rest-123");
    });

    it("constructs a chefiapp:// URL for KDS", async () => {
      const { buildDeepLink } = await import(
        "../../../core/operational/platformDetection"
      );
      const url = buildDeepLink("kds", { restaurant: "abc-xyz" });
      expect(url).toBe("chefiapp://open?app=kds&restaurant=abc-xyz");
    });

    it("handles extra params", async () => {
      const { buildDeepLink } = await import(
        "../../../core/operational/platformDetection"
      );
      const url = buildDeepLink("tpv", {
        restaurant: "r1",
        token: "tok-999",
      });
      expect(url).toContain("app=tpv");
      expect(url).toContain("restaurant=r1");
      expect(url).toContain("token=tok-999");
    });
  });
});
