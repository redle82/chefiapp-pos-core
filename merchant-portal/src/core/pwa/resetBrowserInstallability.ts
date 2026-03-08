export async function resetBrowserInstallability(): Promise<void> {
  if (typeof document !== "undefined") {
    const links = Array.from(
      document.head.querySelectorAll('link[rel="manifest"]'),
    );
    links.forEach((link) => link.remove());
  }

  try {
    localStorage.clear();
  } catch {
    // non-fatal
  }

  try {
    sessionStorage.clear();
  } catch {
    // non-fatal
  }

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    } catch {
      // non-fatal
    }
  }

  if (typeof caches !== "undefined") {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // non-fatal
    }
  }
}
