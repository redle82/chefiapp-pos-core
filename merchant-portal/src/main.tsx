import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './ui/design-system/styles/dark-mode.css' // P3-5: Dark mode styles
import { ErrorBoundary } from './ui/design-system/ErrorBoundary'
import { Logger } from './core/logger'
import { performanceMonitor } from './core/monitoring/performanceMonitor'
import { isDevStableMode, devStableReason } from './core/runtime/devStableMode'
import { logRuntimeStatus } from './core/runtime/RuntimeContext'

import { Buffer } from 'buffer';

// Polyfill Buffer for browser (Critical for TPV/Stripe)
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// RUNTIME MODE: Log current mode at boot
logRuntimeStatus();

// DEV_STABLE_MODE banner (single-line, deterministic)
// Note: Behavior changes are applied in later steps; this is observability only.
if (import.meta.env.DEV) {
  console.info(`[DEV_STABLE_MODE] ${isDevStableMode() ? 'ON' : 'OFF'} (${devStableReason()})`);
}

// DEV HARDENING: if a previous PWA Service Worker is still registered, it can hijack
// dev routes (e.g. /registerSW.js) and spam Workbox routing logs.
// We explicitly unregister SWs in DEV_STABLE_MODE to prevent loop storms.
if (isDevStableMode() && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      console.info('[SW] DEV cleanup: service workers unregistered and caches cleared');
    } catch (e) {
      console.warn('[SW] DEV cleanup failed (non-fatal):', e);
    }
  })();
}

// Initialize monitoring
import { registerEffect } from '../../core-engine/effects';
import { persistOrder, persistOrderItem, persistRemoveItem, persistUpdateItemQty, persistOrderStatus, persistPayment } from './core/sovereignty/OrderProjection';
import { persistProduct, persistProductArchive } from './core/sovereignty/ProductProjection';
import { persistStockDeduction, persistInventoryCount, persistStockRestock } from './core/sovereignty/InventoryProjection';
import { persistTableStatus } from './core/sovereignty/TableProjection';
import { persistOpenCashRegister, persistCloseCashRegister } from './core/sovereignty/CashRegisterProjection';

// KERNEL INTEGRATION
import { BootstrapKernel, SystemStateProvider } from './core/kernel';
import type { BootstrapResult } from './core/kernel/types';

// SOVEREIGNTY: Register Projection Effects (Link Kernel -> DB)
registerEffect('persistOrder', persistOrder);
registerEffect('persistOrderItem', persistOrderItem);
registerEffect('persistOrderStatus', persistOrderStatus);
registerEffect('persistPayment', persistPayment);
registerEffect('persistProduct', persistProduct);
registerEffect('persistProductArchive', persistProductArchive);
registerEffect('persistStockDeduction', persistStockDeduction);
registerEffect('persistInventoryCount', persistInventoryCount);
registerEffect('persistStockRestock', persistStockRestock);
registerEffect('persistTableStatus', persistTableStatus);
registerEffect('persistOpenCashRegister', persistOpenCashRegister);
registerEffect('persistCloseCashRegister', persistCloseCashRegister);

Logger.info('Application starting', {
  version: '1.0.0',
  environment: import.meta.env.MODE,
});

// ============================================================================
// 🔒 BOOTSTRAP KERNEL: PRODUCTION GATE
// ============================================================================
// This ensures the system never starts in a compromised state in production.
// Checks:
// 1. assertNoMock (Must be TRUE in prod)
// 2. Critical Systems (Orders, Fiscal must be online)
// ============================================================================

const BOOT_START = performance.now();

BootstrapKernel.init({ skipHealthChecks: false }).then((result: BootstrapResult) => {
  const isProd = result.state.environment === 'prod';
  const isFatal = result.state.kernel === 'FAILED';

  // 🛑 KERNEL PANIC (Production Only)
  if (isProd && isFatal) {
    Logger.critical('⛔ KERNEL PANIC: Production Gate Halt', { errors: result.errors });

    document.getElementById('root')!.innerHTML = `
      <div style="background:#000;color:#ff3333;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;padding:20px;">
        <h1 style="font-size:24px;margin-bottom:20px;">SYSTEM HALTED • KERNEL PANIC</h1>
        <div style="border:1px solid #ff3333;padding:20px;max-width:600px;width:100%;">
          <p style="color:#fff">The system refused to boot because integrity checks failed in PRODUCTION environment.</p>
          <ul style="margin-top:20px;color:#ff9999;">
            ${result.errors.map(e => `<li>${e}</li>`).join('')}
          </ul>
          <p style="margin-top:20px;font-size:12px;opacity:0.7;">
            Timestamp: ${result.state.timestamp}<br/>
            Kernel Version: ${result.state.version}<br/>
            Trace ID: ${Math.random().toString(36).substring(7)}
          </p>
        </div>
      </div>
    `;
    return; // ☠️ HALT
  }

  // ⚠️ DEV WARNINGS
  if (!isProd && isFatal) {
    console.error('⚠️ [DEV] KERNEL FAILED CHECKS (Bypassed due to DEV env):', result.errors);
  }

  // ✅ SYSTEM START
  const bootDuration = performance.now() - BOOT_START;
  performanceMonitor.recordMetric({
    name: 'kernel_boot',
    value: bootDuration,
    unit: 'ms',
    timestamp: new Date().toISOString(),
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary context="Root">
        <SystemStateProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SystemStateProvider>
      </ErrorBoundary>
    </StrictMode>
  );

}).catch((error: any) => {
  Logger.critical('🔥 FATAL: Bootstrap Loader Failed', error);
  document.body.innerHTML = '<h1 style="color:red;padding:20px">FATAL BOOT ERROR</h1>';
});
