/**
 * InstallAppPrompt — Promove instalação do ChefIApp como app (PWA)
 *
 * Mostra CTA "Adicionar ao ecrã" / "Instalar ChefIApp" quando o browser
 * dispara beforeinstallprompt e o app ainda não está em standalone.
 * Usado no Dashboard e nas primeiras entradas em TPV / App Staff.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "chefiapp_install_prompt_dismissed";

export function InstallAppPrompt({
  title = "Instalar ChefIApp",
  description = "Adicione ao ecrã para abrir o TPV, KDS e App Staff como uma app. Um ícone no telemóvel ou no desktop.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const [installPrompt, setInstallPrompt] = useState<{
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setDismissed(true);
    } catch {
      // ignore
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as unknown as {
        prompt(): Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      setInstallPrompt(ev);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setIsStandalone(true);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (isStandalone || dismissed || !installPrompt) return null;

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderRadius: 10,
          backgroundColor: "rgba(102, 126, 234, 0.12)",
          border: "1px solid rgba(102, 126, 234, 0.35)",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 20 }}>📲</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{description}</div>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#667eea",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: 4,
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "90%",
        maxWidth: 400,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#fff",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 15, color: "#1e293b" }}>{title}</strong>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 18,
          }}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
      <p
        style={{
          fontSize: 13,
          color: "#64748b",
          margin: "0 0 12px",
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          width: "100%",
          padding: "10px 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: "#667eea",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Adicionar ao ecrã
      </button>
    </div>
  );
}
