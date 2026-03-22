/**
 * LandingNZPage — Localized landing page for the New Zealand restaurant market.
 *
 * Design: dark glassmorphism (bg-[#0b0b0f]), amber-500 accents, Tailwind-only.
 * Copy: English with a friendly, down-to-earth NZ-market tone.
 * Pricing: EUR with NZD approximations.
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
  Shield,
  Zap,
  DollarSign,
  ChevronDown,
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
} from "lucide-react";
import {
  PRICE_ESSENCIAL,
  PRICE_PROFISSIONAL,
} from "../../core/pricing/canonicalPrice";

/* ─── Reusable sub-components ─── */

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      <span className="inline-block text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-neutral-400 text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-base font-medium text-white">{q}</span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-60 pb-5" : "max-h-0"}`}
      >
        <p className="text-neutral-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export function LandingNZPage() {
  useEffect(() => {
    document.title =
      "ChefiApp — A smarter way to run your restaurant | New Zealand";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "ChefiApp is the all-in-one restaurant operating system. POS, kitchen display, bookings, staff tools and dashboard — one subscription, no transaction fees. Built for New Zealand hospitality teams.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white antialiased">
      {/* ================================================================
          1. HERO
          ================================================================ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px]" />
        </div>

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0f]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2.5 group">
              <img
                src="/logo-chefiapp-clean.png"
                alt="ChefiApp"
                className="w-8 h-8 rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              />
              <span className="text-sm font-bold text-white">
                ChefiApp
                <span className="font-normal text-neutral-500 ml-0.5">
                  {" "}OS
                </span>
              </span>
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
              <a href="#solution" className="hover:text-white transition-colors">
                Platform
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </div>
            <Link
              to="/auth/email"
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
            >
              Start free
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-36 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
                Now available in New Zealand
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6">
              A smarter way to run{" "}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                your restaurant.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              One platform for POS, kitchen, bookings, staff and operations.
              Built for hospitality teams who want less admin and more service.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                to="/auth/email"
                className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                Start free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#solution"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                See how it works
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              {[
                "No card required",
                "No lock-in",
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

      {/* ================================================================
          2. PROBLEM — Too much admin, not enough hospitality
          ================================================================ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow="The problem"
            title="Too much admin, not enough hospitality"
            subtitle="Sound familiar? Most venues across Aotearoa juggle four or five systems just to get through a service."
          />

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                text: "Your POS, bookings and roster live in different places",
                icon: Monitor,
              },
              {
                text: "Staff spend more time on systems than on customers",
                icon: Clock,
              },
              {
                text: "You can't see the full picture until you close up",
                icon: LayoutDashboard,
              },
              {
                text: "Every new tool means more training and more monthly cost",
                icon: DollarSign,
              },
            ].map(({ text, icon: Icon }) => (
              <GlassCard key={text} className="p-6 flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed pt-1.5">
                  {text}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          3. SOLUTION — Everything your venue needs
          ================================================================ */}
      <section id="solution" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow="The solution"
            title="Everything your venue needs"
            subtitle="ChefiApp brings your service, kitchen, bookings, team and data together in a single platform. No integrations, no headaches."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: UtensilsCrossed,
                title: "POS",
                desc: "Table service, counter and takeaway — all in one interface. Tap, send, done.",
              },
              {
                icon: ChefHat,
                title: "Kitchen Display",
                desc: "Orders appear on screen the moment they're placed. No paper dockets, no shouting across the pass.",
              },
              {
                icon: CalendarDays,
                title: "Bookings",
                desc: "Built-in reservations with table management. No third-party fees, no commission per cover.",
              },
              {
                icon: Users,
                title: "Staff App",
                desc: "Team coordination with QR clock-in. Everyone knows their section and tasks for the shift.",
              },
              {
                icon: ClipboardList,
                title: "Menu Builder",
                desc: "Set up your full menu in minutes. Categories, modifiers, dietary info — sorted.",
              },
              {
                icon: LayoutDashboard,
                title: "Dashboard",
                desc: "See your day at a glance. Revenue, covers, popular items — all in real time.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <GlassCard key={title} className="p-6 group hover:border-amber-500/20 transition-colors duration-300">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          4. ONBOARDING — Set up your venue, not your patience
          ================================================================ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeading
            eyebrow="Getting started"
            title="Set up your venue, not your patience"
            subtitle="From signup to service in under an hour. No consultants, no installation team, no waiting around."
          />

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-transparent hidden sm:block" />

            <div className="space-y-10">
              {[
                {
                  step: "1",
                  title: "Create your account",
                  desc: "Sign up with your email. Takes about 30 seconds. No card, no commitment.",
                },
                {
                  step: "2",
                  title: "Build your menu",
                  desc: "Add your dishes, set prices, group them by category. The guided flow walks you through it.",
                },
                {
                  step: "3",
                  title: "Set up your floor",
                  desc: "Drag and drop your tables, name your sections, assign your team. Easy as.",
                },
                {
                  step: "4",
                  title: "Go live",
                  desc: "Open the POS on any tablet or laptop, take your first order and see it appear in the kitchen instantly.",
                },
              ].map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="flex items-start gap-6 sm:pl-0"
                >
                  <div className="shrink-0 w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm z-10">
                    {step}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-base font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          5. PRICING — Straight-up pricing
          ================================================================ */}
      <section id="pricing" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="Straight-up pricing"
            subtitle="No transaction fees. No hidden costs. The price you see is the price you pay."
          />

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Essential */}
            <GlassCard className="p-8">
              <h3 className="text-lg font-bold mb-1">Essential</h3>
              <p className="text-sm text-neutral-500 mb-6">
                For smaller venues, food trucks and pop-ups
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-white">
                  &euro;{PRICE_ESSENCIAL}
                </span>
                <span className="text-neutral-500 text-sm">/month</span>
              </div>
              <p className="text-xs text-neutral-600 mb-6">
                ~$92 NZD/month
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "POS with table and counter modes",
                  "Kitchen display (KDS)",
                  "Menu builder with modifiers",
                  "Daily sales dashboard",
                  "1 location",
                  "Email support",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-neutral-300"
                  >
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/email"
                className="block text-center py-3 rounded-xl border border-white/10 text-sm font-semibold hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                Start free trial
              </Link>
            </GlassCard>

            {/* Professional */}
            <div className="relative">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-500/30 to-amber-500/5 pointer-events-none" />
              <GlassCard className="relative p-8 border-amber-500/20">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500 uppercase tracking-wide mb-4">
                  <Zap className="w-3 h-3" />
                  Most popular
                </div>
                <h3 className="text-lg font-bold mb-1">Professional</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  For restaurants ready to run everything in one place
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-white">
                    &euro;{PRICE_PROFISSIONAL}
                  </span>
                  <span className="text-neutral-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-neutral-600 mb-6">
                  ~$185 NZD/month
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Essential",
                    "Bookings and table management",
                    "Staff app with QR clock-in",
                    "Advanced analytics and reports",
                    "Multi-location support",
                    "Priority support",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-neutral-300"
                    >
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/email"
                  className="block text-center py-3 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  Start free trial
                </Link>
              </GlassCard>
            </div>
          </div>

          {/* Savings comparison */}
          <GlassCard className="mt-10 p-6 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">
                  How does this stack up?
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-md">
                  A typical NZ restaurant pays $200-400 NZD/month across
                  separate POS, booking and kitchen systems — plus transaction
                  fees on every sale. ChefiApp replaces all of that from ~$92
                  NZD/month, with zero transaction fees.
                </p>
              </div>
              <div className="shrink-0 text-center">
                <div className="text-2xl font-extrabold text-emerald-400">
                  Save up to 60%
                </div>
                <div className="text-xs text-neutral-500">
                  vs separate systems
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ================================================================
          6. BUILT FOR HOSPITALITY TEAMS
          ================================================================ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            eyebrow="Built for your team"
            title="Everyone benefits, not just the boss"
            subtitle="ChefiApp is designed for the whole team — from the owner checking numbers to the new hire on their first shift."
          />

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: DollarSign,
                role: "Owners",
                headline: "See your business clearly",
                points: [
                  "Real-time revenue and covers",
                  "Cost breakdowns by category",
                  "Staff hours and labour costs",
                  "Exportable records for your accountant",
                ],
              },
              {
                icon: Shield,
                role: "Managers",
                headline: "Run service smoothly",
                points: [
                  "Floor plan at a glance",
                  "Booking overview for the day",
                  "Kitchen timing and flow",
                  "Staff section assignments",
                ],
              },
              {
                icon: Smartphone,
                role: "Staff",
                headline: "Know what to do, when",
                points: [
                  "Clock in with a QR scan",
                  "See your section and tables",
                  "Take orders in two taps",
                  "No training manual needed",
                ],
              },
            ].map(({ icon: Icon, role, headline, points }) => (
              <GlassCard
                key={role}
                className="p-6 hover:border-amber-500/15 transition-colors duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">
                  {role}
                </h3>
                <p className="text-base font-semibold mb-4">{headline}</p>
                <ul className="space-y-2.5">
                  {points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm text-neutral-400"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          7. FAQ — NZ-focused
          ================================================================ */}
      <section id="faq" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions? We've got you."
          />

          <GlassCard className="px-6">
            <FAQItem
              q="Does it work with NZ payment systems?"
              a="Yes. ChefiApp integrates with Stripe, which operates in New Zealand and supports all major card networks including Visa, Mastercard and eftpos NZ. You keep your own Stripe account and funds settle directly to your New Zealand bank account."
            />
            <FAQItem
              q="Do I need special hardware?"
              a="No. ChefiApp runs in the browser on any tablet, laptop or desktop you already have. An iPad, an Android tablet, even an old laptop behind the bar — if it has a browser, it works. If you want a receipt printer, we support standard ESC/POS printers over USB or network."
            />
            <FAQItem
              q="Is it secure?"
              a="Absolutely. ChefiApp uses enterprise-grade encryption and secure cloud infrastructure. Your data is protected with the same standards used by banks and major tech companies. We take privacy and data protection seriously."
            />
            <FAQItem
              q="Can I use it for a food truck or pop-up?"
              a="For sure — that's exactly what the Essential plan is built for. You get a full POS with counter mode, kitchen display, and a menu builder. Works great on a single tablet with mobile data at a market or festival."
            />
            <FAQItem
              q="What about GST records?"
              a="ChefiApp tracks all your sales with full line-item detail, so your records are always clean and ready to go. All data is exportable in standard formats — your accountant will thank you come GST time."
            />
            <FAQItem
              q="Does it work offline?"
              a="Yes. ChefiApp is a progressive web app (PWA), so it continues working if your internet drops mid-service. Orders sync automatically once you're back online. No lost tickets, no stress."
            />
          </GlassCard>
        </div>
      </section>

      {/* ================================================================
          8. FINAL CTA
          ================================================================ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* Ambient glow */}
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-10 bg-amber-500/10 rounded-full blur-3xl" />
            <ChefHat className="relative w-16 h-16 text-amber-500" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Less complexity.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              More manaakitanga.
            </span>
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Your venue deserves a system that stays out of the way and lets you
            focus on what matters most — looking after your people.
          </p>

          <Link
            to="/auth/email"
            className="group inline-flex items-center justify-center px-10 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
          >
            Start free — no card required
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-6 text-sm text-neutral-600">
            14-day free trial · EUR pricing with NZD estimates · Cancel anytime
          </p>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
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
              <a href="#solution" className="hover:text-white transition-colors">
                Platform
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
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
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
            <span>
              &copy; {new Date().getFullYear()} ChefiApp. All rights reserved.
            </span>
            <span>Made for New Zealand hospitality with aroha.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
