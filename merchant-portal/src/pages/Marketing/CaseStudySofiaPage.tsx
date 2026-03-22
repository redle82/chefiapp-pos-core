/**
 * CaseStudySofiaPage — Dedicated case study for Sofia Gastrobar, Ibiza.
 *
 * ChefiApp's first production restaurant. Real data, real timeline.
 * Route: /case-study/sofia-gastrobar
 *
 * Design tokens: bg-[#0b0b0f], glassmorphism, amber-500, Tailwind only, lucide-react icons.
 * Language: Mixed PT/EN (international team in Ibiza).
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Globe,
  MapPin,
  ChefHat,
  Users,
  Monitor,
  Utensils,
  LayoutGrid,
  Shield,
  Quote,
  Zap,
  CreditCard,
  Languages,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
 * DATA
 * ──────────────────────────────────────────────────────────────────────── */

const TIMELINE_STEPS = [
  { time: "0:00", label: "Account created", icon: Zap },
  { time: "0:15", label: "Restaurant identity configured", icon: ChefHat },
  { time: "0:30", label: "Menu uploaded (42 items)", icon: Utensils },
  { time: "0:45", label: "Floor plan + tables set up", icon: LayoutGrid },
  { time: "1:00", label: "Staff roles configured", icon: Users },
  { time: "1:15", label: "TPV activated", icon: Monitor },
  { time: "1:30", label: "KDS connected", icon: Monitor },
  { time: "1:45", label: "First test order completed", icon: CheckCircle2 },
  { time: "2:00", label: "Restaurant fully operational", icon: Sparkles },
] as const;

const METRICS = [
  {
    value: "< 2h",
    label: "Time to operational",
    icon: Clock,
    description: "From zero to live in a single afternoon session.",
  },
  {
    value: "42",
    label: "Menu items configured",
    icon: Utensils,
    description: "Full gastrobar menu with categories, modifiers, and pricing.",
  },
  {
    value: "0\u20AC",
    label: "Transaction fees paid",
    icon: CreditCard,
    description: "No per-transaction fees. No hidden costs. Ever.",
  },
  {
    value: "3",
    label: "Languages used daily",
    icon: Languages,
    description: "Portuguese, Spanish, and English across the entire team.",
  },
] as const;

const CHALLENGES = [
  {
    icon: ChefHat,
    title: "New gastrobar, first season",
    description:
      "Sofia Gastrobar was preparing to open for the 2025 season in Santa Eul\u00E0ria des Riu. Everything needed to be set up from scratch \u2014 menu, staff, operations.",
  },
  {
    icon: Globe,
    title: "International team (PT/ES/EN)",
    description:
      "The founding team speaks Portuguese. The staff speaks Spanish. The tourists speak English. Three languages, one system.",
  },
  {
    icon: Monitor,
    title: "Too many vendors, too much cost",
    description:
      "Traditional POS systems quoted \u20AC2,000+ upfront, monthly fees per terminal, per-transaction cuts, and separate contracts for kitchen displays and reservations.",
  },
  {
    icon: Clock,
    title: "No time for a long setup",
    description:
      "Season opening was imminent. They needed to go from zero to operational in days, not weeks. Training a rotating team on complex software was not an option.",
  },
] as const;

const SOLUTION_POINTS = [
  {
    icon: LayoutGrid,
    title: "One system instead of five",
    description:
      "POS, kitchen display, reservations, staff management, and reporting \u2014 all in one platform. No integrations to maintain.",
  },
  {
    icon: Languages,
    title: "Multi-language native",
    description:
      "Every screen, every receipt, every notification adapts to the user\u2019s language. The system speaks PT, ES, and EN out of the box.",
  },
  {
    icon: Shield,
    title: "No hardware lock-in",
    description:
      "ChefiApp runs on existing tablets and phones. No proprietary terminals, no vendor lock-in, no expensive hardware to buy.",
  },
  {
    icon: Sparkles,
    title: "Guided setup",
    description:
      "The onboarding wizard walks you through every step \u2014 identity, menu, tables, staff, payments. No consultant needed.",
  },
  {
    icon: CreditCard,
    title: "Fraction of the cost",
    description:
      "No per-transaction fees. No terminal rental. A flat monthly subscription that includes everything. The math is simple.",
  },
] as const;

/* ────────────────────────────────────────────────────────────────────────────
 * GLASSMORPHISM HELPERS
 * ──────────────────────────────────────────────────────────────────────── */

