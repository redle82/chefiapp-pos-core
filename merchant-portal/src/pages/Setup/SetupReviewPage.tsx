/**
 * SetupReviewPage — Review all configuration before activation.
 *
 * Shows a summary of what has been configured, what's missing,
 * and a CTA to proceed to activation.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 1)
 */

import { useNavigate } from "react-router-dom";
import { SETUP_SECTIONS } from "../../core/setup/setupStates";
import { useSetupProgress } from "../../core/setup/SetupProgressContext";

const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #111111 40%, #1c1917 100%)",
    padding: "32px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 520,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#a3a3a3",
    lineHeight: 1.5,
    marginBottom: 32,
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    marginBottom: 32,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #262626",
    backgroundColor: "#141414",
  },
  icon: {
    fontSize: 18,
    width: 24,
    textAlign: "center" as const,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "#d4d4d4",
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 10,
  },
  badgeComplete: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    color: "#22c55e",
    border: "1px solid rgba(34, 197, 94, 0.2)",
  },
  badgePending: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    color: "#eab308",
    border: "1px solid rgba(234, 179, 8, 0.2)",
  },
  badgeOptional: {
    backgroundColor: "rgba(163, 163, 163, 0.1)",
    color: "#737373",
    border: "1px solid rgba(163, 163, 163, 0.2)",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#262626",
    overflow: "hidden" as const,
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#eab308",
    transition: "width 0.4s ease",
  },
  cta: {
    width: "100%",
    minHeight: 52,
    padding: "14px 32px",
    fontSize: 17,
    fontWeight: 700,
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    transition: "opacity 0.15s ease",
  },
  ctaDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  note: {
    fontSize: 13,
    color: "#737373",
    textAlign: "center" as const,
    marginTop: 12,
  },
} as const;

export function SetupReviewPage() {
  const navigate = useNavigate();
  const { progress } = useSetupProgress();

  // Filter out start/review/activate — they're not "configuration" items
  const configSections = SETUP_SECTIONS.filter(
    (s) => s.statusKey !== null,
  );

  // TODO: Read actual completion status from RestaurantRuntimeContext
  // For now, show all as pending — will be wired in Sprint 2
  const requiredComplete = true; // placeholder

  return (
    <div style={S.page}>
      <div style={S.container}>
        <h1 style={S.title}>Revisão da configuração</h1>
        <p style={S.subtitle}>
          Confirma o estado de cada área antes de activar o restaurante.
        </p>

        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${progress}%` }} />
        </div>

        <div style={S.list}>
          {configSections.map((section) => (
            <div key={section.id} style={S.item}>
              <span style={S.icon}>
                {section.required ? "📋" : "📦"}
              </span>
              <span style={S.itemLabel}>{section.label}</span>
              <span
                style={{
                  ...S.badge,
                  ...(section.required ? S.badgePending : S.badgeOptional),
                }}
              >
                {section.required ? "Pendente" : "Opcional"}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          style={{
            ...S.cta,
            ...(!requiredComplete ? S.ctaDisabled : {}),
          }}
          disabled={!requiredComplete}
          onClick={() => navigate("/setup/activate")}
        >
          Activar restaurante
        </button>

        <p style={S.note}>
          Podes alterar qualquer configuração depois nas definições.
        </p>
      </div>
    </div>
  );
}
