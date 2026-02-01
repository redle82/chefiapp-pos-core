/**
 * InstallPage — Instalar TPV / KDS como Web App Operacional Instalável
 *
 * /app/install — Explica "Instalar TPV / KDS", dois cards (TPV, KDS),
 * instruções por navegador (Chrome/Edge, Safari iPad/iPhone, Safari macOS),
 * botões "Abrir TPV" e "Abrir KDS" que abrem em nova aba.
 * Apenas capacidades nativas do browser (sem Electron, sem PWA complexo).
 */

import { useMemo } from "react";

const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    backgroundColor: "#0a0a0a",
    color: "#fafafa",
    fontFamily: "Inter, system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
  },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#a3a3a3", marginBottom: 32, lineHeight: 1.5 },
  card: {
    padding: 24,
    borderRadius: 12,
    border: "1px solid #262626",
    backgroundColor: "#141414",
    marginBottom: 24,
  },
  cardTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: "#a3a3a3", marginBottom: 16, lineHeight: 1.5 },
  link: { fontSize: 13, color: "#eab308", wordBreak: "break-all" as const },
  section: { marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: "#737373", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 },
  instructions: { fontSize: 14, color: "#d4d4d4", lineHeight: 1.6, margin: 0 },
  btn: {
    display: "inline-block",
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    marginTop: 16,
    marginRight: 12,
  },
  btnPrimary: { backgroundColor: "#eab308", color: "#0a0a0a" },
  btnSecondary: { backgroundColor: "transparent", color: "#a3a3a3", border: "1px solid #404040" },
};

function useBaseUrl(): string {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);
}

export function InstallPage() {
  const baseUrl = useBaseUrl();
  const tpvUrl = `${baseUrl}/op/tpv`;
  const kdsUrl = `${baseUrl}/op/kds`;

  const openTpv = () => window.open(tpvUrl, "_blank", "noopener,noreferrer");
  const openKds = () => window.open(kdsUrl, "_blank", "noopener,noreferrer");

  return (
    <div style={styles.page}>
        <h1 style={styles.title}>Instalar TPV e KDS</h1>
        <p style={styles.subtitle}>
          Instale o TPV (Caixa) e o KDS (Cozinha) como apps dedicados em tela cheia, sem barra do navegador.
          Use apenas o modo nativo do browser — sem software extra.
        </p>

        {/* Card TPV */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>TPV (Caixa)</h2>
          <p style={styles.cardDesc}>
            Abra o link abaixo no Chrome, Edge ou Safari e use a opção do navegador para “Instalar app” ou “Adicionar à tela de início”.
          </p>
          <p style={styles.link}>{tpvUrl}</p>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Chrome / Edge (Windows ou macOS)</div>
            <p style={styles.instructions}>
              Abra o TPV no Chrome ou Edge e clique em: Menu ⋮ → “Instalar app” ou “Criar atalho” → Abrir como janela.
            </p>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Safari (iPad / iPhone)</div>
            <p style={styles.instructions}>
              Compartilhar → Adicionar à Tela de Início.
            </p>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Safari (macOS)</div>
            <p style={styles.instructions}>
              Arquivo → Adicionar ao Dock (quando disponível), ou Adicionar aos Favoritos e abrir em tela cheia.
            </p>
          </div>
          <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={openTpv}>
            Abrir TPV
          </button>
        </div>

        {/* Card KDS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>KDS (Cozinha)</h2>
          <p style={styles.cardDesc}>
            Abra o link abaixo no Chrome, Edge ou Safari e use a opção do navegador para “Instalar app” ou “Adicionar à tela de início”.
          </p>
          <p style={styles.link}>{kdsUrl}</p>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Chrome / Edge (Windows ou macOS)</div>
            <p style={styles.instructions}>
              Abra o KDS no Chrome ou Edge e clique em: Menu ⋮ → “Instalar app” ou “Criar atalho” → Abrir como janela.
            </p>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Safari (iPad / iPhone)</div>
            <p style={styles.instructions}>
              Compartilhar → Adicionar à Tela de Início.
            </p>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Safari (macOS)</div>
            <p style={styles.instructions}>
              Arquivo → Adicionar ao Dock (quando disponível), ou Adicionar aos Favoritos e abrir em tela cheia.
            </p>
          </div>
          <button type="button" style={{ ...styles.btn, ...styles.btnPrimary }} onClick={openKds}>
            Abrir KDS
          </button>
        </div>
      </div>
  );
}
