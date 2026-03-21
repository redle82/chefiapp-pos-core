/**
 * InstallTPVPage — Download and install the ChefiApp Desktop (Electron) app.
 *
 * Shows download links for Mac/Windows, QR code for mobile scan,
 * and instructions for getting the desktop TPV running.
 *
 * This is the web-side entry point. After download + install, the user
 * opens the Electron app which lands on ElectronSetupPage for pairing.
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 3)
 */

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
  cardSubtitle: {
    fontSize: 13,
    color: "#a3a3a3",
    marginBottom: 16,
  },
  downloadBtn: {
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
    display: "block",
    textAlign: "center" as const,
    textDecoration: "none",
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
    textDecoration: "none",
    display: "block",
    marginBottom: 8,
  },
  steps: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    marginBottom: 32,
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
  skipLink: {
    fontSize: 13,
    color: "#737373",
    textAlign: "center" as const,
    marginTop: 16,
    cursor: "pointer",
    textDecoration: "underline",
  },
} as const;

export function InstallTPVPage() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.badge}>Fase: Dispositivos</div>

        <h1 style={S.title}>Instalar o Posto de Venda</h1>
        <p style={S.subtitle}>
          O ChefiApp Desktop transforma qualquer computador no cockpit do teu
          restaurante. Descarrega, instala e liga ao teu restaurante em 2
          minutos.
        </p>

        <div style={S.steps}>
          <div style={S.step}>
            <div style={S.stepNumber}>1</div>
            <div style={S.stepText}>
              Descarrega a aplicação para o teu sistema operativo
            </div>
          </div>
          <div style={S.step}>
            <div style={S.stepNumber}>2</div>
            <div style={S.stepText}>
              Instala e abre a aplicação no computador do restaurante
            </div>
          </div>
          <div style={S.step}>
            <div style={S.stepNumber}>3</div>
            <div style={S.stepText}>
              Gera um código de pareamento e insere no app desktop
            </div>
          </div>
        </div>

        {/* Download cards */}
        <div style={S.card}>
          <div style={S.cardTitle}>macOS</div>
          <div style={S.cardSubtitle}>
            Apple Silicon (M1/M2/M3) e Intel suportados
          </div>
          <a
            href="https://github.com/redle82/chefiapp-pos-core/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            style={S.downloadBtn}
          >
            Descarregar para Mac
          </a>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Windows</div>
          <div style={S.cardSubtitle}>Windows 10 ou superior (64-bit)</div>
          <a
            href="https://github.com/redle82/chefiapp-pos-core/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            style={S.downloadBtn}
          >
            Descarregar para Windows
          </a>
        </div>

        {/* Next step */}
        <button
          type="button"
          style={S.secondaryBtn}
          onClick={() => navigate("/install/pair")}
        >
          Já instalei — gerar código de pareamento
        </button>

        <div
          style={S.skipLink}
          onClick={() => navigate("/admin/home")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/admin/home");
          }}
        >
          Saltar instalação e ir para o painel
        </div>
      </div>
    </div>
  );
}
