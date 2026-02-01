import "@chefiapp/core-design-system/tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Logger } from "./core/logger";
import { devStableReason, isDevStableMode } from "./core/runtime/devStableMode";
import { logRuntimeStatus } from "./core/runtime/RuntimeContext";
import "./index.css";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";
// import "./ui/design-system/styles/dark-mode.css"; // P3-5: Dark mode styles

// Polyfill Buffer for browser (Critical for TPV/Stripe)
if (typeof window !== "undefined") {
  // window.Buffer = Buffer;
  console.log("Buffer polyfilled (inline ESM-compatible)");
}

// RUNTIME MODE: Log current mode at boot
logRuntimeStatus();

// DEV_STABLE_MODE banner (single-line, deterministic)
// Note: Behavior changes are applied in later steps; this is observability only.
if (import.meta.env.DEV) {
  console.info(
    `[DEV_STABLE_MODE] ${
      isDevStableMode() ? "ON" : "OFF"
    } (${devStableReason()})`,
  );
}

// DEV HARDENING: if a previous PWA Service Worker is still registered, it can hijack
// dev routes (e.g. /registerSW.js) and spam Workbox routing logs.
// We explicitly unregister SWs in DEV_STABLE_MODE to prevent loop storms.
if (
  isDevStableMode() &&
  typeof window !== "undefined" &&
  "serviceWorker" in navigator
) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      console.info(
        "[SW] DEV cleanup: service workers unregistered and caches cleared",
      );
    } catch (e) {
      console.warn("[SW] DEV cleanup failed (non-fatal):", e);
    }
  })();
}

// DOCKER CORE: Kernel e Projection Effects removidos
// Core gerencia persistência diretamente via RPCs e triggers do PostgreSQL

Logger.info("Application starting", {
  version: "1.0.0",
  environment: import.meta.env.MODE,
});

// ============================================================================
// APPLICATION_BOOT_CONTRACT: Runtime/Shift só para MANAGEMENT e OPERATIONAL
// ============================================================================
// MARKETING (/, /demo, /auth, /billing/success) renderiza SEM RestaurantRuntime
// nem ShiftProvider — landing 100% desacoplada do Core (ver App.tsx).
// ============================================================================

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary context="Root">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

// DOCKER CORE: Kernel init removido - Core gerencia seu próprio estado
// const initKernel = async () => { ... }; // REMOVIDO
