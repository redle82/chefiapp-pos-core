/**
 * useDeepLinkAttempt — Attempt to open a desktop deep link (chefiapp://...)
 * and detect whether the OS handled it or not.
 *
 * Technique: create a hidden iframe with the protocol URL. If the OS handles
 * it, the browser loses focus. If not, nothing visible happens and we show
 * a fallback (download prompt).
 *
 * Ref: DESKTOP_DISTRIBUTION_CONTRACT, OPERATIONAL_INSTALLATION_CONTRACT.
 */

import { useCallback, useRef, useState } from "react";

export interface UseDeepLinkAttemptReturn {
  /** Attempt to open a deep link URL. Returns true if focus was lost (app opened). */
  attemptDeepLink: (url: string) => void;
  /** Whether a deep link attempt is in progress. */
  isAttempting: boolean;
  /** Whether the fallback UI should be shown (deep link failed). */
  showFallback: boolean;
  /** Dismiss the fallback UI. */
  dismissFallback: () => void;
}

const DEEP_LINK_TIMEOUT_MS = 1500;

export function useDeepLinkAttempt(): UseDeepLinkAttemptReturn {
  const [isAttempting, setIsAttempting] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (iframeRef.current) {
      iframeRef.current.remove();
      iframeRef.current = null;
    }
  }, []);

  const attemptDeepLink = useCallback(
    (url: string) => {
      // Ignore repeated clicks while an attempt is already in flight
      if (timeoutRef.current) return;

      cleanup();
      setIsAttempting(true);
      setShowFallback(false);

      // Use a hidden iframe to probe the custom scheme.
      // This avoids the double "Failed to launch" console noise that
      // happens when both iframe.src AND window.location.href fire.
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframeRef.current = iframe;

      // Check if the app handled it by monitoring focus loss
      const startTime = Date.now();

      timeoutRef.current = setTimeout(() => {
        setIsAttempting(false);

        // If the page is still focused after timeout, the deep link wasn't handled
        // Heuristic: if more than TIMEOUT elapsed and document still has focus → failed
        const elapsed = Date.now() - startTime;
        if (elapsed >= DEEP_LINK_TIMEOUT_MS - 100 && document.hasFocus()) {
          setShowFallback(true);
        }
        // If focus was lost, the desktop app opened — no fallback needed

        cleanup();
      }, DEEP_LINK_TIMEOUT_MS);
    },
    [cleanup],
  );

  const dismissFallback = useCallback(() => {
    setShowFallback(false);
  }, []);

  return {
    attemptDeepLink,
    isAttempting,
    showFallback,
    dismissFallback,
  };
}
