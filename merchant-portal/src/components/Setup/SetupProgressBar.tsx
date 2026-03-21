/**
 * SetupProgressBar — Dual-level progress indicator for restaurant setup.
 *
 * Macro level: Shows the 8 major phases (Identidade → Ao Vivo)
 * Micro level: Shows completion of individual sections within the current phase
 *
 * Reads from SetupProgressEngine via useSetupProgressFromRuntime hook.
 * Purely presentational — no state management.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 2)
 */

import { SETUP_PHASES, SETUP_SECTIONS } from "../../core/setup/setupStates";
import { useSetupProgressFromRuntime } from "../../core/setup/useSetupProgressFromRuntime";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = {
  container: {
    padding: "16px 20px",
    borderBottom: "1px solid #262626",
    backgroundColor: "#0d0d0d",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  macroRow: {
    display: "flex",
    gap: 4,
    marginBottom: 12,
  },
  macroStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#262626",
    transition: "background-color 0.3s ease",
  },
  macroStepActive: {
    backgroundColor: "#eab308",
  },
  macroStepComplete: {
    backgroundColor: "#22c55e",
  },
  labels: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#eab308",
    letterSpacing: "0.02em",
  },
  progressLabel: {
    fontSize: 12,
    color: "#737373",
  },
  microRow: {
    display: "flex",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap" as const,
  },
  microItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#737373",
  },
  microDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#333",
  },
  microDotComplete: {
    backgroundColor: "#22c55e",
  },
  microDotActive: {
    backgroundColor: "#eab308",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SetupProgressBarProps {
  /** Show micro-level section details (default: true) */
  showMicro?: boolean;
  /** Compact mode — no labels, just the bar */
  compact?: boolean;
}

export function SetupProgressBar({
  showMicro = true,
  compact = false,
}: SetupProgressBarProps) {
  const { phase, phaseIndex, progress, state } = useSetupProgressFromRuntime();

  // Determine which sections have been completed
  // We read this from the progress state — sections with statusKey map to setup_status flags
  const configSections = SETUP_SECTIONS.filter((s) => s.statusKey !== null);

  return (
    <div style={S.container}>
      {/* ── Macro Progress Bar ──────────────────────────────── */}
      <div style={S.macroRow}>
        {SETUP_PHASES.map((p, i) => (
          <div
            key={p}
            style={{
              ...S.macroStep,
              ...(i < phaseIndex ? S.macroStepComplete : {}),
              ...(i === phaseIndex ? S.macroStepActive : {}),
            }}
            title={p}
          />
        ))}
      </div>

      {/* ── Labels ──────────────────────────────────────────── */}
      {!compact && (
        <div style={S.labels}>
          <span style={S.phaseLabel}>{phase}</span>
          <span style={S.progressLabel}>{progress}% concluído</span>
        </div>
      )}

      {/* ── Micro Progress (section-level) ──────────────────── */}
      {showMicro && !compact && (
        <div style={S.microRow}>
          {configSections.map((section) => {
            // Determine if this section's state is before or after current setup state
            const isRequired = section.required;
            return (
              <div key={section.id} style={S.microItem}>
                <div
                  style={{
                    ...S.microDot,
                    ...(isRequired ? S.microDotActive : {}),
                  }}
                />
                <span>{section.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
