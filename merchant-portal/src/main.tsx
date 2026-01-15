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

import { Buffer } from 'buffer';

// Polyfill Buffer for browser (Critical for TPV/Stripe)
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

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

// Measure app initialization
const startTime = performance.now();
try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary context="Root">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );

  const initDuration = performance.now() - startTime;
  performanceMonitor.recordMetric({
    name: 'app_init',
    value: initDuration,
    unit: 'ms',
    timestamp: new Date().toISOString(),
  });

} catch (error: any) {
  Logger.critical('Application initialization failed', error);
  throw error;
}
