import {
  APP_ROUTES,
  CRITICAL_BILLING_ROUTES,
  DASHBOARD_ROUTES,
  DESKTOP_OPERATIONAL_ROUTES,
  LAST_ROUTE_ALLOWED,
  OPERATIONAL_ROUTES,
} from "../../routes/constants/routeConstants";

type StorageLike = Pick<Storage, "getItem">;

export const LAST_ROUTE_KEY = "chefiapp_lastRoute";

export function getInstalledDesktopOperationalRoute(
  storage?: StorageLike | null,
): (typeof DESKTOP_OPERATIONAL_ROUTES)[number] | null {
  if (!storage) return null;

  try {
    const terminalType = (storage.getItem("chefiapp_terminal_type") ?? "")
      .trim()
      .toUpperCase();

    if (terminalType === "TPV") return OPERATIONAL_ROUTES.TPV;
    if (terminalType === "KDS") return OPERATIONAL_ROUTES.KDS;
    return null;
  } catch {
    return null;
  }
}

export function normalizeLastRoute(path: string): string | null {
  if (path.startsWith(OPERATIONAL_ROUTES.TPV)) return OPERATIONAL_ROUTES.TPV;
  if (path.startsWith(OPERATIONAL_ROUTES.KDS)) return OPERATIONAL_ROUTES.KDS;
  if (path.startsWith(OPERATIONAL_ROUTES.CASH)) return OPERATIONAL_ROUTES.CASH;
  if (LAST_ROUTE_ALLOWED.includes(path)) return path;
  return null;
}

export function shouldPersistLastRoute(
  normalizedPath: string,
  installedDesktopRoute: (typeof DESKTOP_OPERATIONAL_ROUTES)[number] | null,
): boolean {
  if (!installedDesktopRoute) return true;

  return (
    normalizedPath === OPERATIONAL_ROUTES.TPV ||
    normalizedPath === OPERATIONAL_ROUTES.KDS
  );
}

export function createAppChromeState(pathname: string) {
  const isBillingManagement = pathname.startsWith(APP_ROUTES.BILLING);
  const isDashboard =
    pathname === DASHBOARD_ROUTES.ROOT || pathname === DASHBOARD_ROUTES.APP;
  const isOperationalSurface =
    pathname.startsWith(OPERATIONAL_ROUTES.TPV) ||
    pathname.startsWith(OPERATIONAL_ROUTES.KDS);
  const isStaffLauncher =
    pathname === APP_ROUTES.STAFF_HOME ||
    pathname.startsWith(`${APP_ROUTES.STAFF_HOME}/`);
  const isStaffMore = pathname.startsWith(`${APP_ROUTES.STAFF}/profile`);
  // Billing banner nunca aparece no AppStaff — billing vive no /admin.
  // AppStaff é terminal operacional, não superfície de gestão.
  const shouldShowBillingBanner = false;

  return {
    isBillingManagement,
    isDashboard,
    isOperationalSurface,
    shouldShowBillingBanner,
  };
}

export function resolveNativeAppStaffRedirect(
  pathname: string,
  isNativeMobileRuntime: boolean,
): string | null {
  if (!isNativeMobileRuntime) return null;

  if (
    pathname === APP_ROUTES.STAFF ||
    pathname.startsWith(`${APP_ROUTES.STAFF}/`)
  ) {
    return null;
  }

  if (
    pathname.startsWith("/admin") ||
    pathname === DASHBOARD_ROUTES.ROOT ||
    pathname === DASHBOARD_ROUTES.APP ||
    pathname.startsWith(OPERATIONAL_ROUTES.TPV) ||
    pathname.startsWith(OPERATIONAL_ROUTES.KDS) ||
    pathname.startsWith(OPERATIONAL_ROUTES.CASH)
  ) {
    return APP_ROUTES.STAFF_HOME;
  }

  return null;
}

export function shouldBlockForPastDue(
  pathname: string,
  billingStatus: string | null | undefined,
  isBillingManagement: boolean,
): boolean {
  return (
    billingStatus === "past_due" &&
    CRITICAL_BILLING_ROUTES.includes(pathname) &&
    !isBillingManagement
  );
}
