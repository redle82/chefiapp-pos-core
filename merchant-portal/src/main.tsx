import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Logger } from "./core/logger";
import { performanceMonitor } from "./core/monitoring/performanceMonitor";
import { devStableReason, isDevStableMode } from "./core/runtime/devStableMode";
import { logRuntimeStatus } from "./core/runtime/RuntimeContext";
import "./index.css";
import { ErrorBoundary } from "./ui/design-system/ErrorBoundary";
import "./ui/design-system/styles/dark-mode.css"; // P3-5: Dark mode styles

import { Buffer } from "buffer";

// Polyfill Buffer for browser (Critical for TPV/Stripe)
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
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

// Initialize monitoring
import { registerEffect } from "../../core-engine/effects";
import {
  persistCloseCashRegister,
  persistOpenCashRegister,
} from "./core/sovereignty/CashRegisterProjection";
import {
  persistInventoryCount,
  persistStockDeduction,
  persistStockRestock,
} from "./core/sovereignty/InventoryProjection";
import {
  persistOrder,
  persistOrderItem,
  persistOrderStatus,
  persistPayment,
} from "./core/sovereignty/OrderProjection";
import {
  persistProduct,
  persistProductArchive,
} from "./core/sovereignty/ProductProjection";
import { persistTableStatus } from "./core/sovereignty/TableProjection";

// KERNEL INTEGRATION
import { BootstrapKernel, SystemStateProvider } from "./core/kernel";

// SOVEREIGNTY: Register Projection Effects (Link Kernel -> DB)
registerEffect("persistOrder", persistOrder);
registerEffect("persistOrderItem", persistOrderItem);
registerEffect("persistOrderStatus", persistOrderStatus);
registerEffect("persistPayment", persistPayment);
registerEffect("persistProduct", persistProduct);
registerEffect("persistProductArchive", persistProductArchive);
registerEffect("persistStockDeduction", persistStockDeduction);
registerEffect("persistInventoryCount", persistInventoryCount);
registerEffect("persistStockRestock", persistStockRestock);
registerEffect("persistTableStatus", persistTableStatus);
registerEffect("persistOpenCashRegister", persistOpenCashRegister);
registerEffect("persistCloseCashRegister", persistCloseCashRegister);

Logger.info("Application starting", {
  version: "1.0.0",
  environment: import.meta.env.MODE,
});

// ============================================================================
// 🔒 SOVEREIGN BOOT SEQUENCE — RENDER FIRST, VALIDATE AFTER
// ============================================================================
// RULE: UI renders IMMEDIATELY. Kernel runs in background.
// This ensures:
// 1. User always sees UI (even if degraded)
// 2. No async blocks the first paint
// 3. Health checks run after render, update state reactively
// ============================================================================

const BOOT_START = performance.now();

// 🚀 RENDER FIRST — UNCONDITIONALLY
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary context="Root">
      <SystemStateProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SystemStateProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// 🔧 KERNEL INIT — BACKGROUND (NON-BLOCKING)
// Fire-and-forget in DEV, await in PROD only if critical
const initKernel = async () => {
  try {
    const result = await BootstrapKernel.init({
      skipHealthChecks: import.meta.env.DEV,
    });

    const bootDuration = performance.now() - BOOT_START;
    performanceMonitor.recordMetric({
      name: "kernel_boot",
      value: bootDuration,
      unit: "ms",
      timestamp: new Date().toISOString(),
    });

    const isProd = result.state.environment === "prod";
    const isFatal = result.state.kernel === "FAILED";

    // 🛑 KERNEL PANIC — PRODUCTION ONLY (Show overlay, don't crash)
    if (isProd && isFatal) {
      Logger.critical("⛔ KERNEL PANIC: Production integrity check failed", {
        errors: result.errors,
      });
      // In production, we could show a maintenance overlay here
      // But we never prevent the UI from loading
    }

    // ⚠️ DEV WARNINGS (Log only, don't block)
    if (!isProd && isFatal) {
      console.error(
        "⚠️ [DEV] KERNEL FAILED CHECKS (Bypassed due to DEV env):",
        result.errors,
      );
    }

    if (result.warnings.length > 0) {
      console.warn("[Kernel] Warnings:", result.warnings);
    }

    console.info(
      `[Kernel] Boot complete in ${bootDuration.toFixed(0)}ms`,
      result.state.kernel,
    );
  } catch (error: any) {
    // 🛡️ NEVER CRASH THE APP — Log and degrade gracefully
    Logger.error("🔥 Kernel init failed (non-fatal)", error);
    console.error("[Kernel] Init failed but app continues:", error.message);
  }
};

// Execute kernel init in background
initKernel();
