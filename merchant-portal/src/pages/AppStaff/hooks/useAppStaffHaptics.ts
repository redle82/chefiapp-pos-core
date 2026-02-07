import { useCallback } from "react";

/**
 * useAppStaffHaptics
 *
 * Camada de abstração para feedback tátil / microfeedbacks.
 * Hoje apenas emite CustomEvents no window; o app mobile pode
 * escutar `appstaff-haptic` e acionar haptics nativas.
 */

export type AppStaffHapticIntent =
  | "navigation"
  | "primaryAction"
  | "taskComplete"
  | "error";

export function useAppStaffHaptics() {
  const triggerHaptic = useCallback((intent: AppStaffHapticIntent) => {
    try {
      window.dispatchEvent(
        new CustomEvent("appstaff-haptic", {
          detail: { intent },
        })
      );
    } catch {
      // ambiente sem window (tests) — ignorar
    }
  }, []);

  return { triggerHaptic };
}

