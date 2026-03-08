/**
 * Stub for `virtual:pwa-register/react` used in Electron builds.
 *
 * When building for desktop (VITE_BUILD_TARGET=electron), the VitePWA plugin
 * is disabled so the virtual module doesn't exist. This stub provides a no-op
 * implementation so ServiceWorkerManager compiles without changes.
 */

import { useState } from "react";

export function useRegisterSW(_opts?: Record<string, unknown>) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  return {
    needRefresh: [needRefresh, setNeedRefresh] as const,
    offlineReady: [offlineReady, setOfflineReady] as const,
    updateServiceWorker: (_reloadPage?: boolean) => Promise.resolve(),
  };
}
