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

import { Outlet } from "react-router-dom";
import { isDesktopApp } from "../../core/operational/platformDetection";

export function ElectronAdminGuard() {
  // In browser context, admin routes render normally.
  if (!isDesktopApp()) {
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
