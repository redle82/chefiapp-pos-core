/**
 * useExitIntent — Triggers callback when user moves cursor to leave viewport (top edge).
 * Desktop only. Throttled to avoid multiple triggers.
 */
import { useCallback, useEffect, useRef } from "react";

const MOBILE_MAX_WIDTH = 768;
const THROTTLE_MS = 2000;

export function useExitIntent(
  onTrigger: () => void,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const lastTrigger = useRef(0);
  const triggered = useRef(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (!enabled || window.innerWidth < MOBILE_MAX_WIDTH) return;
      if (triggered.current) return;
      if (e.clientY > 10) return;
      const now = Date.now();
      if (now - lastTrigger.current < THROTTLE_MS) return;
      lastTrigger.current = now;
      triggered.current = true;
      onTrigger();
    },
    [enabled, onTrigger],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [enabled, handleMouseLeave]);
}
