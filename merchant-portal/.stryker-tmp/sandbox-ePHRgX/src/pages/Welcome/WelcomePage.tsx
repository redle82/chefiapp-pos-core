/**
 * Bem-vindo — Primeira tela pós-Marketing (camada de Ativação).
 *
 * Não é dashboard nem POS. Após auth/signup, o utilizador vê esta tela
 * com CTA "Começar Configuração Guiada" → Onboarding assistente (/onboarding).
 *
 * Ref: docs/contracts/FUNIL_VIDA_CLIENTE.md#arquitetura-de-jornada-em-3-camadas
 */
// @ts-nocheck


import { useNavigate } from "react-router-dom";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #1c1917 100%)",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: 40,
    borderRadius: 16,
    border: "1px solid #262626",
    backgroundColor: "rgba(23, 23, 23, 0.95)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    textAlign: "center" as const,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    marginBottom: 12,
    color: "#fafafa",
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  subtitle: {
    fontSize: 15,
    color: "#a3a3a3",
    marginBottom: 32,
    lineHeight: 1.5,
  },
  cta: {
    display: "inline-block",
    minHeight: 48,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    textDecoration: "none",
  },
};

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Bem-vindo ao seu restaurante digital.</h1>
        <p style={styles.subtitle}>
          Em poucos passos configuramos o essencial: nome, tipo, país e opções
          de operação. Depois segue para o Centro de Ativação com checklist
          claro.
        </p>
        <button
          type="button"
          style={styles.cta}
          onClick={() => navigate("/onboarding")}
        >
          Começar Configuração Guiada
        </button>
      </div>
    </div>
  );
}
