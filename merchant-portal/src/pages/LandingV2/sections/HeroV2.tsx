/**
 * Hero V2 — Premium-tier landing hero
 *
 * Gradient text, ambient glow, scroll-aware navbar,
 * animated dashboard mockup, strong CTA hierarchy.
 * Copy via useLandingLocale (i18n/landingV2Copy).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../core/auth/useAuth";
import { useCurrency } from "../../../core/currency/useCurrency";
// Logo + text replaces old ChefIAppSignature
import { useScrollNavbar } from "../hooks/useFadeIn";
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import type { LandingLocale } from "../i18n/landingV2Copy";

const NAV_ANCHORS = [
  { key: "navSystem" as const, href: "#plataforma" },
  { key: "navAudience" as const, href: "#para-quem" },
  { key: "navPrice" as const, href: "#preco" },
  { key: "navFaq" as const, href: "#faq" },
  { key: "navBlog" as const, href: "/blog/tpv-restaurantes" },
];

const LOCALE_FLAGS: Record<LandingLocale, string> = {
  pt: "🇧🇷",
  en: "🇬🇧",
  es: "🇪🇸",
};

const LOCALE_LABELS: Record<LandingLocale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

export const HeroV2 = () => {
  const { session } = useAuth();
  const { t, locale, setLocale } = useLandingLocale();
  const { symbol } = useCurrency();
  const hasSession = !!session;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { visible, scrolled } = useScrollNavbar();

  const navLinks = NAV_ANCHORS.map(({ key, href }) => ({
    label: t(`hero.${key}`),
    href,
  }));

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* ── Ambient background glow ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-emerald-500/3 rounded-full blur-[80px]" />
      </div>

      {/* ── Navbar — hides on scroll down, shows on scroll up ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          visible ? "translate-y-0" : "-translate-y-full"
        } ${
          scrolled
            ? "bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 group"
          >
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefIApp"
              className="w-8 h-8 rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-shadow duration-300"
            />
            <span className="text-sm font-bold text-white">
              ChefIApp
              <span className="font-normal text-neutral-500 ml-0.5">
                ™ OS
              </span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const className =
                "text-sm text-neutral-400 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-amber-500 hover:after:w-full after:transition-all after:duration-300";
              if (link.href.startsWith("/")) {
                return (
                  <Link key={link.href} to={link.href} className={className}>
                    {link.label}
                  </Link>
                );
              }
              return (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Setor: idioma atual (apenas um) + seletor por bandeira */}
          <div className="flex items-center gap-3">
            <span
              className="text-xs text-neutral-500 uppercase tracking-wide"
              aria-live="polite"
            >
              {LOCALE_LABELS[locale]}
            </span>
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              {(["pt", "en", "es"] as LandingLocale[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  title={lang.toUpperCase()}
                  className={`flex items-center gap-1.5 uppercase px-2 py-1.5 rounded transition-colors ${
                    locale === lang
                      ? "text-amber-500 font-semibold ring-1 ring-amber-500/50"
                      : "hover:text-white text-neutral-400"
                  }`}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {LOCALE_FLAGS[lang]}
                  </span>
                  <span>{lang}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasSession ? (
              <Link
                to="/admin"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
              >
                {t("hero.goToSystem")}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/email"
                  className="hidden sm:inline-flex px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  {t("hero.signIn")}
                </Link>
                <Link
                  to="/auth/email"
                  className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
                >
                  {t("hero.tryFree")}
                </Link>
              </>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
            <div className="px-6 py-4 space-y-1">
              {/* Mobile brand header */}
              <div className="flex items-center gap-3 pb-4 mb-2 border-b border-white/5">
                <img
                  src="/logo-chefiapp-clean.png"
                  alt="ChefIApp"
                  className="w-10 h-10 rounded-lg shadow-[0_0_16px_rgba(245,158,11,0.3)]"
                />
                <div>
                  <span className="text-base font-bold text-white block">
                    ChefIApp
                    <span className="font-normal text-neutral-500 ml-0.5">
                      ™ OS
                    </span>
                  </span>
                  <span className="text-xs text-neutral-500">
                    Sistema Operacional do Restaurante
                  </span>
                </div>
              </div>
              {navLinks.map((link) => {
                const className =
                  "block py-3 text-sm text-neutral-300 hover:text-white transition-colors";
                if (link.href.startsWith("/")) {
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={className}
                    >
                      {link.label}
                    </Link>
                  );
                }
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={className}
                  >
                    {link.label}
                  </a>
                );
              })}
              <div className="py-2 border-t border-white/5 mt-2 space-y-2">
                <span className="text-xs text-neutral-500 uppercase tracking-wide block">
                  Idioma: {LOCALE_LABELS[locale]}
                </span>
                <div className="flex gap-2">
                  {(["pt", "en", "es"] as LandingLocale[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLocale(lang);
                        setMobileOpen(false);
                      }}
                      title={lang.toUpperCase()}
                      className={`flex items-center gap-1.5 uppercase text-xs px-2 py-1.5 rounded ${
                        locale === lang
                          ? "text-amber-500 font-semibold ring-1 ring-amber-500/50"
                          : "text-neutral-400"
                      }`}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {LOCALE_FLAGS[lang]}
                      </span>
                      <span>{lang}</span>
                    </button>
                  ))}
                </div>
              </div>
              {!hasSession && (
                <Link
                  to="/auth/email"
                  onClick={() => setMobileOpen(false)}
                  className="block mt-2 py-3 text-center text-sm font-semibold rounded-lg bg-amber-500 text-black"
                >
                  {t("hero.tryFree")}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Content ── */}
      <div className="flex-1 flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              {/* Hero brand mark */}
              <div className="mb-8">
                <div className="inline-block relative">
                  <div className="absolute -inset-3 bg-amber-500/15 rounded-full blur-xl animate-pulse-glow" />
                  <img
                    src="/logo-chefiapp-clean.png"
                    alt="ChefIApp"
                    className="relative w-20 h-20 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/20"
                  />
                </div>
                <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                    ChefIApp™ OS
                  </span>
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Sistema Operacional do Restaurante
                </p>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
                  {t("hero.badge")}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold leading-[1.08] tracking-tight mb-6">
                {t("hero.headline")}{" "}
                <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent animate-gradient">
                  {t("hero.headlineAccent")}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-3 max-w-lg">
                {t("hero.subhead")}
              </p>

              <p className="text-sm text-neutral-500 mb-1 max-w-lg">
                {t("hero.subhead2")}
              </p>
              <p className="text-sm text-neutral-500 mb-8 max-w-lg">
                {t("hero.subhead3")}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/auth/email"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                >
                  {t("hero.ctaPrimary")}
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
                <a
                  href="#plataforma"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
                >
                  {t("hero.ctaSecondary")}
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("hero.trust14")}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("hero.trustNoCard")}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("hero.trustCancel")}
                </span>
              </div>
            </div>

            {/* Right: Product visual — floating dashboard */}
            <div
              className="relative animate-float"
              data-visual-slot="hero-dashboard-runtime"
            >
              <div className="absolute -inset-8 bg-linear-to-br from-amber-500/15 via-amber-600/5 to-emerald-500/8 rounded-3xl blur-3xl opacity-60" />
              <div className="relative rounded-2xl border border-white/10 bg-neutral-900/90 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/5">
                {/* Simulated dashboard screenshot */}
                <div className="p-1">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-neutral-800/60 border-b border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-12 py-1 rounded-md bg-neutral-700/40 text-xs text-neutral-500 border border-white/5">
                        chefiapp.com/admin
                      </div>
                    </div>
                  </div>
                  {/* Dashboard mockup */}
                  <div className="bg-neutral-950 p-6 min-h-70 sm:min-h-90">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-sm text-neutral-500 mb-0.5">
                          Sofia Gastrobar
                        </div>
                        <div className="text-lg font-bold text-white">
                          Comando Central
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs text-emerald-400 font-medium">
                          Online
                        </span>
                      </div>
                    </div>
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        {
                          label: "Pedidos hoje",
                          value: "47",
                          color: "text-amber-500",
                        },
                        {
                          label: "Faturação",
                          value: `${symbol}2.340`,
                          color: "text-emerald-500",
                        },
                        {
                          label: "Mesas ativas",
                          value: "12/18",
                          color: "text-blue-400",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-neutral-900 rounded-lg p-3 border border-white/5"
                        >
                          <div className="text-xs text-neutral-500 mb-1">
                            {stat.label}
                          </div>
                          <div className={`text-xl font-bold ${stat.color}`}>
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Recent orders */}
                    <div className="space-y-2">
                      {[
                        {
                          table: "Mesa 4",
                          items: "2x Hambúrguer, 1x Batata",
                          status: "Em preparo",
                          statusColor: "bg-amber-500/20 text-amber-400",
                        },
                        {
                          table: "Mesa 7",
                          items: "1x Risotto, 2x Vinho",
                          status: "Servido",
                          statusColor: "bg-emerald-500/20 text-emerald-400",
                        },
                        {
                          table: "Mesa 12",
                          items: "3x Menu Degustação",
                          status: "Novo",
                          statusColor: "bg-blue-500/20 text-blue-400",
                        },
                      ].map((order) => (
                        <div
                          key={order.table}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-900/50 border border-white/5"
                        >
                          <div>
                            <span className="text-sm font-medium text-white">
                              {order.table}
                            </span>
                            <span className="text-xs text-neutral-500 ml-2">
                              {order.items}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${order.statusColor}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Social proof bar ── */}
      <div className="border-t border-white/5 bg-neutral-950/50 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500">
          <span>Em teste real no</span>
          <span className="font-semibold text-white">
            Sofia Gastrobar, Ibiza
          </span>
          <span className="hidden sm:inline">·</span>
          <span>Sistema operacional completo em produção</span>
        </div>
      </div>
    </section>
  );
};
