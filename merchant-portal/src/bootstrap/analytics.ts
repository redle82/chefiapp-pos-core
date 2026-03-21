/**
 * Unified analytics bootstrap.
 * Initializes all analytics providers and wires FunnelTracker adapters.
 * Call once at app boot, before React render.
 */
import { connectPostHog, connectSentry, identifyUser } from "../core/analytics";
import { initAppPostHog, getPostHog } from "./posthog";
import { initAppSentry } from "./sentry";

let initialized = false;

/**
 * Initialize all analytics: Sentry + PostHog + FunnelTracker adapters.
 * Safe to call multiple times -- only runs once.
 */
export async function initAnalytics(options?: {
  /** Override for import.meta.env.MODE */
  mode?: string;
  /** Whether running inside Electron */
  isElectronRuntime?: boolean;
  /** Entry point identifier for tagging */
  entry?: string;
}): Promise<void> {
  if (initialized) return;
  initialized = true;

  const mode = options?.mode ?? import.meta.env.MODE;
  const isElectronRuntime =
    options?.isElectronRuntime ??
    (typeof window !== "undefined" &&
      !!(window as Record<string, unknown>).electronAPI);

  // 1. Initialize Sentry (uses bootstrap/sentry.ts which already handles guards)
  try {
    initAppSentry({ mode, isElectronRuntime });

    // Wire Sentry adapter to FunnelTracker
    const Sentry = await import("@sentry/react");
    connectSentry({
      addBreadcrumb: (bc) => Sentry.addBreadcrumb(bc),
      setTag: (key, value) => Sentry.setTag(key, value),
      setContext: (name, ctx) => Sentry.setContext(name, ctx),
    });

    if (import.meta.env.DEV) {
      console.log("[Analytics] Sentry adapter connected to FunnelTracker");
    }
  } catch {
    // Sentry not available -- continue without it
    if (import.meta.env.DEV) {
      console.log("[Analytics] Sentry not available, skipping adapter");
    }
  }

  // 2. Initialize PostHog
  try {
    const posthog = await initAppPostHog();
    if (posthog) {
      connectPostHog({
        capture: (name, props) => posthog.capture(name, props),
        identify: (id, props) => posthog.identify(id, props),
      });

      if (import.meta.env.DEV) {
        console.log("[Analytics] PostHog adapter connected to FunnelTracker");
      }
    }
  } catch {
    if (import.meta.env.DEV) {
      console.log("[Analytics] PostHog not available, skipping adapter");
    }
  }
}

/**
 * Identify the current user across all analytics providers.
 * Call after successful authentication.
 */
export function identifyAuthenticatedUser(
  userId: string,
  traits?: {
    email?: string;
    restaurantId?: string;
    plan?: string;
    setupProgress?: number;
  },
): void {
  // PostHog identify via FunnelTracker adapter
  const posthog = getPostHog();
  if (posthog) {
    identifyUser(
      {
        capture: posthog.capture.bind(posthog),
        identify: posthog.identify.bind(posthog),
      },
      userId,
      traits,
    );
  }

  // Sentry identify
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.setUser({
        id: userId,
        email: traits?.email,
      });
      if (traits?.restaurantId) {
        Sentry.setTag("restaurant_id", traits.restaurantId);
      }
    })
    .catch(() => {
      // Sentry not available -- non-fatal
    });
}
