/**
 * @vitest-environment jsdom
 */
/**
 * platformDetection — unit tests
 *
 * Verifies the shared platform detection functions used by
 * BrowserBlockGuard and ModulesPage (UXG-001 gate).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isDesktopApp,
  isElectron,
  isInstalledApp,
  isReactNativeWebView,
  isStandalone,
  isTauri,
  wouldGuardAllow,
} from "./platformDetection";

describe("platformDetection", () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // Default: plain browser (no Electron, no Tauri, no standalone, no RN)
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
    });
    delete (window as Window & { __TAURI__?: unknown }).__TAURI__;
    delete (window as Window & { ReactNativeWebView?: unknown })
      .ReactNativeWebView;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({ matches: false })),
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it("isElectron returns true when userAgent includes Electron", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 Electron/28.0.0",
    });
    expect(isElectron()).toBe(true);
  });

  it("isTauri returns true when __TAURI__ is set", () => {
    (window as Window & { __TAURI__?: unknown }).__TAURI__ = {};
    expect(isTauri()).toBe(true);
  });

  it("isStandalone returns true when display-mode matches", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: q === "(display-mode: standalone)",
      })),
    });
    expect(isStandalone()).toBe(true);
  });

  it("isReactNativeWebView returns true when marker is present", () => {
    (window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView =
      {};
    expect(isReactNativeWebView()).toBe(true);
  });

  it("isDesktopApp returns true for Electron, false for browser", () => {
    expect(isDesktopApp()).toBe(false);
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 Electron/28.0.0",
    });
    expect(isDesktopApp()).toBe(true);
  });

  it("isInstalledApp('desktop') matches isDesktopApp", () => {
    expect(isInstalledApp("desktop")).toBe(false);
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 Electron/28.0.0",
    });
    expect(isInstalledApp("desktop")).toBe(true);
  });

  it("isInstalledApp('mobile') matches RN or standalone", () => {
    expect(isInstalledApp("mobile")).toBe(false);
    (window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView =
      {};
    expect(isInstalledApp("mobile")).toBe(true);
  });

  // --- wouldGuardAllow ---

  it("wouldGuardAllow('tpv') returns false in plain browser", () => {
    expect(wouldGuardAllow("tpv")).toBe(false);
  });

  it("wouldGuardAllow('tpv') returns true in Electron", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 Electron/28.0.0",
    });
    expect(wouldGuardAllow("tpv")).toBe(true);
  });

  it("wouldGuardAllow('kds') returns false in browser", () => {
    expect(wouldGuardAllow("kds")).toBe(false);
  });

  it("wouldGuardAllow('appstaff') returns false in browser", () => {
    expect(wouldGuardAllow("appstaff")).toBe(false);
  });

  it("wouldGuardAllow('appstaff') returns true in RN WebView", () => {
    (window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView =
      {};
    expect(wouldGuardAllow("appstaff")).toBe(true);
  });

  it("wouldGuardAllow('appstaff') returns false in Electron (desktop ≠ mobile)", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 Electron/28.0.0",
    });
    expect(wouldGuardAllow("appstaff")).toBe(false);
  });
});
