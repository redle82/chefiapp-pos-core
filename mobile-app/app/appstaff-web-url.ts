const PORT = 5175;
const STAFF_HOME_PATH = "/app/staff/home";
const STAFF_PATH_PREFIX = "/app/staff";
const WAITER_PATH_PREFIX = "/app/waiter";
const ALLOWED_PUBLIC_PREFIXES = ["/auth", "/welcome", "/onboarding"];

export function buildDefaultAppStaffUrl(host: string): string {
  return `http://${host}:${PORT}${STAFF_HOME_PATH}`;
}

export function normalizeAppStaffWebUrl(
  url: string | undefined,
  host: string,
): string {
  if (!url) {
    return buildDefaultAppStaffUrl(host);
  }

  try {
    const parsed = new URL(url);
    return `${parsed.origin}${STAFF_HOME_PATH}`;
  } catch {
    return buildDefaultAppStaffUrl(host);
  }
}

export function shouldAllowAppStaffNavigation(
  requestUrl: string,
  appStaffBaseUrl: string,
): boolean {
  try {
    const requested = new URL(requestUrl);
    const base = new URL(appStaffBaseUrl);

    if (requested.origin !== base.origin) {
      return false;
    }

    if (
      requested.pathname === STAFF_PATH_PREFIX ||
      requested.pathname.startsWith(`${STAFF_PATH_PREFIX}/`)
    ) {
      return true;
    }

    if (
      requested.pathname === WAITER_PATH_PREFIX ||
      requested.pathname.startsWith(`${WAITER_PATH_PREFIX}/`)
    ) {
      return true;
    }

    return ALLOWED_PUBLIC_PREFIXES.some(
      (prefix) =>
        requested.pathname === prefix ||
        requested.pathname.startsWith(`${prefix}/`),
    );
  } catch {
    return false;
  }
}

export { STAFF_HOME_PATH };
