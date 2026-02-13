import "./config"; // Load first so CONFIG is ready before any chunk (avoids "Cannot access before initialization")
import "@chefiapp/core-design-system/tokens.css";
import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GlobalUIStateProvider } from "./context/GlobalUIStateContext";
import {
  LifecycleStateProvider,
  type LifecycleStateContextValue,
} from "./context/LifecycleStateContext";
import { RestaurantRuntimeProvider } from "./context/RestaurantRuntimeContext";
import type { RestaurantLifecycleState } from "./core/lifecycle/LifecycleState";
import { Logger } from "./core/logger";
import { RoleProvider } from "./core/roles";
import { logRuntimeStatus } from "./core/runtime/RuntimeContext";
import { devStableReason, isDevStableMode } from "./core/runtime/devStableMode";
import { ShiftProvider } from "./core/shift/ShiftContext";
import { TenantProvider } from "./core/tenant/TenantContext";
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

// STABLE_MODE banner (single-line, deterministic) — só em builds não-produção
if (import.meta.env.DEV) {
  console.info(
    `[STABLE_MODE] ${isDevStableMode() ? "ON" : "OFF"} (${devStableReason()})`,
  );
}

// Se um Service Worker anterior ainda estiver registado, pode interceptar rotas e gerar ruído.
// Em STABLE_MODE (localhost) desregistamos SWs para evitar loops.
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
        "[SW] Cleanup: service workers unregistered and caches cleared",
      );
    } catch (e) {
      console.warn("[SW] Cleanup failed (non-fatal):", e);
    }
  })();
}

// DOCKER CORE: Kernel e Projection Effects removidos
// Core gerencia persistência diretamente via RPCs e triggers do PostgreSQL

Logger.info("Application starting", {
  version: "1.0.0",
  environment: import.meta.env.MODE === "production" ? "production" : "local",
});

// ============================================================================
// APPLICATION_BOOT_CONTRACT: Runtime/Shift só para MANAGEMENT e OPERATIONAL
// ============================================================================
// MARKETING (/, /trial, /auth, /billing/success) renderiza SEM RestaurantRuntime
// nem ShiftProvider — landing 100% desacoplada do Core (ver App.tsx).
// Estado do lifecycle no entry evita duas instâncias de React (Invalid hook call).
// ============================================================================

function RootWithLifecycle() {
  const [lifecycleState, setLifecycleState] =
    useState<RestaurantLifecycleState | null>(null);
  const setter = useCallback((s: RestaurantLifecycleState | null) => {
    setLifecycleState(s);
  }, []);
  const lifecycleValue: LifecycleStateContextValue = {
    lifecycleState,
    setLifecycleState: setter,
  };
  return (
    <LifecycleStateProvider value={lifecycleValue}>
      <RestaurantRuntimeProvider>
        <ShiftProvider>
          <GlobalUIStateProvider>
            <RoleProvider>
              <TenantProvider>
                <App />
              </TenantProvider>
            </RoleProvider>
          </GlobalUIStateProvider>
        </ShiftProvider>
      </RestaurantRuntimeProvider>
    </LifecycleStateProvider>
  );
}

// Render imediato — a página deve carregar mesmo sem Core (landing-only).
// O probe de tabelas opcionais corre em background para não bloquear nem causar tela branca.
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary context="Root">
        <BrowserRouter>
          <RootWithLifecycle />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  );
}

// Probe optional Core tables (gm_reservations, gm_customers) em background.
(async () => {
  try {
    const { probeOptionalTables } = await import(
      "./core/infra/dockerCoreFetchClient"
    );
    await probeOptionalTables();
  } catch {
    // Non-fatal: Core may be down or tables may exist
  }
})();

// DOCKER CORE: Kernel init removido - Core gerencia seu próprio estado
// const initKernel = async () => { ... }; // REMOVIDO

// ─── InsForge Validation (DEV helper) ───────────────────────────────────────
// Expose validation function to browser console for testing InsForge setup.
// Usage: Open console and run: await validateInsforge()
if (import.meta.env.DEV && typeof window !== "undefined") {
  import("./core/infra/validateInsforgeSetup").then((module) => {
    (window as any).validateInsforge = module.runValidation;
    console.info(
      "💡 InsForge validation available: Type 'validateInsforge()' in console",
    );
  });
}
