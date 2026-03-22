/**
 * LandingAustraliaPage — Localised landing page for the Australian restaurant market.
 *
 * Design: dark bg-[#0b0b0f], glassmorphism cards, amber-500 accent,
 * Tailwind-only styling, lucide-react icons. All copy in Australian English.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock,
  Monitor,
  ChefHat,
  Users,
  CalendarDays,
  Smartphone,
  Zap,
  DollarSign,
  Menu,
  X,
  LayoutDashboard,
  UtensilsCrossed,
  ChevronDown,
} from "lucide-react";
import {
  PRICE_ESSENCIAL,
  PRICE_PROFISSIONAL,
} from "../../core/pricing/canonicalPrice";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const AUD_ESSENTIAL = Math.round(PRICE_ESSENCIAL * 1.68);
const AUD_PROFESSIONAL = Math.round(PRICE_PROFISSIONAL * 1.68);

const SECTION_PADDING = "py-20 md:py-28";
const CONTAINER = "max-w-7xl mx-auto px-6";

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base md:text-lg font-medium text-white group-hover:text-amber-400 transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-amber-500" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-neutral-400 leading-relaxed text-sm md:text-base">
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function LandingAustraliaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title =
      "ChefiApp — The restaurant OS built for Australian venues";

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "POS, kitchen display, bookings, staff app and analytics — one system, one price. No transaction fees. No lock-in contracts. Built for Australian restaurants, cafes and food trucks.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white antialiased">
      {/* ================================================================ */}
      {/*  NAVBAR                                                          */}
      {/* ================================================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefiApp"
              className="w-8 h-8 rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-shadow duration-300"
            />
            <span className="text-sm font-bold text-white">
              ChefiApp
              <span className="font-normal text-neutral-500 ml-0.5">
                {" "}OS
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Platform", href: "#platform" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-amber-500 hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/auth/email"
              className="hidden sm:inline-flex px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              to="/auth/email"
              className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
            >
              Start free trial
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0b0b0f]/95 backdrop-blur-xl">
            <div className="px-6 py-4 space-y-1">
              {[
                { label: "Platform", href: "#platform" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/auth/email"
                onClick={() => setMobileMenuOpen(false)}
                className="block mt-2 py-3 text-center text-sm font-semibold rounded-lg bg-amber-500 text-black"
              >
                Start free trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ================================================================ */}
      {/*  1. HERO                                                         */}
      {/* ================================================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
        </div>

        <div className={`${CONTAINER} relative z-10 py-20 md:py-32`}>
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
                Now available in Australia
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
              The restaurant OS that{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                replaces your stack.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-8 max-w-2xl mx-auto">
              POS, kitchen display, bookings, staff app and analytics — one
              system, one price. No lock-in contracts. No transaction fees.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/auth/email"
                className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                Start your 14-day free trial
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                See the platform
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              {[
                "No card required",
                "Cancel anytime",
                "Works on any device",
              ].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  2. PROBLEM — The hidden cost of too many tools                   */}
      {/* ================================================================ */}
      <section className={SECTION_PADDING}>
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              The hidden cost of{" "}
              <span className="text-amber-500">too many tools</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Most venues run four or five disconnected systems. The result?
              Higher costs, more headaches, worse decisions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: DollarSign,
                title: "You're paying for 4+ systems that don't sync",
                desc: "Separate POS, bookings, rostering and analytics tools stack up fast and create data silos nobody can untangle.",
              },
              {
                icon: Zap,
                title: "Transaction fees chewing through your margins",
                desc: "Legacy POS providers clip 1.5-2.5% on every sale. On a solid weekend that is hundreds of dollars walking out the door.",
              },
              {
                icon: Users,
                title: "New staff can't learn your tech stack fast enough",
                desc: "When every function lives in a different app, onboarding takes days instead of hours.",
              },
              {
                icon: LayoutDashboard,
                title: "You only see what happened yesterday, not what's happening now",
                desc: "Revenue in one tool, labour costs in another. The full picture only appears in a spreadsheet — if it appears at all.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="relative group rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-amber-500/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  3. SOLUTION — One system for the whole venue                     */}
      {/* ================================================================ */}
      <section id="platform" className={SECTION_PADDING}>
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              One system for the{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                whole venue
              </span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Six integrated modules, one subscription. Every feature built to
              work together so your venue runs smoothly from open to close.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Monitor,
                title: "Point of Sale",
                desc: "Table service, counter, takeaway and delivery — one unified POS that adapts to your service style.",
                accent: "amber",
              },
              {
                icon: ChefHat,
                title: "Kitchen Display (KDS)",
                desc: "Real-time order routing to the pass. Colour-coded timers keep your kitchen on top of every ticket.",
                accent: "emerald",
              },
              {
                icon: CalendarDays,
                title: "Bookings",
                desc: "Built-in reservation management with table assignment, cover tracking and no-show protection.",
                accent: "blue",
              },
              {
                icon: Smartphone,
                title: "Staff App",
                desc: "Team rosters, QR clock-in, shift swaps and internal messaging — all from their phone.",
                accent: "violet",
              },
              {
                icon: UtensilsCrossed,
                title: "Menu Management",
                desc: "Update prices, toggle availability and manage modifiers in seconds. Changes sync everywhere instantly.",
                accent: "rose",
              },
              {
                icon: LayoutDashboard,
                title: "Live Dashboard",
                desc: "Revenue, covers, average spend, labour percentage — all your KPIs updating in real time.",
                accent: "cyan",
              },
            ].map((mod) => {
              const accentMap: Record<string, string> = {
                amber:
                  "bg-amber-500/10 text-amber-400 group-hover:shadow-amber-500/20",
                emerald:
                  "bg-emerald-500/10 text-emerald-400 group-hover:shadow-emerald-500/20",
                blue: "bg-blue-500/10 text-blue-400 group-hover:shadow-blue-500/20",
                violet:
                  "bg-violet-500/10 text-violet-400 group-hover:shadow-violet-500/20",
                rose: "bg-rose-500/10 text-rose-400 group-hover:shadow-rose-500/20",
                cyan: "bg-cyan-500/10 text-cyan-400 group-hover:shadow-cyan-500/20",
              };
              const accent = accentMap[mod.accent] ?? accentMap.amber;

              return (
                <div
                  key={mod.title}
                  className="group relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-shadow duration-300 ${accent}`}
                  >
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  4. NO TRANSACTION FEES                                          */}
      {/* ================================================================ */}
      <section className={SECTION_PADDING}>
        <div className={CONTAINER}>
          <div className="relative max-w-4xl mx-auto rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-white/[0.02] to-transparent backdrop-blur-xl p-8 md:p-14 overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
                  Zero transaction fees
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold mb-8">
                Keep more of what you earn
              </h2>

              <div className="max-w-2xl mx-auto space-y-6 text-lg text-neutral-300 leading-relaxed">
                <p>
                  An average Australian restaurant doing{" "}
                  <span className="text-white font-semibold">
                    $40,000 AUD/month
                  </span>{" "}
                  pays roughly{" "}
                  <span className="text-red-400 font-semibold">
                    $1,000 AUD/month
                  </span>{" "}
                  in POS transaction fees (2.5%).
                </p>

                <div className="flex items-center justify-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <span className="text-neutral-500 text-sm font-medium uppercase tracking-wider">
                    With ChefiApp
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                <p className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  $0
                </p>

                <p className="text-neutral-400">
                  The plan price is all you pay. No per-transaction charges, no
                  hidden percentages, no surprises at month end.
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5">
                <p className="text-sm text-neutral-500 max-w-lg mx-auto">
                  That is up to{" "}
                  <span className="text-amber-400 font-semibold">
                    $12,000 AUD per year
                  </span>{" "}
                  back in your pocket — enough to hire another kitchen hand or
                  upgrade your fit-out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  5. SETUP — Get operational fast                                 */}
      {/* ================================================================ */}
      <section className={SECTION_PADDING}>
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Get operational{" "}
              <span className="text-amber-500">fast</span>
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              No technician visit. No proprietary hardware. From signup to
              service in under one hour.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent hidden sm:block" />

              <div className="space-y-10">
                {[
                  {
                    step: "1",
                    title: "Create your account",
                    desc: "Sign up with your email. No credit card needed during the trial period.",
                    time: "2 min",
                  },
                  {
                    step: "2",
                    title: "Configure your venue",
                    desc: "Set your venue name, service type, tables and opening hours.",
                    time: "10 min",
                  },
                  {
                    step: "3",
                    title: "Upload your menu",
                    desc: "Add categories, items, modifiers and prices. Copy-paste from a spreadsheet or type them in.",
                    time: "20 min",
                  },
                  {
                    step: "4",
                    title: "Activate your POS",
                    desc: "Open ChefiApp on any tablet, laptop or phone. You're live.",
                    time: "5 min",
                  },
                ].map((item) => (
                  <div key={item.step} className="relative flex gap-6">
                    {/* Step circle */}
                    <div className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-500">
                        {item.step}
                      </span>
                    </div>

                    <div className="pb-2">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {item.title}
                        </h3>
                        <span className="flex items-center gap-1 text-xs text-neutral-500 bg-white/5 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  6. PRICING — Transparent and fair                               */}
      {/* ================================================================ */}
      <section id="pricing" className={SECTION_PADDING}>
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Simple,{" "}
              <span className="text-amber-500">transparent</span> pricing
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              No transaction fees. No hidden costs. No lock-in contracts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Essential */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-1">Essential</h3>
              <p className="text-sm text-neutral-500 mb-6">
                For single-site venues getting started
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {"\u20AC"}{PRICE_ESSENCIAL}
                  </span>
                  <span className="text-neutral-500">/mo</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  approximately ${AUD_ESSENTIAL} AUD/mo at current rates
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Full POS (table, counter, takeaway)",
                  "Kitchen display (KDS)",
                  "Menu management",
                  "Basic dashboard & reports",
                  "1 location",
                  "Email support",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-neutral-300"
                  >
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                to="/auth/email"
                className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                Start 14-day free trial
              </Link>
            </div>

            {/* Professional */}
            <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent backdrop-blur-sm p-8 flex flex-col">
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500 text-black">
                  Most popular
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                Professional
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                For venues that want the full toolkit
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {"\u20AC"}{PRICE_PROFISSIONAL}
                  </span>
                  <span className="text-neutral-500">/mo</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  approximately ${AUD_PROFESSIONAL} AUD/mo at current rates
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Everything in Essential",
                  "Bookings & table management",
                  "Staff app with QR clock-in",
                  "Advanced analytics & KPIs",
                  "Multi-location support",
                  "Priority support",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-neutral-300"
                  >
                    <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                to="/auth/email"
                className="w-full group inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20"
              >
                Start 14-day free trial
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-8">
            Prices shown in EUR. AUD equivalents are approximate and may vary
            with exchange rates. GST may apply.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  7. FAQ — Australia-focused                                      */}
      {/* ================================================================ */}
      <section id="faq" className={SECTION_PADDING}>
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="max-w-3xl mx-auto rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 md:p-8">
            {[
              {
                q: "Does it work with Australian payment processors?",
                a: "Yes. ChefiApp integrates with Stripe Australia for card payments. You get Stripe's standard Australian processing rates. ChefiApp itself charges zero additional transaction fees on top.",
              },
              {
                q: "Do I need specific hardware?",
                a: "No. ChefiApp runs in any modern web browser. Use a tablet, laptop, desktop or phone you already own. Any iPad, Android tablet or even a secondhand device works perfectly.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. All data is encrypted in transit (TLS) and at rest. We use Supabase with Row-Level Security so each venue can only access its own data. The system meets GDPR-grade security standards with data residency options.",
              },
              {
                q: "Can I use it for a cafe or food truck?",
                a: "Absolutely. The Essential plan is built for exactly this — counter service, quick-order flow, menu management and a KDS. No unnecessary complexity.",
              },
              {
                q: "What about GST?",
                a: "ChefiApp does not handle GST filing directly, but all sales records, reports and transaction data are fully exportable in CSV format so your accountant or BAS agent can process them easily.",
              },
              {
                q: "Does it work offline?",
                a: "Yes. ChefiApp is a Progressive Web App (PWA) that caches locally. If your internet drops mid-service, you can continue taking orders. Data syncs automatically when connectivity returns.",
              },
            ].map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  8. FINAL CTA                                                    */}
      {/* ================================================================ */}
      <section className={`${SECTION_PADDING} relative overflow-hidden`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        </div>

        <div className={`${CONTAINER} relative z-10`}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
              Your venue deserves a better system.
            </h2>
            <p className="text-lg text-neutral-400 mb-10 max-w-2xl mx-auto">
              Join venues across Australia switching to a modern operating
              system that grows with their business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/auth/email"
                className="group inline-flex items-center justify-center px-10 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                Start free trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              {[
                "14 days free",
                "No credit card",
                "Set up in under an hour",
              ].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  FOOTER                                                          */}
      {/* ================================================================ */}
      <footer className="border-t border-white/5 py-12">
        <div className={CONTAINER}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-chefiapp-clean.png"
                alt="ChefiApp"
                className="w-7 h-7 rounded-lg"
              />
              <span className="text-sm font-bold text-white">
                ChefiApp
                <span className="font-normal text-neutral-500 ml-0.5">
                  {" "}OS
                </span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <a
                href="#platform"
                className="hover:text-white transition-colors"
              >
                Platform
              </a>
              <a
                href="#pricing"
                className="hover:text-white transition-colors"
              >
                Pricing
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
              <Link
                to="/auth/email"
                className="hover:text-white transition-colors"
              >
                Sign in
              </Link>
            </div>

            <p className="text-xs text-neutral-600">
              &copy; {new Date().getFullYear()} ChefiApp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
