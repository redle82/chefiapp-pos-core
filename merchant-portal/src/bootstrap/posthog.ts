/**
 * PostHog initialization for production analytics.
 * Only initializes when VITE_POSTHOG_KEY is set and not in development.
 *
 * Uses dynamic import so posthog-js is not bundled when unused.
 */

export interface PostHogInstance {
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  opt_out_capturing: () => void;
  opt_in_capturing: () => void;
}

let posthogInstance: PostHogInstance | null = null;

/**
 * Initialize PostHog analytics.
 * Returns the PostHog instance if successfully initialized, null otherwise.
 * Safe to call multiple times -- only initializes once.
 */
export async function initAppPostHog(): Promise<PostHogInstance | null> {
  if (posthogInstance) return posthogInstance;

  const apiKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.log("[PostHog] Skipped -- VITE_POSTHOG_KEY not set");
    }
    return null;
  }

  try {
    // Dynamic import to avoid bundling posthog-js when not installed
    const posthogModule = await import("posthog-js");
    const posthog = posthogModule.default;

    posthog.init(apiKey, {
      api_host:
        (import.meta.env.VITE_POSTHOG_HOST as string) ||
        "https://eu.i.posthog.com",
      autocapture: false, // We use FunnelTracker for explicit events
      capture_pageview: false, // SPA -- we track navigation via FunnelTracker
      persistence: "localStorage",
      loaded: (ph: PostHogInstance) => {
        if (import.meta.env.DEV) {
          console.log("[PostHog] Initialized successfully");
        }
        posthogInstance = ph;
      },
    });

    posthogInstance = posthog as unknown as PostHogInstance;
    return posthogInstance;
  } catch (err) {
    console.warn("[PostHog] Failed to initialize:", err);
    return null;
  }
}

/**
 * Get the current PostHog instance (null if not initialized).
 */
export function getPostHog(): PostHogInstance | null {
  return posthogInstance;
}
