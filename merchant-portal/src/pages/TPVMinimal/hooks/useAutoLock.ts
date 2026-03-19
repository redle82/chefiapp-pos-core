/**
 * useAutoLock — 3-tier idle protection for TPV operator sessions.
 *
 * Tier 1: Dimmed (30s)  — visual overlay, no functional lock
 * Tier 2: Locked (60s)  — PIN required, operator preserved
 * Tier 3: Expired (5min) — full logout, operator cleared
 *
 * Listens to mouse, touch, keyboard, and scroll events on `document`.
 * Does NOT run when `enabled === false` (KDS / Customer Display exemption).
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IdleState = "active" | "dimmed" | "locked" | "expired";

export interface AutoLockConfig {
  /** Milliseconds before dimming overlay appears. Default: 30 000 */
  dimAfterMs?: number;
  /** Milliseconds before session locks (PIN required). Default: 60 000 */
  lockAfterMs?: number;
  /** Milliseconds before full session expiry. Default: 300 000 */
  expireAfterMs?: number;
  /** Set to false to disable (e.g. KDS pages). Default: true */
  enabled?: boolean;
}

export interface AutoLockResult {
  idleState: IdleState;
  resetIdle: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

// Dev mode: shorter timers for testing (20s / 40s / 90s)
const IS_DEV = import.meta.env.DEV;
const DEFAULT_DIM_MS = IS_DEV ? 120_000 : 30_000;
const DEFAULT_LOCK_MS = IS_DEV ? 180_000 : 60_000;
const DEFAULT_EXPIRE_MS = IS_DEV ? 600_000 : 300_000;

// Events that reset the idle timer (deliberate interactions only)
// "mousemove", "pointermove", and "touchmove" are intentionally excluded:
// passive cursor/finger movement should NOT dismiss the dim overlay.
const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  "mousedown",
  "touchstart",
  "keydown",
  "scroll",
  "wheel",
  "pointerdown",
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAutoLock(config: AutoLockConfig = {}): AutoLockResult {
  const {
    dimAfterMs = DEFAULT_DIM_MS,
    lockAfterMs = DEFAULT_LOCK_MS,
    expireAfterMs = DEFAULT_EXPIRE_MS,
    enabled = true,
  } = config;

  const [idleState, setIdleState] = useState<IdleState>("active");
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset idle timer to "active"
  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleState("active");
  }, []);

  // Tick: check elapsed idle time and transition states
  useEffect(() => {
    if (!enabled) {
      // Ensure state is active when disabled
      setIdleState("active");
      return;
    }

    // Reset on mount / re-enable
    lastActivityRef.current = Date.now();
    setIdleState("active");

    const tick = () => {
      const elapsed = Date.now() - lastActivityRef.current;

      setIdleState((prev) => {
        // Once expired, stay expired (requires external action to reset)
        if (prev === "expired") return "expired";
        // Once locked, stay locked (requires PIN to unlock)
        if (prev === "locked") {
          if (elapsed >= expireAfterMs) return "expired";
          return "locked";
        }

        if (elapsed >= expireAfterMs) return "expired";
        if (elapsed >= lockAfterMs) return "locked";
        if (elapsed >= dimAfterMs) return "dimmed";
        return "active";
      });
    };

    intervalRef.current = setInterval(tick, 1_000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, dimAfterMs, lockAfterMs, expireAfterMs]);

  // Activity event listeners
  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => {
      lastActivityRef.current = Date.now();

      // Only auto-reset from "active" or "dimmed" — never from locked/expired.
      // Locked/expired states require explicit unlocking (PIN / operator selection).
      setIdleState((prev) => {
        if (prev === "active" || prev === "dimmed") return "active";
        return prev;
      });
    };

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity);
      }
    };
  }, [enabled]);

  return { idleState, resetIdle };
}
