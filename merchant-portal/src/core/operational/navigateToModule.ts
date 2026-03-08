import { wouldGuardAllow } from "./platformDetection";

export type OperationalModuleId = "tpv" | "kds" | "appstaff";

type NavigateFn = (path: string) => void;

export type NavigateToModuleOptions = {
  searchParams?: string;
  navigate?: NavigateFn;
  openExternalUrl?: (url: string) => void;
  onBrowserBlocked?: () => void;
  onBrowserFallback?: () => void;
  fallbackDelayMs?: number;
};

const MODULE_PATHS: Record<OperationalModuleId, string> = {
  tpv: "/op/tpv",
  kds: "/op/kds",
  appstaff: "/app/staff/home",
};

const DEFAULT_FALLBACK_DELAY_MS = 1800;

export function buildModulePath(
  moduleId: OperationalModuleId,
  searchParams?: string,
): string {
  const base = MODULE_PATHS[moduleId];
  return searchParams ? `${base}?${searchParams}` : base;
}

export function buildModuleDeepLink(
  moduleId: OperationalModuleId,
  searchParams?: string,
): string {
  const path = buildModulePath(moduleId, searchParams);
  return `chefiapp://open?app=${moduleId}&path=${encodeURIComponent(path)}`;
}

/**
 * Centralized module navigation contract:
 * - Installed runtime allowed by guard: navigate to route.
 * - Browser context: try desktop deep-link and then fallback callback.
 */
export function navigateToModule(
  moduleId: OperationalModuleId,
  options: NavigateToModuleOptions = {},
): void {
  const path = buildModulePath(moduleId, options.searchParams);
  const openExternalUrl =
    options.openExternalUrl ??
    ((url: string) => {
      if (typeof window !== "undefined") {
        window.location.assign(url);
      }
    });

  if (wouldGuardAllow(moduleId)) {
    if (options.navigate) {
      options.navigate(path);
      return;
    }
    openExternalUrl(path);
    return;
  }

  options.onBrowserBlocked?.();

  openExternalUrl(buildModuleDeepLink(moduleId, options.searchParams));

  if (options.onBrowserFallback) {
    const delay = options.fallbackDelayMs ?? DEFAULT_FALLBACK_DELAY_MS;
    setTimeout(() => {
      options.onBrowserFallback?.();
    }, delay);
  }
}