const glass =
  "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl";
const glassHover =
  "hover:bg-white/[0.07] hover:border-amber-500/20 transition-all duration-300";

/* ────────────────────────────────────────────────────────────────────────────
 * META / JSON-LD
 * ──────────────────────────────────────────────────────────────────────── */

function usePageMeta() {
  useEffect(() => {
    // Title
    document.title =
      "Sofia Gastrobar \u00B7 ChefiApp Case Study \u2014 Operational in Under 2 Hours";

    // Meta tags
    const metas: Record<string, string> = {
      description:
        "How Sofia Gastrobar in Ibiza went from zero to full restaurant operations \u2014 POS, kitchen display, reservations, and staff \u2014 in under 2 hours with ChefiApp.",
      "og:title":
        "Sofia Gastrobar \u00B7 ChefiApp Case Study \u2014 Operational in Under 2 Hours",
      "og:description":
        "From zero to full restaurant operations in a single afternoon. Real case study from Ibiza, Spain.",
      "og:type": "article",
      "og:url": "https://chefiapp.com/case-study/sofia-gastrobar",
      "og:image": "https://chefiapp.com/og/case-study-sofia.png",
      "twitter:card": "summary_large_image",
      "twitter:title":
        "Sofia Gastrobar \u00B7 ChefiApp Case Study \u2014 Operational in Under 2 Hours",
      "twitter:description":
        "From zero to full restaurant operations in a single afternoon.",
    };

    const elements: HTMLMetaElement[] = [];
    for (const [key, value] of Object.entries(metas)) {
      const meta = document.createElement("meta");
      if (key.startsWith("og:") || key.startsWith("twitter:")) {
        meta.setAttribute("property", key);
      } else {
        meta.setAttribute("name", key);
      }
      meta.setAttribute("content", value);
      document.head.appendChild(meta);
      elements.push(meta);
    }

    // JSON-LD
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline:
        "How Sofia Gastrobar went operational with ChefiApp in under 2 hours",
      description:
        "Case study: From zero to full restaurant operations in a single afternoon in Ibiza, Spain.",
      author: {
        "@type": "Organization",
        name: "ChefiApp",
        url: "https://chefiapp.com",
      },
      publisher: {
        "@type": "Organization",
        name: "ChefiApp",
        url: "https://chefiapp.com",
      },
      datePublished: "2025-05-01",
      dateModified: "2025-05-01",
      mainEntityOfPage: "https://chefiapp.com/case-study/sofia-gastrobar",
      about: {
        "@type": "Restaurant",
        name: "Sofia Gastrobar",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Santa Eul\u00E0ria des Riu",
          addressRegion: "Ibiza",
          addressCountry: "ES",
        },
      },
    });
    document.head.appendChild(jsonLd);

    return () => {
      elements.forEach((el) => el.remove());
      jsonLd.remove();
    };
  }, []);
}

/* ────────────────────────────────────────────────────────────────────────────
 * COMPONENT
 * ──────────────────────────────────────────────────────────────────────── */

