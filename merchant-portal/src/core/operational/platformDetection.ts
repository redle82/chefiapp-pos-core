/**
 * Platform detection utilities — shared between BrowserBlockGuard,
 * ModulesPage, and any code that needs to know the runtime context.
 *
 * Lei O1: PWA standalone ≠ desktop app.
 * Ref: docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md
 */

/** UserAgent que o main do Electron define (main.ts setUserAgent). Fallback se preload não injetar bridge. */
const CHEFIAPP_DESKTOP_UA = "ChefIApp-Desktop";

/** Só emitir [CHEFIAPP_DEBUG] quando flag explícita (env ou query). Evita ruído no browser normal. */
function isChefiappDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const env = (import.meta.env.VITE_CHEFIAPP_DEBUG ?? "").toString().trim();
  if (/^(1|true|yes|on)$/i.test(env)) return true;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("chefiapp_debug") === "1") return true;
  } catch {
    // ignore
  }
  return false;
}

/** Marcador de build: prova no runtime que o frontend tem guard instrumentado. Se undefined = build antigo. */
if (typeof window !== "undefined") {
  (window as Window & { __CHEFIAPP_FRONTEND_BUILD?: { guardInstrumented: boolean; guardVersion: number; loadedAt: string } })
    .__CHEFIAPP_FRONTEND_BUILD = {
    guardInstrumented: true,
    guardVersion: 2,
    loadedAt: new Date().toISOString(),
  };
}

/**
 * Instrumentação temporária: diagnóstico completo no runtime para provar por que o guard bloqueia ou não.
 * Expõe window.__CHEFIAPP_DEBUG_DESKTOP() para inspeção na consola.
 */
export function logDesktopDetectionIfAdmin(): void {
  if (typeof window === "undefined") return;
  const pathname = window.location?.pathname ?? "";
  const hash = window.location?.hash ?? "";
  const href = window.location?.href ?? "";
  const protocol = window.location?.protocol ?? "";
  const isAdminRoute =
    pathname.startsWith("/admin") || hash.includes("/admin");
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const hasBridge = !!(window as Window & { electronBridge?: unknown }).electronBridge;
  const uaHasDesktop = ua.includes(CHEFIAPP_DESKTOP_UA);
  const looksLikeElectron = ua.includes("Electron");
  const isFileProtocol = protocol === "file:";
  const isElectronResult = hasBridge || uaHasDesktop;
  const isDesktopResult = isElectronResult || isTauri();
  const blockAdmin =
    isDesktopResult ||
    (isAdminRoute && looksLikeElectron) ||
    (isAdminRoute && isFileProtocol);

  (window as Window & { __CHEFIAPP_DEBUG_DESKTOP?: () => Record<string, unknown> }).__CHEFIAPP_DEBUG_DESKTOP =
    () => ({
      userAgent: ua,
      hasElectronBridge: hasBridge,
      userAgentIncludesChefIAppDesktop: uaHasDesktop,
      userAgentIncludesElectron: looksLikeElectron,
      isElectron: isElectron(),
      isDesktopApp: isDesktopApp(),
      pathname,
      hash,
      href,
      protocol,
      isFileProtocol,
      isAdminRoute,
      guardBlocksAdmin: blockAdmin,
    });

  // Só logar em rotas admin e quando a flag de debug está activa (evita ruído no browser).
  if (!isAdminRoute || !isChefiappDebugEnabled()) return;

  const payload = {
    pathname,
    hash: hash.slice(0, 120),
    href: href.slice(0, 150),
    protocol,
    isFileProtocol,
    navigator_userAgent: ua.slice(0, 100) + (ua.length > 100 ? "…" : ""),
    hasElectronBridge: hasBridge,
    userAgentIncludesChefIAppDesktop: uaHasDesktop,
    userAgentIncludesElectron: looksLikeElectron,
    isElectron: isElectronResult,
    isDesktopApp: isDesktopResult,
    guardBlocksAdmin: blockAdmin,
  };
  console.warn("[CHEFIAPP_DEBUG] ElectronAdminGuard — diagnóstico runtime", payload);

  if (!blockAdmin) {
    console.warn(
      "[CHEFIAPP_DEBUG] LEAK: guard NÃO bloqueou — Admin vai renderizar. Causa provável: isDesktopApp=false e userAgent sem 'Electron'. Confirme na consola: __CHEFIAPP_DEBUG_DESKTOP()",
      payload,
    );
  }
}

export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  // 0) Main do Electron injeta isto em did-finish-load — prova inequívoca (não falsificável pelo frontend).
  const w = window as Window & { __CHEFIAPP_ELECTRON?: boolean };
  if (w.__CHEFIAPP_ELECTRON === true) return true;
  // 1) Preload expõe electronBridge via contextBridge (fonte canónica).
  if (window.electronBridge) return true;
  // 2) Fallback: main do Electron define userAgent "ChefIApp-Desktop".
  if (typeof navigator !== "undefined" && navigator.userAgent.includes(CHEFIAPP_DESKTOP_UA)) {
    return true;
  }
  return false;
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
