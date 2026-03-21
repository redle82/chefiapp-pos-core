/**
 * TPVActivationChecklist — Operational activation mode inside the TPV.
 *
 * Shown when the restaurant is not yet fully operational. Guides the user
 * through the remaining activation steps: open shift, test printer,
 * connect KDS, invite staff, run test order.
 *
 * Once all steps are done, the checklist disappears and normal TPV takes over.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 4)
 */

import { useNavigate } from "react-router-dom";
import {
  useOperationalActivation,
  type ActivationStep,
} from "../../core/setup/useOperationalActivation";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9000,
    fontFamily: "Inter, system-ui, sans-serif",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#141414",
    borderRadius: 20,
    border: "1px solid #262626",
    overflow: "hidden",
  },
  header: {
    padding: "24px 24px 16px",
    borderBottom: "1px solid #1f1f1f",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid rgba(234, 179, 8, 0.3)",
    backgroundColor: "rgba(234, 179, 8, 0.08)",
    color: "#eab308",
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fafafa",
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#737373",
    lineHeight: 1.5,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#1f1f1f",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#eab308",
    transition: "width 0.4s ease",
  },
  list: {
    padding: "8px 0",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 24px",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  itemActive: {
    backgroundColor: "rgba(234, 179, 8, 0.04)",
  },
  itemDone: {
    opacity: 0.5,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0,
  },
  iconDone: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#22c55e",
  },
  iconActive: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    border: "2px solid #eab308",
    color: "#eab308",
    animation: "pulse 2s ease-in-out infinite",
  },
  iconPending: {
    backgroundColor: "#1f1f1f",
    border: "1px solid #333",
    color: "#525252",
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e5e5e5",
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: "#737373",
    lineHeight: 1.4,
  },
  itemArrow: {
    color: "#525252",
    fontSize: 16,
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #1f1f1f",
    display: "flex",
    justifyContent: "center",
  },
  skipLink: {
    fontSize: 13,
    color: "#525252",
    cursor: "pointer",
    border: "none",
    background: "none",
    textDecoration: "underline",
    fontFamily: "inherit",
  },
} as const;

function getStepIcon(status: ActivationStep["status"]): string {
  switch (status) {
    case "done":
      return "✓";
    case "active":
      return "→";
    case "pending":
      return "○";
  }
}

function getIconStyle(
  status: ActivationStep["status"],
): React.CSSProperties {
  switch (status) {
    case "done":
      return { ...S.itemIcon, ...S.iconDone };
    case "active":
      return { ...S.itemIcon, ...S.iconActive };
    case "pending":
      return { ...S.itemIcon, ...S.iconPending };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TPVActivationChecklistProps {
  /** Called when the user wants to skip activation and use TPV directly */
  onSkip?: () => void;
  /** Called when an internal action needs to be executed (open-shift, test-order) */
  onAction?: (key: string) => void;
}

export function TPVActivationChecklist({
  onSkip,
  onAction,
}: TPVActivationChecklistProps) {
  const navigate = useNavigate();
  const { isOperational, steps, progress } = useOperationalActivation();

  // Don't render if already operational
  if (isOperational) return null;

  const handleStepClick = (step: ActivationStep) => {
    if (step.status === "done") return;

    if (step.action.type === "navigate") {
      navigate(step.action.to);
    } else if (step.action.type === "internal") {
      onAction?.(step.action.key);
    }
  };

  return (
    <div style={S.overlay}>
      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.badge}>Activação Operacional</div>
          <h2 style={S.title}>Preparar para operar</h2>
          <p style={S.subtitle}>
            Completa estes passos para o teu restaurante ficar ao vivo.
          </p>
        </div>

        {/* Progress bar */}
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${progress}%` }} />
        </div>

        {/* Checklist */}
        <div style={S.list}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                ...S.item,
                ...(step.status === "active" ? S.itemActive : {}),
                ...(step.status === "done" ? S.itemDone : {}),
              }}
              onClick={() => handleStepClick(step)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStepClick(step);
              }}
            >
              <div style={getIconStyle(step.status)}>
                {getStepIcon(step.status)}
              </div>
              <div style={S.itemContent}>
                <div style={S.itemLabel}>{step.label}</div>
                <div style={S.itemDesc}>{step.description}</div>
              </div>
              {step.status !== "done" && (
                <div style={S.itemArrow}>›</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button
            type="button"
            style={S.skipLink}
            onClick={onSkip}
          >
            Saltar activação e usar TPV directamente
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
