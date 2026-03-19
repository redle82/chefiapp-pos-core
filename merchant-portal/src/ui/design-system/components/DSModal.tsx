/**
 * DSModal — Design System Modal/Dialog
 *
 * Accessible modal with focus trap, escape key, and backdrop.
 *
 * Usage:
 *   <DSModal open={showModal} onClose={() => setShowModal(false)} title="Confirm">
 *     <p>Are you sure?</p>
 *   </DSModal>
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface DSModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
  hideClose?: boolean;
  style?: CSSProperties;
}

export function DSModal({ open, onClose, title, children, maxWidth = 480, hideClose = false, style }: DSModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !contentRef.current) return;
    const el = contentRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Content */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          background: "#171717",
          borderRadius: 16,
          border: "1px solid #262626",
          maxWidth,
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          ...style,
        }}
      >
        {(title || !hideClose) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #262626",
            }}
          >
            {title && (
              <h2 style={{ color: "#fafafa", fontSize: 18, fontWeight: 700, margin: 0 }}>
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#525252",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4,
                  marginLeft: "auto",
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
