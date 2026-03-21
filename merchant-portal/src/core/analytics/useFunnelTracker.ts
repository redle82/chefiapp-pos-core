import { useCallback } from "react";
import type { FunnelEvent } from "./funnelEvents";
import { FunnelTracker } from "./FunnelTracker";

/**
 * React hook that exposes the funnel tracker with a stable `track` reference.
 *
 * @example
 * ```tsx
 * const { track } = useFunnelTracker();
 * track({ name: "setup_started" });
 * ```
 */
export function useFunnelTracker() {
  const track = useCallback((event: FunnelEvent) => {
    FunnelTracker.track(event);
  }, []);

  return { track, tracker: FunnelTracker } as const;
}
