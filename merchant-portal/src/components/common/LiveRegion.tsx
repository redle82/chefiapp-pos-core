/**
 * LiveRegion — ARIA live region component for dynamic screen reader announcements.
 *
 * Renders a visually hidden element that announces messages to screen readers.
 * Use for: order added, payment confirmed, notification received, errors.
 *
 * Two modes:
 * - `role="status"` (aria-live="polite") — waits for idle to announce
 * - `role="alert"` (aria-live="assertive") — interrupts immediately
 *
 * Usage:
 *   <LiveRegion message={statusMessage} />
 *   <LiveRegion message={errorMessage} priority="assertive" />
 */

import { useEffect, useRef, useState } from "react";

interface LiveRegionProps {
  /** The message to announce. Change this value to trigger a new announcement. */
  message: string;
  /** Priority: "polite" waits for idle, "assertive" interrupts. Default: "polite". */
  priority?: "polite" | "assertive";
  /** Optional id for targeting. */
  id?: string;
}

/**
 * Visually hidden styles (sr-only pattern).
 * The element is positioned off-screen but accessible to screen readers.
 */
const srOnlyStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function LiveRegion({
  message,
  priority = "polite",
  id,
}: LiveRegionProps) {
  // Toggle content to force re-announcement of identical messages
  const [currentMessage, setCurrentMessage] = useState("");
  const prevMessageRef = useRef("");

  useEffect(() => {
    if (message !== prevMessageRef.current) {
      // Clear first, then set — ensures screen readers re-announce
      setCurrentMessage("");
      const timer = requestAnimationFrame(() => {
        setCurrentMessage(message);
      });
      prevMessageRef.current = message;
      return () => cancelAnimationFrame(timer);
    }
  }, [message]);

  const role = priority === "assertive" ? "alert" : "status";

  return (
    <div
      id={id}
      role={role}
      aria-live={priority}
      aria-atomic="true"
      style={srOnlyStyle}
    >
      {currentMessage}
    </div>
  );
}
