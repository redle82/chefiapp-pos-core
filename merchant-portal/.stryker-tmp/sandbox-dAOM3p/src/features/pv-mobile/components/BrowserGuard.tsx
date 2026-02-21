/**
 * BrowserGuard — Mobile-only access guard for TPV Mobile
 *
 * Phase 7: Prevents desktop/browser access, enforces portrait orientation
 * - User agent detection (mobile only)
 * - Orientation detection (portrait only)
 * - Blocks invalid access with clear messaging
 * - Debug info for staff support
 */
// @ts-nocheck


import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type GuardReason = "desktop" | "landscape" | null;

interface BrowserGuardState {
  blocked: boolean;
  reason: GuardReason;
  isMobile: boolean;
  isPortrait: boolean;
  userAgent: string;
}

/**
 * Detects if running on mobile device based on user agent
 */
function detectMobileDevice(): boolean {
  // Comprehensive mobile detection
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // Also check for touch support
  const hasTouchSupport = () => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  };

  return isMobileUA || hasTouchSupport();
}

/**
 * Detects if viewport is in portrait orientation
 */
function detectPortraitOrientation(): boolean {
  return window.innerHeight > window.innerWidth;
}

export function BrowserGuard({ children }: { children: React.ReactNode }) {
  const [guardState, setGuardState] = useState<BrowserGuardState>(() => ({
    blocked: false,
    reason: null,
    isMobile: detectMobileDevice(),
    isPortrait: detectPortraitOrientation(),
    userAgent: navigator.userAgent,
  }));

  // Update guard state on mount and when orientation changes
  useEffect(() => {
    const updateGuardState = () => {
      const isMobile = detectMobileDevice();
      const isPortrait = detectPortraitOrientation();
      let reason: GuardReason = null;

      if (!isMobile) {
        reason = "desktop";
      } else if (!isPortrait) {
        reason = "landscape";
      }

      setGuardState({
        blocked: reason !== null,
        reason,
        isMobile,
        isPortrait,
        userAgent: navigator.userAgent,
      });
    };

    updateGuardState();

    // Listen for orientation changes and window resize
    window.addEventListener("orientationchange", updateGuardState);
    window.addEventListener("resize", updateGuardState);

    return () => {
      window.removeEventListener("orientationchange", updateGuardState);
      window.removeEventListener("resize", updateGuardState);
    };
  }, []);

  if (!guardState.blocked) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className="pvm-browser-guard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pvm-browser-guard__content">
        <div className="pvm-browser-guard__icon">📱</div>

        <h1 className="pvm-browser-guard__title">TPV Mobile</h1>

        {guardState.reason === "desktop" && (
          <>
            <p className="pvm-browser-guard__message">
              Este aplicativo foi otimizado{" "}
              <strong>exclusivamente para mobile</strong>.
            </p>
            <p className="pvm-browser-guard__submessage">
              Por favor, acesse através de um dispositivo móvel (smartphone ou
              tablet).
            </p>
          </>
        )}

        {guardState.reason === "landscape" && (
          <>
            <p className="pvm-browser-guard__message">
              Por favor, gire o seu dispositivo para{" "}
              <strong>modo retrato</strong>.
            </p>
            <p className="pvm-browser-guard__submessage">
              TPV Mobile foi otimizado para uso em modo retrato.
            </p>
          </>
        )}

        <div className="pvm-browser-guard__debug">
          {guardState.reason === "desktop" && (
            <>
              <p>🖥️ Detectado: Desktop</p>
              <p>📱 Necessário: Smartphone ou Tablet</p>
            </>
          )}
          {guardState.reason === "landscape" && (
            <>
              <p>↔️ Orientação: Paisagem</p>
              <p>↕️ Necessário: Retrato</p>
            </>
          )}
          {process.env.NODE_ENV === "development" && (
            <p className="pvm-browser-guard__debug-ua">
              UA: {guardState.userAgent.substring(0, 50)}...
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
