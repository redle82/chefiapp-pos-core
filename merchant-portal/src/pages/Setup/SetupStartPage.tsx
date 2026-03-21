/**
 * SetupStartPage — First page of the restaurant setup journey.
 *
 * Shows a welcome message, an overview of what will be configured,
 * and a single CTA to begin. This replaces WelcomePage as the
 * canonical entry point for new users.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 1)
 */

import { useNavigate } from "react-router-dom";
import { useSetupProgress } from "../../core/setup/SetupProgressContext";
import { SETUP_PHASES } from "../../core/setup/setupStates";

const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #111111 40%, #1c1917 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
  },
  container: {
    width: "100%",
    maxWidth: 520,
    textAlign: "center" as const,
  },
  logo: {
    width: 80,
    height: 80,
    margin: "0 auto 24px",
    borderRadius: 20,
    backgroundColor: "#1c1917",
    border: "1px solid #292524",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    filter: "drop-shadow(0 0 20px rgba(234, 179, 8, 0.3))",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#a3a3a3",
    lineHeight: 1.6,
    marginBottom: 32,
  },
  phases: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    justifyContent: "center",
    marginBottom: 32,
  },
  phase: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid #333",
    backgroundColor: "#141414",
    fontSize: 12,
    fontWeight: 500,
    color: "#a3a3a3",
  },
  phaseActive: {
    borderColor: "#eab308",
    backgroundColor: "rgba(234, 179, 8, 0.08)",
    color: "#eab308",
  },
  cta: {
    width: "100%",
    maxWidth: 320,
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
    marginBottom: 16,
  },
  time: {
    fontSize: 13,
    color: "#737373",
  },
} as const;

export function SetupStartPage() {
  const navigate = useNavigate();
  const { phaseIndex } = useSetupProgress();

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.logo}>
          <span role="img" aria-label="chef">
            👨‍🍳
          </span>
        </div>

        <h1 style={S.title}>Vamos configurar o teu restaurante</h1>
        <p style={S.subtitle}>
          Em poucos minutos vais ter tudo pronto para operar.
          <br />
          Cada passo desbloqueia o seguinte automaticamente.
        </p>

        <div style={S.phases}>
          {SETUP_PHASES.map((phase, i) => (
            <span
              key={phase}
              style={{
                ...S.phase,
                ...(i <= phaseIndex ? S.phaseActive : {}),
              }}
            >
              {phase}
            </span>
          ))}
        </div>

        <button
          type="button"
          style={S.cta}
          onClick={() => navigate("/setup?section=identity")}
        >
          Começar configuração
        </button>

        <p style={S.time}>Tempo estimado: 15-30 minutos</p>
      </div>
    </div>
  );
}
