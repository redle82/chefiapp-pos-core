/**
 * ExitBannerV2 — "Falta um passo" (conversão, uma vez por sessão).
 *
 * Barra fixa no fundo, dismissível. Não bloqueia conteúdo.
 * TECNICAS_AVANCADAS §3: uma mensagem única, link para /auth/phone, sem insistência.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "chefiapp_landing_exit_banner_dismissed";

interface ExitBannerV2Props {
  message: string;
  cta: string;
  dismissLabel: string;
}

export function ExitBannerV2({ message, cta, dismissLabel }: ExitBannerV2Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-neutral-950/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
      role="banner"
      aria-label={message}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <span className="text-sm text-neutral-300">{message}</span>
        <Link
          to="/auth/phone"
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors shrink-0"
        >
          {cta}
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2 shrink-0"
          aria-label={dismissLabel}
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
