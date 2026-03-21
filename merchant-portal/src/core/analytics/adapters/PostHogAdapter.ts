import { FunnelTracker } from "../FunnelTracker";
import type { FunnelEvent } from "../funnelEvents";

interface PostHogClient {
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
}

let unsubscribe: (() => void) | null = null;

/**
 * Connect FunnelTracker to PostHog.
 * Call once at app boot after PostHog is initialized.
 *
 * Usage:
 *   import posthog from "posthog-js";
 *   connectPostHog(posthog);
 */
export function connectPostHog(client: PostHogClient): () => void {
  // Disconnect previous if any
  if (unsubscribe) unsubscribe();

  unsubscribe = FunnelTracker.subscribe((event: FunnelEvent) => {
    const properties: Record<string, unknown> = {
      ...("properties" in event ? event.properties : {}),
      funnel_session_duration_ms: FunnelTracker.getSessionDuration(),
    };

    client.capture(`chefiapp_${event.name}`, properties);
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}

/**
 * Identify the current user in PostHog after authentication.
 */
export function identifyUser(
  client: PostHogClient,
  userId: string,
  traits?: {
    email?: string;
    restaurantId?: string;
    plan?: string;
    setupProgress?: number;
  },
): void {
  client.identify(userId, {
    ...traits,
    app: "chefiapp",
    platform:
      typeof window !== "undefined" && (window as any).electronAPI
        ? "desktop"
        : "web",
  });
}
