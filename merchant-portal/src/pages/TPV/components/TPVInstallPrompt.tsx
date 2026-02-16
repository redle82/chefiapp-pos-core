/**
 * TPVInstallPrompt — Na página /op/tpv ou /op/kds, quando aberto no browser (não PWA),
 * mostra um aviso para instalar a aplicação e usar sem barra do navegador.
 * Reutiliza o evento beforeinstallprompt (PWA) quando disponível.
 * Use variant="kds" no KDS para chave de dismiss e textos próprios.
 */

import { useEffect, useState } from "react";

const DISMISS_KEYS = {
  tpv: "chefiapp_tpv_install_dismissed",
  kds: "chefiapp_kds_install_dismissed",
} as const;

const DEFAULTS = {
  tpv: {
    title: "Usar TPV como app",
    description:
      "Para usar sem o navegador: instale a aplicação ou adicione ao ecrã inicial.",
  },
  kds: {
    title: "Usar KDS como app",
    description:
      "Para usar sem o navegador: instale a aplicação ou adicione ao ecrã inicial.",
  },
} as const;

interface TPVInstallPromptProps {
  /** "tpv" | "kds" — define chave de dismiss e textos por defeito. */
  variant?: "tpv" | "kds";
  title?: string;
  description?: string;
}

export const TPVInstallPrompt = ({
  variant = "tpv",
  title,
  description,
}: TPVInstallPromptProps) => {
  const dismissKey = DISMISS_KEYS[variant];
  const defaults = DEFAULTS[variant];
  const finalTitle = title ?? defaults.title;
  const finalDescription = description ?? defaults.description;

  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(!!standalone);
    try {
      if (localStorage.getItem(dismissKey) === "1") setDismissed(true);
    } catch {
      // ignore
    }
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as unknown as {
        prompt(): Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      setInstallPrompt(ev);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [dismissKey]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // ignore
    }
  };

  if (isStandalone || dismissed) return null;

  return (
    <div
      role="region"
      aria-label={finalTitle}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 12px",
        backgroundColor: "var(--surface-elevated, #171717)",
        borderBottom: "1px solid var(--surface-border, #262626)",
        fontSize: 12,
        color: "var(--text-secondary, #a3a3a3)",
        flexWrap: "wrap",
      }}
    >
      <span style={{ flex: "1 1 200px" }}>{finalDescription}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {installPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-inverse, #0a0a0a)",
              backgroundColor: "var(--color-primary, #eab308)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Instalar aplicação
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            color: "var(--text-tertiary, #737373)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Ocultar
        </button>
      </div>
    </div>
  );
};
