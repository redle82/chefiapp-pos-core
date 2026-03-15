/**
 * ElectronAdminGuard — Route-level guard that blocks admin routes from
 * rendering inside Electron/Tauri desktop operational windows.
 *
 * Admin routes (e.g. /admin/modules, /admin/devices) must ONLY render in
 * a browser context. When the app is running inside Electron, any admin
 * route attempt is blocked and the user sees a "close window" CTA with
 * instructions to use the browser portal.
 *
 * This is the inverse of BrowserBlockGuard: that one blocks browser access
 * to operational modules; this one blocks desktop access to admin modules.
 *
 * @see docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md
 */

import { Outlet, useLocation } from "react-router-dom";
import {
  isDesktopApp,
  logDesktopDetectionIfAdmin,
} from "../../core/operational/platformDetection";

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

export function ElectronAdminGuard() {
  const location = useLocation();
  const routerPathname = location.pathname ?? "";
  const routerHash = location.hash ?? "";

  const isDesktop = isDesktopApp();
  const pathname = typeof window !== "undefined" ? window.location?.pathname ?? "" : "";
  const hash = typeof window !== "undefined" ? window.location?.hash ?? "" : "";
  const protocol = typeof window !== "undefined" ? window.location?.protocol ?? "" : "";
  const isAdminPath =
    routerPathname.startsWith("/admin") ||
    routerPathname.includes("/admin") ||
    pathname.startsWith("/admin") ||
    hash.includes("/admin");
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const looksLikeElectron = ua.includes("Electron");
  const isFileProtocol = protocol === "file:";
  const electronInjected = typeof window !== "undefined" && (window as Window & { __CHEFIAPP_ELECTRON?: boolean }).__CHEFIAPP_ELECTRON === true;
  const blockAdmin =
    isDesktop ||
    electronInjected ||
    (isAdminPath && looksLikeElectron) ||
    (isAdminPath && isFileProtocol);

  // Diagnóstico só quando flag explícita (VITE_CHEFIAPP_DEBUG ou ?chefiapp_debug=1).
  logDesktopDetectionIfAdmin();
  if (typeof window !== "undefined" && isChefiappDebugEnabled()) {
    const payload = {
      guardMounted: true,
      routerPathname,
      routerHash,
      windowPathname: pathname,
      windowHash: hash.slice(0, 80),
      isAdminPath,
      hasElectronBridge: !!(window as Window & { electronBridge?: unknown }).electronBridge,
      userAgentIncludesElectron: looksLikeElectron,
      protocol,
      isFileProtocol,
      isDesktop,
      blockAdmin,
    };
    console.warn("[CHEFIAPP_DEBUG] ElectronAdminGuard montado", payload);
    (window as Window & { __CHEFIAPP_DEBUG_GUARD_LAST?: unknown }).__CHEFIAPP_DEBUG_GUARD_LAST =
      payload;
  }

  if (!blockAdmin) {
    return <Outlet />;
  }

  // Block: desktop context — admin routes must not render here.
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
        color: "#fff",
        padding: 32,
        textAlign: "center",
      }}
      data-chefiapp-os="electron-admin-guard"
      data-testid="electron-admin-guard"
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Área de administração
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#94a3b8",
          maxWidth: 420,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        As configurações de administração não estão disponíveis dentro da
        aplicação operacional. Aceda ao portal de gestão no seu navegador para
        alterar configurações.
      </p>
      <button
        type="button"
        onClick={() => window.close()}
        style={{
          padding: "12px 24px",
          backgroundColor: "#fff",
          color: "#000",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Fechar janela
      </button>
      <p
        style={{
          fontSize: 11,
          color: "#475569",
          marginTop: 16,
        }}
      >
        🛡️ Regra de isolamento — admin só no browser
      </p>
    </div>
  );
}
