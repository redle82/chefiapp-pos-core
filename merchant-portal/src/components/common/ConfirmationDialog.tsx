/**
 * ConfirmationDialog — Modal for high-value financial actions that require
 * operator confirmation and/or a written reason.
 *
 * Used when a FinancialGuardrails check returns requiresConfirmation=true.
 * Dark theme with amber accents, matching POS palette.
 *
 * Features:
 * - Warning icon for high-value actions
 * - Shows: action description, amount, threshold exceeded message
 * - Requires: reason textarea (when guardrail says requiresReason)
 * - Buttons: "Confirm" (amber) + "Cancel"
 * - Auto-focuses reason field when required
 * - Keyboard accessible (Escape to cancel)
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfirmationDialogProps {
  /** Short description of the action (e.g., "Apply 60% discount"). */
  title: string;
  /** Formatted amount string for display (e.g., "EUR 45.00"). */
  amount?: string;
  /** Guardrail message explaining why confirmation is needed. */
  message?: string;
  /** Whether a written reason is required to proceed. */
  requiresReason: boolean;
  /** Called with the reason (if required) when the operator confirms. */
  onConfirm: (reason?: string) => void;
  /** Called when the operator cancels. */
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#f97316";
const BG = "#0a0a0a";
const BORDER = "#27272a";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfirmationDialog({
  title,
  amount,
  message,
  requiresReason,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { t } = useTranslation("tpv");
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the reason field when it is required
  useEffect(() => {
    if (requiresReason && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [requiresReason]);

  const canConfirm = !requiresReason || reason.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(requiresReason ? reason.trim() : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      data-testid="confirmation-dialog-overlay"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        data-testid="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          width: "min(440px, 92vw)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#431407",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
            aria-hidden="true"
          >
            {"\u26A0\uFE0F"}
          </div>
        </div>

        {/* Title */}
        <h2
          id="confirmation-dialog-title"
          style={{
            color: "#fafafa",
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            textAlign: "center",
          }}
        >
          {title}
        </h2>

        {/* Amount badge */}
        {amount && (
          <div
            style={{
              textAlign: "center",
              color: ACCENT,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {amount}
          </div>
        )}

        {/* Message / threshold exceeded */}
        {message && (
          <p
            id="confirmation-dialog-message"
            style={{
              color: "#a1a1aa",
              fontSize: 13,
              lineHeight: 1.5,
              margin: 0,
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        {/* Reason textarea (when guardrail requires it) */}
        {requiresReason && (
          <div>
            <label
              htmlFor="confirmation-reason"
              style={{
                color: "#d4d4d8",
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
              }}
            >
              {t(
                "guardrails.reasonLabel",
                "Please provide a reason for this action",
              )}
              {" *"}
            </label>
            <textarea
              ref={textareaRef}
              id="confirmation-reason"
              data-testid="confirmation-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "guardrails.reasonPlaceholder",
                "E.g.: Manager approved, customer complaint...",
              )}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#141414",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                color: "#fafafa",
                fontSize: 13,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="button"
            data-testid="confirmation-cancel-btn"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "14px 0",
              background: "#1e1e1e",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              color: "#d4d4d8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("guardrails.cancel", "Cancel")}
          </button>
          <button
            type="button"
            data-testid="confirmation-confirm-btn"
            disabled={!canConfirm}
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: "14px 0",
              background: canConfirm ? ACCENT : "#333",
              border: "none",
              borderRadius: 12,
              color: canConfirm ? "#fff" : "#666",
              fontSize: 14,
              fontWeight: 700,
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            {t("guardrails.confirm", "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
