/**
 * Platform detection utilities — shared between BrowserBlockGuard,
 * ModulesPage, and any code that needs to know the runtime context.
 *
 * Lei O1: PWA standalone ≠ desktop app.
 * Ref: docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md
 */

export function isElectron(): boolean {
  // Consideramos "desktop app" apenas quando o preload expõe electronBridge
  // via contextBridge. Isso distingue o ChefIApp Desktop empacotado de um
  // Electron genérico a correr o Vite/Chrome (onde só o userAgent contém
  // "Electron", mas não existe bridge nem shell oficial).
  if (typeof window === "undefined") return false;
  return !!window.electronBridge;
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
  if (typeof window === "undefined") return false;
  return (
    "ReactNativeWebView" in window ||
    !!(window as { __CHEFIAPP_NATIVE_WEBVIEW__?: boolean })
      .__CHEFIAPP_NATIVE_WEBVIEW__
  );
}

/** Desktop app = Electron or Tauri only. PWA standalone is NOT desktop. */
export function isDesktopApp(): boolean {
  return isElectron() || isTauri();
}

/**
 * Returns true when the app is running inside an installed application.
 * For desktop modules: only Electron/Tauri (not PWA).
 * For mobile AppStaff/Waiter: React Native WebView only (Expo/native app).
 */
export function isInstalledApp(
  requiredPlatform: "desktop" | "mobile",
): boolean {
  if (requiredPlatform === "desktop") return isDesktopApp();
  return isReactNativeWebView();
}

/**
 * Would the BrowserBlockGuard allow this operational module in the current runtime?
 * Use before opening operational windows to avoid showing a blocked popup.
 *
 * - TPV / KDS → require desktop (Electron or Tauri)
 * - AppStaff / Waiter → require React Native WebView (Expo/native app)
 */
export function wouldGuardAllow(moduleId: string): boolean {
  if (moduleId === "appstaff" || moduleId === "waiter") {
    return isReactNativeWebView();
  }
  // TPV / KDS require desktop
  return isDesktopApp();
}

export function getDesktopOS(): "windows" | "macos" {
  if (typeof navigator === "undefined") return "macos";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("windows") || ua.includes("win64") || ua.includes("win32")) {
    return "windows";
  }
  return "macos";
}

export function buildDeepLink(
  moduleId: "tpv" | "kds",
  params?: { restaurant?: string },
): string {
  const query = new URLSearchParams();
  query.set("app", moduleId);
  if (params?.restaurant) {
    query.set("restaurant", params.restaurant);
  }
  return `chefiapp-pos://open?${query.toString()}`;
}
