const DEFAULT_MANIFEST_HREF = "/manifest.json";

/** Operational POS routes where PWA installability is enabled. */
const PWA_ENABLED_PREFIXES = ["/op/tpv", "/op/kds", "/op/cash"];

export function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isStaffPwaRoute(pathname: string): boolean {
  return pathname === "/app/staff" || pathname.startsWith("/app/staff/");
}

export function shouldEnablePwaInstallability(pathname: string): boolean {
  // PWA is enabled for operational POS surfaces (TPV, KDS, Cash).
  // AppStaff uses native Expo app instead.
  return PWA_ENABLED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function syncManifestLinkForRoute(
  pathname: string,
  manifestHref: string = DEFAULT_MANIFEST_HREF,
): void {
  if (typeof document === "undefined") return;
  const head = document.head;
  if (!head) return;

  const existing = Array.from(
    head.querySelectorAll('link[rel="manifest"]'),
  ) as HTMLLinkElement[];

  if (shouldEnablePwaInstallability(pathname)) {
    // Ensure manifest link is present
    if (existing.length === 0) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = manifestHref;
      head.appendChild(link);
    } else {
      // Update href if different
      existing[0].href = manifestHref;
    }
  } else {
    // Remove manifest link for non-POS routes
    existing.forEach((link) => link.remove());
  }
}

export async function unregisterServiceWorkersForAdminRoute(
  pathname: string,
): Promise<void> {
  // Only unregister SW for non-POS routes in DEV mode
  if (!import.meta.env.DEV) return;
  if (shouldEnablePwaInstallability(pathname)) return;

  void pathname;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );

    if (typeof caches !== "undefined") {
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
