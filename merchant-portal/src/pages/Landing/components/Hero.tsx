/**
 * Hero Component - Landing Page
 *
 * CTA principal: "Começar agora" → /auth; "Ver o sistema" → /auth; "Já tenho acesso" → /auth (link).
 * Com sessão: "Entrar no sistema" → /admin (apenas por clique; landing nunca redireciona sozinha).
 */
import { Link } from "react-router-dom";
import { useAuth } from "../../../core/auth/useAuth";
import { ChefIAppSignature } from "../../../ui/design-system/sovereign/ChefIAppSignature";
import { OSCopy } from "../../../ui/design-system/sovereign/OSCopy";

const WHATSAPP_NUMBER =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { VITE_CONTACT_WHATSAPP?: string } })
      ?.env?.VITE_CONTACT_WHATSAPP) ||
  "351000000000";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

export const Hero = () => {
  const { session, loading } = useAuth();
  const hasSession = !!session;

  return (
    <div
      className="min-h-screen bg-transparent text-[var(--text-primary)] flex flex-col relative overflow-hidden"
      data-landing-rev="signature-v2"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-amber-950/10 pointer-events-none z-0" />

      <header className="w-full absolute top-0 left-0 p-6 z-50 flex justify-between items-center">
        <div className="opacity-0 md:opacity-100 transition-opacity">
          <ChefIAppSignature variant="full" size="sm" tone="gold" />
        </div>
        <Link
          to={hasSession ? "/admin" : "/auth"}
          className="px-6 py-2 rounded-full border text-sm font-medium transition-all bg-[var(--surface-elevated)] border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]"
        >
          {hasSession
            ? OSCopy.landing.ctaIrAoSistema
            : OSCopy.landing.ctaJaTenhoAcesso}
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-20 px-6 text-center mt-12 md:mt-0">
        <div className="mb-12 relative group">
          <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000"></div>
          <img
            src="/Logo Chefiapp.png"
            alt="Sovereign Logo"
            className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.3)] mix-blend-screen brightness-90 contrast-125"
            style={{
              maskImage: "radial-gradient(circle, black 40%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(circle, black 40%, transparent 70%)",
            }}
          />
        </div>

        <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[var(--color-primary)]/30 bg-black/50 backdrop-blur-sm">
            <ChefIAppSignature variant="full" size="sm" tone="gold" />
          </div>
          {/* Indicador de runtime (§7) — visível para confirmar consciência de sessão */}
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--surface-border)] bg-[var(--surface-overlay)] text-[var(--text-secondary)]"
            aria-live="polite"
          >
            {loading
              ? "A verificar sessão…"
              : hasSession
              ? "Sessão ativa"
              : "Modo visita"}
          </span>
        </div>

        <h1 className="font-outfit text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight max-w-5xl mx-auto text-[var(--text-primary)]">
          {OSCopy.landing.heroTitle}
          <br />
          <span className="text-[var(--color-primary)]">
            {OSCopy.landing.heroSubtitle}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto leading-relaxed">
          {OSCopy.landing.heroDescriptionShort}
        </p>

        <p className="text-[var(--text-secondary)] text-base mb-2 max-w-2xl mx-auto">
          {OSCopy.landing.trialPriceCopy}
        </p>
        <p className="text-[var(--color-primary)] text-sm font-medium mb-8 max-w-2xl mx-auto">
          {OSCopy.landing.overlayPrice}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-2xl mx-auto flex-wrap">
          {hasSession ? (
            <Link
              to="/admin"
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:opacity-90 text-[var(--text-inverse)] font-extrabold text-lg rounded-xl shadow-[var(--elevation-primary)] transition-all transform hover:-translate-y-1"
            >
              {OSCopy.landing.ctaIrAoSistema}
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:opacity-90 text-[var(--text-inverse)] font-extrabold text-lg rounded-xl shadow-[var(--elevation-primary)] transition-all transform hover:-translate-y-1"
              >
                {OSCopy.landing.ctaComecarAgora}
              </Link>
              <span className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
                <Link
                  to="/auth"
                  className="font-medium hover:text-[var(--color-primary)] transition-colors"
                >
                  {OSCopy.landing.ctaVerSistema3Min}
                </Link>
                <span className="text-[var(--text-disabled)]">·</span>
                <Link
                  to="/auth"
                  className="font-medium hover:text-[var(--color-primary)] transition-colors"
                >
                  {OSCopy.landing.ctaJaTenhoAcesso}
                </Link>
              </span>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[#25D366] transition-colors"
              >
                WhatsApp
              </a>
            </>
          )}
        </div>
        {!hasSession && (
          <p className="text-[var(--text-tertiary)] text-xs max-w-xl mx-auto mt-6 leading-relaxed">
            {OSCopy.landing.whatHappensNext}
          </p>
        )}
      </main>
    </div>
  );
};
