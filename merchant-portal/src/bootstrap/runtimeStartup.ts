import { Logger } from "../core/logger";
import { logRuntimeStatus } from "../core/runtime/RuntimeContext";
import {
  devStableReason,
  isDevStableMode,
} from "../core/runtime/devStableMode";
import { installUnhandledRejectionGuard } from "../core/runtime/unhandledRejectionGuard";

export function installRuntimeStartupGuards(options: {
  route: string;
  mode: string;
}): void {
  installUnhandledRejectionGuard(options);
}

export function logAppStartup(mode: string): void {
  logRuntimeStatus();
  Logger.info("Application starting", {
    version: "1.0.0",
    environment: mode === "production" ? "production" : "local",
  });
}

export function logStableModeBanner(options: {
  isDev: boolean;
  info?: Pick<Console, "info">;
}): void {
  if (!options.isDev) return;
  const info = options.info ?? console;
  info.info(
    `[STABLE_MODE] ${isDevStableMode() ? "ON" : "OFF"} (${devStableReason()})`,
  );
}

export async function cleanupStaleServiceWorkers(options: {
  enabled: boolean;
  navigatorObj?: Navigator | undefined;
  cachesObj?: CacheStorage | undefined;
  info?: Pick<Console, "info">;
  warn?: Pick<Console, "warn">;
}): Promise<void> {
  const {
    enabled,
    navigatorObj = globalThis.navigator,
    cachesObj = globalThis.caches,
    info = console,
    warn = console,
  } = options;

  if (!enabled || !navigatorObj || !("serviceWorker" in navigatorObj)) return;

  try {
    const regs = await navigatorObj.serviceWorker.getRegistrations();
    await Promise.all(regs.map((registration) => registration.unregister()));

    if (cachesObj) {
      const keys = await cachesObj.keys();
      await Promise.all(keys.map((key) => cachesObj.delete(key)));
    }

    info.info("[SW] Cleanup: service workers unregistered and caches cleared");
  } catch (error) {
    warn.warn("[SW] Cleanup failed (non-fatal):", error);
  }
}
