/**
 * Pricing V2 — Premium glass card.
 * Copy via useLandingLocale + getPricing (i18n/landingV2Copy).
 */
import { Link } from "react-router-dom";
import { useCurrency } from "../../../core/currency/useCurrency";
import { CANONICAL_MONTHLY_PRICE_EUR } from "../../../core/pricing/canonicalPrice";
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import { getPricing } from "../i18n/landingV2Copy";

export const PricingV2 = () => {
  const { locale } = useLandingLocale();
  const { symbol } = useCurrency();
  const p = getPricing(locale);

  return (
    <section
      id="preco"
      className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none animate-pulse-glow hidden md:block" />

      <div className="relative max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            {p.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {p.headline}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {p.headlineAccent}
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            {p.subhead}
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/50 backdrop-blur-xl overflow-hidden relative shadow-2xl shadow-amber-500/5 ring-1 ring-white/5">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/8 rounded-full blur-[100px] animate-pulse-glow" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-600/6 rounded-full blur-[100px] animate-pulse-glow" />
            <div className="h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="relative p-8 md:p-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  {p.badge}
                </span>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl md:text-7xl font-black bg-linear-to-b from-white to-neutral-400 bg-clip-text text-transparent tabular-nums">
                    {CANONICAL_MONTHLY_PRICE_EUR}
                    {symbol}
                  </span>
                  <span className="text-neutral-500 text-lg">{p.perMonth}</span>
                </div>
                <p className="text-emerald-400 text-sm font-medium">
                  {p.trustLine}
                </p>
              </div>

              <div className="space-y-3 mb-10">
                {p.included.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 group/feat"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover/feat:bg-emerald-500/20 transition-colors">
                      <svg
                        className="w-3 h-3 text-emerald-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-300 group-hover/feat:text-white transition-colors duration-200">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/auth/phone"
                className="group block w-full text-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
              >
                {p.cta}
                <svg
                  className="w-4 h-4 ml-2 inline-block group-hover:translate-x-1 transition-transform duration-200"
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

              <p className="text-center text-xs text-neutral-600 mt-4">
                {p.footerLine}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-neutral-600 text-sm">
            {p.enterpriseQuestion}{" "}
            <a
              href="mailto:contacto@chefiapp.com"
              className="text-amber-500 hover:underline"
            >
              {p.contactUs}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