export default function CaseStudySofiaPage() {
  usePageMeta();

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white antialiased">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-amber-500/[0.07] blur-[120px]" />
          <div className="absolute right-0 top-1/4 h-[300px] w-[400px] rounded-full bg-amber-600/[0.05] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 sm:pt-32 lg:pt-40">
          {/* Badge */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Case Study &middot; Ibiza
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            How{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Sofia Gastrobar
            </span>{" "}
            went operational with ChefiApp in under 2 hours
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-zinc-400 sm:text-xl">
            From zero to full restaurant operations &mdash; POS, kitchen, staff,
            reservations &mdash; in a single afternoon.
          </p>

          {/* Location */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <MapPin className="h-4 w-4 text-amber-500/70" />
            <span>Santa Eul&agrave;ria des Riu, Ibiza, Spain</span>
          </div>
        </div>
      </section>

      {/* ── THE CHALLENGE ────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <SectionLabel>The Challenge</SectionLabel>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Opening a gastrobar in Ibiza is hard enough.
            <br className="hidden sm:block" />
            <span className="text-zinc-400">
              Technology shouldn&rsquo;t make it harder.
            </span>
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {CHALLENGES.map((c) => (
              <div
                key={c.title}
                className={`${glass} ${glassHover} p-6 sm:p-8`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <c.icon className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SOLUTION ─────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        {/* Subtle divider glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="mx-auto max-w-5xl px-6">
          <SectionLabel>The Solution</SectionLabel>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            One platform. Everything included.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
            Sofia Gastrobar chose ChefiApp because it replaced an entire stack
            of legacy tools with a single, modern system that their
            multilingual team could learn in minutes.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTION_POINTS.map((s, i) => (
              <div
                key={s.title}
                className={`${glass} ${glassHover} p-6 ${
                  i === SOLUTION_POINTS.length - 1 && SOLUTION_POINTS.length % 3 !== 0
                    ? "sm:col-span-2 lg:col-span-1"
                    : ""
                }`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <s.icon className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE RESULTS — TIMELINE ───────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="mx-auto max-w-4xl px-6">
          <SectionLabel>The Results</SectionLabel>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            From zero to operational.{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              120 minutes.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-400">
            Here is exactly what happened, step by step.
          </p>

          {/* Timeline */}
          <div className="relative mt-14">
            {/* Vertical line */}
            <div className="absolute left-[27px] top-0 hidden h-full w-px bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-transparent sm:block" />

            <div className="space-y-4">
              {TIMELINE_STEPS.map((step, idx) => (
                <div
                  key={step.time}
                  className={`${glass} ${glassHover} group relative flex items-center gap-5 p-5 sm:ml-14 sm:p-6`}
                >
                  {/* Dot on the timeline (desktop) */}
                  <div className="absolute -left-[41px] hidden h-3 w-3 rounded-full border-2 border-amber-500 bg-[#0b0b0f] sm:block" />

                  {/* Time badge */}
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 font-mono text-sm font-bold text-amber-400">
                    {step.time}
                  </div>

                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                    <step.icon className="h-4 w-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                  </div>

                  {/* Label */}
                  <span className="text-sm font-medium sm:text-base">
                    {step.label}
                  </span>

                  {/* Final step highlight */}
                  {idx === TIMELINE_STEPS.length - 1 && (
                    <span className="ml-auto hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 sm:inline-flex">
                      Live
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY METRICS ──────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="mx-auto max-w-5xl px-6">
          <SectionLabel>Key Metrics</SectionLabel>
          <h2 className="mt-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Numbers that speak for themselves.
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m) => (
              <div
                key={m.label}
                className={`${glass} ${glassHover} flex flex-col items-center p-8 text-center`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <m.icon className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-3xl font-bold tracking-tight text-amber-400 sm:text-4xl">
                  {m.value}
                </span>
                <span className="mt-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  {m.label}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ────────────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="mx-auto max-w-3xl px-6">
          <div className={`${glass} relative overflow-hidden p-8 sm:p-12`}>
            {/* Decorative quote mark */}
            <Quote className="absolute -right-4 -top-4 h-32 w-32 text-amber-500/[0.04]" />

            <div className="relative">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Quote className="h-5 w-5 text-amber-500" />
              </div>

              <blockquote className="text-lg font-medium leading-relaxed text-zinc-200 sm:text-xl">
                &ldquo;We expected the setup to take days. It took an afternoon.
                The system guided us through everything &mdash; menu, tables,
                staff, payments. When we opened the next morning, everything
                just worked.&rdquo;
              </blockquote>

              <div className="mt-8 flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-lg font-bold text-amber-400">
                  SG
                </div>
                <div>
                  <p className="font-semibold text-zinc-200">
                    Sofia Gastrobar Team
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Ibiza, Spain
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 translate-y-1/3 rounded-full bg-amber-500/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Your restaurant can be next.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-400">
            Join Sofia Gastrobar and hundreds of restaurants already running on
            ChefiApp. Setup takes minutes, not months.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/auth/email"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-500/30"
            >
              Start your setup
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-zinc-300 transition-all hover:border-amber-500/30 hover:bg-white/[0.07] hover:text-white"
            >
              See all features
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <ChefHat className="h-4 w-4 text-amber-500/60" />
              <span>ChefiApp</span>
              <span className="mx-2 text-zinc-700">&middot;</span>
              <span>Restaurant Operations Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-600">
              <Link
                to="/legal/privacy"
                className="transition-colors hover:text-zinc-400"
              >
                Privacy
              </Link>
              <Link
                to="/legal/terms"
                className="transition-colors hover:text-zinc-400"
              >
                Terms
              </Link>
              <Link
                to="/contact"
                className="transition-colors hover:text-zinc-400"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * SHARED UI
 * ──────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-semibold uppercase tracking-widest text-amber-500/70">
      {children}
    </p>
  );
}
