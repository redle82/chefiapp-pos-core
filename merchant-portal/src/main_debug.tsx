import "@chefiapp/core-design-system/tokens.css";
import * as Sentry from "@sentry/react";
import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./config"; // Load first so CONFIG is ready before any chunk (avoids "Cannot access before initialization")
import {
  LifecycleStateProvider,
  type LifecycleStateContextValue,
} from "./context/LifecycleStateContext";
import type { RestaurantLifecycleState } from "./core/lifecycle/LifecycleState";
import { Logger } from "./core/logger";
import { logRuntimeStatus } from "./core/runtime/RuntimeContext";
import { devStableReason, isDevStableMode } from "./core/runtime/devStableMode";
import { installUnhandledRejectionGuard } from "./core/runtime/unhandledRejectionGuard";
import "./i18n";
import "./index.css";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";
// import "./ui/design-system/styles/dark-mode.css"; // P3-5: Dark mode styles

// ─── Build Version Stamp ────────────────────────────────────────────────────
// Visible in console to confirm which deploy is active.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const __BUILD_TIMESTAMP__: string | undefined;
const BUILD_STAMP = `chefiapp-build:${import.meta.env.MODE}:${
  __BUILD_TIMESTAMP__ ?? "dev"
}`;
console.log(`%c[ChefIApp] ${BUILD_STAMP}`, "color: #f59e0b; font-weight: bold");

installUnhandledRejectionGuard({
  route: typeof window !== "undefined" ? window.location.pathname : "unknown",
  mode: import.meta.env.MODE,
});

// ─── Service Worker Auto-Reload ─────────────────────────────────────────────
// When a new SW takes control (skipWaiting + clientsClaim), auto-reload so
// critical fixes propagate immediately without user interaction.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("[ChefIApp] New service worker activated — reloading...");
    window.location.reload();
  });
}

Sentry.init({
  dsn: "https://c507891630be22946aae6f4dc35daa2b@o4509651128942592.ingest.us.sentry.io/4510930062475264",
  environment:
    import.meta.env.MODE === "production" ? "production" : "development",
  release:
    import.meta.env.VITE_SENTRY_RELEASE ||
    `merchant-portal@${import.meta.env.MODE}`,
  sendDefaultPii: true,
  // Performance Monitoring — captura transações/spans automaticamente
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
  // Session Replay — grava sessões para debug visual
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});

// ─── Sentry Real-World Metrics ──────────────────────────────────────────────
// Métricas reais que simulam comportamento de produção com clientes
// Visíveis em: https://goldmonkeystudio.sentry.io/explore/metrics/
// Safe wrapper: algumas versões do Sentry não exportam metrics.increment/distribution/gauge.
const safeMetrics = {
  increment:
    typeof Sentry.metrics?.increment === "function"
      ? Sentry.metrics.increment.bind(Sentry.metrics)
      : () => {},
  distribution:
    typeof Sentry.metrics?.distribution === "function"
      ? Sentry.metrics.distribution.bind(Sentry.metrics)
      : () => {},
  gauge:
    typeof Sentry.metrics?.gauge === "function"
      ? Sentry.metrics.gauge.bind(Sentry.metrics)
      : () => {},
};

// 1) Boot metric — marca que a app iniciou
safeMetrics.increment("app.boot", 1, { tags: { entry: "main_debug" } });

// 2) Web Vitals via PerformanceObserver — métricas reais de performance
if (typeof window !== "undefined" && "PerformanceObserver" in window) {
  // Track LCP (Largest Contentful Paint)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        safeMetrics.distribution("web_vital.lcp", last.startTime, {
          unit: "millisecond",
          tags: { route: window.location.pathname },
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* browser may not support */
  }

  // Track FCP (First Contentful Paint)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          safeMetrics.distribution("web_vital.fcp", entry.startTime, {
            unit: "millisecond",
            tags: { route: window.location.pathname },
          });
        }
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });
  } catch {
    /* browser may not support */
  }

  // Track CLS (Cumulative Layout Shift)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      safeMetrics.gauge("web_vital.cls", clsValue, {
        tags: { route: window.location.pathname },
      });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  } catch {
    /* browser may not support */
  }

  // Track navigation timing (page load total)
  window.addEventListener("load", () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (nav) {
        safeMetrics.distribution(
          "page.load_time",
          nav.loadEventEnd - nav.startTime,
          {
            unit: "millisecond",
            tags: { route: window.location.pathname },
          },
        );
        safeMetrics.distribution(
          "page.dom_interactive",
          nav.domInteractive - nav.startTime,
          {
            unit: "millisecond",
            tags: { route: window.location.pathname },
          },
        );
        safeMetrics.distribution(
          "page.ttfb",
          nav.responseStart - nav.requestStart,
          {
            unit: "millisecond",
            tags: { route: window.location.pathname },
          },
        );
      }
    }, 0);
  });
}

// 3) Track client-side navigation (SPA route changes)
if (typeof window !== "undefined") {
  let lastPath = window.location.pathname;
  const origPushState = history.pushState.bind(history);
  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    origPushState(...args);
    const newPath = window.location.pathname;
    if (newPath !== lastPath) {
      safeMetrics.increment("navigation.page_view", 1, {
        tags: { from: lastPath, to: newPath },
      });
      lastPath = newPath;
    }
  };
  window.addEventListener("popstate", () => {
    const newPath = window.location.pathname;
    if (newPath !== lastPath) {
      safeMetrics.increment("navigation.page_view", 1, {
        tags: { from: lastPath, to: newPath },
      });
      lastPath = newPath;
    }
  });
}

// 4) Track global clicks (simula button_click real)
if (typeof window !== "undefined") {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName?.toLowerCase();
    if (
      tag === "button" ||
      tag === "a" ||
      target.closest("button") ||
      target.closest("a")
    ) {
      const label =
        target.textContent?.trim().slice(0, 30) ||
        target.getAttribute("aria-label") ||
        "unknown";
      safeMetrics.increment("ui.button_click", 1, {
        tags: {
          element: tag,
          label,
          route: window.location.pathname,
        },
      });
    }
  });
}

// 5) Track fetch/XHR response times (API call metrics reais)
if (typeof window !== "undefined") {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const start = performance.now();
    try {
      const response = await origFetch(...args);
      const duration = performance.now() - start;
      const url =
        typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      const path = new URL(url, window.location.origin).pathname;
      safeMetrics.distribution("http.request_duration", duration, {
        unit: "millisecond",
        tags: {
          method: (args[1]?.method || "GET").toUpperCase(),
          status: String(response.status),
          path: path.length > 50 ? path.slice(0, 50) : path,
        },
      });
      if (!response.ok) {
        safeMetrics.increment("http.error", 1, {
          tags: { status: String(response.status), path },
        });
      }
      return response;
    } catch (err) {
      const duration = performance.now() - start;
      safeMetrics.distribution("http.request_duration", duration, {
        unit: "millisecond",
        tags: {
          method: (args[1]?.method || "GET").toUpperCase(),
          status: "network_error",
        },
      });
      safeMetrics.increment("http.error", 1, {
        tags: { status: "network_error" },
      });
      throw err;
    }
  };
}

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
// PR-A: Providers Core-dependentes (RestaurantRuntimeProvider, ShiftProvider,
// GlobalUIStateProvider, RoleProvider, TenantProvider) movidos para
// AppOperationalWrapper em App.tsx. Rotas públicas NÃO montam nada do Core.
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
      <App />
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
