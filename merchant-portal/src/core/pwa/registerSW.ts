/**
 * registerSW — Service Worker registration for production builds.
 *
 * - Registers /sw.js on app load (production only)
 * - Handles updates: notifies listeners when a new version is available
 * - Handles offline/online transitions: notifies listeners
 * - Integrates with SyncEngine for queue processing on reconnect
 *
 * DEV_STABLE_MODE: SW is never registered in development (see index.html preflight).
 */

import { Logger } from '../logger';
import { SyncEngine } from '../sync/SyncEngine';

export type SWUpdateListener = (registration: ServiceWorkerRegistration) => void;
export type SWStatusListener = (status: 'online' | 'offline') => void;

const updateListeners: SWUpdateListener[] = [];
const statusListeners: SWStatusListener[] = [];

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker. Call once at app boot (production only).
 */
export async function registerServiceWorker(): Promise<void> {
  // Never register in dev or when SW is not supported
  if (import.meta.env.DEV) {
    Logger.info('[SW] Skipping registration in development mode');
    return;
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    Logger.info('[SW] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    swRegistration = registration;
    Logger.info('[SW] Registered successfully', { scope: registration.scope });

    // Check for updates immediately
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // New version available (existing SW is controlling, new one installed)
          Logger.info('[SW] New version available');
          updateListeners.forEach((listener) => listener(registration));
        }
      });
    });

    // Check for updates periodically (every 60 minutes)
    setInterval(() => {
      registration.update().catch(() => {
        // Non-fatal: update check failed (probably offline)
      });
    }, 60 * 60 * 1000);
  } catch (err) {
    Logger.error('[SW] Registration failed', err);
  }

  // Listen for online/offline transitions
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

function handleOnline(): void {
  Logger.info('[SW] Browser went online');
  statusListeners.forEach((l) => l('online'));
  // Trigger sync engine queue processing
  SyncEngine.forceSync();
}

function handleOffline(): void {
  Logger.info('[SW] Browser went offline');
  statusListeners.forEach((l) => l('offline'));
}

/**
 * Subscribe to SW update events (new version available).
 * Returns an unsubscribe function.
 */
export function onSWUpdate(listener: SWUpdateListener): () => void {
  updateListeners.push(listener);
  return () => {
    const idx = updateListeners.indexOf(listener);
    if (idx >= 0) updateListeners.splice(idx, 1);
  };
}

/**
 * Subscribe to online/offline status changes.
 * Returns an unsubscribe function.
 */
export function onNetworkStatusChange(listener: SWStatusListener): () => void {
  statusListeners.push(listener);
  return () => {
    const idx = statusListeners.indexOf(listener);
    if (idx >= 0) statusListeners.splice(idx, 1);
  };
}

/**
 * Tell the waiting SW to skip waiting and take over.
 */
export function skipWaitingAndReload(): void {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  // Reload after a brief delay to let SW activate
  setTimeout(() => window.location.reload(), 300);
}

/**
 * Get the current SW registration (if any).
 */
export function getRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}
