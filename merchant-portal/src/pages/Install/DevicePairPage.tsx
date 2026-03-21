/**
 * DevicePairPage — Generate pairing tokens and manage device connections.
 *
 * Web-side companion to ElectronSetupPage. The admin generates a token
 * here, then enters it in the Electron app to pair the device.
 *
 * For now, this redirects to /admin/devices where the token generation
 * UI already exists. In the future, this can become a standalone
 * simplified pairing flow.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 3)
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 24,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
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
  card: {
    padding: "24px",
    borderRadius: 16,
    border: "1px solid #262626",
    backgroundColor: "#141414",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: "#a3a3a3",
    lineHeight: 1.6,
    marginBottom: 16,
  },
  btn: {
    width: "100%",
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    transition: "opacity 0.15s ease",
    marginBottom: 8,
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid #404040",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#a3a3a3",
    textAlign: "center" as const,
  },
  steps: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    marginBottom: 24,
  },
  step: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    border: "1px solid rgba(234, 179, 8, 0.3)",
    color: "#eab308",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    fontSize: 14,
    color: "#d4d4d4",
    lineHeight: 1.5,
    paddingTop: 3,
  },
} as const;

export function DevicePairPage() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.badge}>Pareamento</div>

        <h1 style={S.title}>Ligar o dispositivo</h1>
        <p style={S.subtitle}>
          Gera um código de instalação no portal e insere-o na aplicação
          desktop para parear o dispositivo com o teu restaurante.
        </p>

        <div style={S.card}>
          <div style={S.cardTitle}>Como parear</div>
          <div style={S.steps}>
            <div style={S.step}>
              <div style={S.stepNumber}>1</div>
              <div style={S.stepText}>
                Clica em "Gerir dispositivos" para abrir o painel de
                dispositivos
              </div>
            </div>
            <div style={S.step}>
              <div style={S.stepNumber}>2</div>
              <div style={S.stepText}>
                Clica em "Gerar código de instalação" e escolhe TPV ou KDS
              </div>
            </div>
            <div style={S.step}>
              <div style={S.stepNumber}>3</div>
              <div style={S.stepText}>
                Copia o código e cola na aplicação desktop
              </div>
            </div>
            <div style={S.step}>
              <div style={S.stepNumber}>4</div>
              <div style={S.stepText}>
                O dispositivo será pareado automaticamente
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          style={S.btn}
          onClick={() => navigate("/admin/devices")}
        >
          Gerir dispositivos
        </button>

        <button
          type="button"
          style={S.secondaryBtn}
          onClick={() => navigate("/install/check")}
        >
          Já pareei — verificar ligação
        </button>
      </div>
    </div>
  );
}
