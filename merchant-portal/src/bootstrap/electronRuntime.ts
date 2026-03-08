interface ServiceWorkerEventTarget {
  addEventListener(event: "controllerchange", listener: () => void): void;
}

interface ServiceWorkerNavigator {
  serviceWorker?: ServiceWorkerEventTarget;
  userAgent?: string;
}

interface WindowLike {
  electronBridge?: unknown;
  location?: {
    reload(): void;
  };
}

export function detectElectronRuntime(options?: {
  navigatorObj?: ServiceWorkerNavigator | undefined;
  windowObj?: WindowLike | undefined;
}): boolean {
  const navigatorObj = options?.navigatorObj ?? globalThis.navigator;
  const windowObj = options?.windowObj ?? (globalThis.window as WindowLike);
  const hasElectronUserAgent = navigatorObj?.userAgent?.includes("Electron");
  const hasElectronBridge = Boolean(windowObj?.electronBridge);
  return Boolean(hasElectronUserAgent || hasElectronBridge);
}

export function installServiceWorkerAutoReload(options: {
  isElectronRuntime: boolean;
  navigatorObj?: ServiceWorkerNavigator | undefined;
  windowObj?: WindowLike | undefined;
  log?: Pick<Console, "log">;
}): void {
  const {
    isElectronRuntime,
    navigatorObj = globalThis.navigator,
    windowObj = globalThis.window as WindowLike,
    log = console,
  } = options;

  if (!navigatorObj?.serviceWorker) return;

  if (isElectronRuntime) {
    log.log("[ChefIApp] Electron detected — skipping SW registration.");
    return;
  }

  navigatorObj.serviceWorker.addEventListener("controllerchange", () => {
    log.log("[ChefIApp] New service worker activated — reloading...");
    windowObj?.location?.reload();
  });
}
