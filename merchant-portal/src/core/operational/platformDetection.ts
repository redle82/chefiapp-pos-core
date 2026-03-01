/**
 * Platform detection utilities — shared between BrowserBlockGuard,
 * ModulesPage, and any code that needs to know the runtime context.
 *
 * Lei O1: PWA standalone ≠ desktop app.
 * Ref: docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md
 */

export function isElectron(): boolean {
  return (
    typeof navigator !== "undefined" && navigator.userAgent.includes("Electron")
  );
}

export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as { __TAURI__?: unknown }).__TAURI__
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function isReactNativeWebView(): boolean {
  return typeof window !== "undefined" && "ReactNativeWebView" in window;
}

/** Desktop app = Electron or Tauri only. PWA standalone is NOT desktop. */
export function isDesktopApp(): boolean {
  return isElectron() || isTauri();
}

/**
 * Returns true when the app is running inside an installed application.
 * For desktop modules: only Electron/Tauri (not PWA).
 * For mobile: React Native or standalone (mobile PWA).
 */
export function isInstalledApp(
  requiredPlatform: "desktop" | "mobile",
): boolean {
  if (requiredPlatform === "desktop") return isDesktopApp();
  return isReactNativeWebView() || isStandalone();
}

/**
 * Would the BrowserBlockGuard allow this operational module in the current runtime?
 * Use before opening operational windows to avoid showing a blocked popup.
 *
 * - TPV / KDS → require desktop (Electron or Tauri)
 * - AppStaff  → require mobile (React Native WebView or standalone PWA)
 */
export function wouldGuardAllow(moduleId: string): boolean {
  if (moduleId === "appstaff") {
    return isReactNativeWebView() || isStandalone();
  }
  // TPV / KDS require desktop
  return isDesktopApp();
}
