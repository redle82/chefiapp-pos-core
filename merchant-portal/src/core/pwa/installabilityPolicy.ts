const DEFAULT_MANIFEST_HREF = "/manifest.webmanifest";

export function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isStaffPwaRoute(pathname: string): boolean {
  return pathname === "/app/staff" || pathname.startsWith("/app/staff/");
}

export function shouldEnablePwaInstallability(pathname: string): boolean {
  // PWA is deprecated for AppStaff. Native Expo app is now the only supported mobile surface.
  void pathname;
  return false;
}

export function syncManifestLinkForRoute(
  pathname: string,
  manifestHref: string = DEFAULT_MANIFEST_HREF,
): void {
  void pathname;
  void manifestHref;
  if (typeof document === "undefined") return;

  const head = document.head;
  if (!head) return;

  // PWA is dead — always strip any manifest link that may be lingering.
  const existing = Array.from(
    head.querySelectorAll('link[rel="manifest"]'),
  ) as HTMLLinkElement[];
  existing.forEach((link) => link.remove());
}

export async function unregisterServiceWorkersForAdminRoute(
  pathname: string,
): Promise<void> {
  // Keep signature stable, but PWA cleanup is now global.
  void pathname;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );

    // In DEV, clear caches too to remove stale installability state quickly.
    if (import.meta.env.DEV && typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Non-fatal by policy.
  }
}

export async function applyPwaInstallabilityPolicy(
  pathname: string,
): Promise<void> {
  syncManifestLinkForRoute(pathname);
  await unregisterServiceWorkersForAdminRoute(pathname);
}
