/**
 * MoneyLeaksV2 — Mapa de vazamentos de dinheiro
 * Copy via useLandingLocale + getMoneyLeaks (i18n/landingV2Copy).
 */
// @ts-nocheck

import { getMoneyLeaks } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const MoneyLeaksV2 = () => {
  const { locale } = useLandingLocale();
  const ml = getMoneyLeaks(locale);

  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      <div className="hidden md:block absolute top-1/2 -left-40 w-[420px] h-[420px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="max-w-3xl mb-14 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
            {ml.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {ml.headline1}
            <br />
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {ml.headline2}
            </span>
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed">
            {ml.subhead}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
          {ml.leaks.map((leak) => (
            <div
              key={leak.label}
              className="group relative p-6 rounded-2xl border border-white/5 bg-[#0b0b0b] hover:border-amber-500/30 hover:bg-neutral-900/80 transition-all duration-300"
            >
              <div className="flex items-baseline justify-between mb-3 gap-2">
                <h3 className="text-base font-semibold text-white">
                  {leak.label}
                </h3>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {leak.range}
                </span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {leak.description}
              </p>
              <div className="mt-4 h-px bg-linear-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                {leak.footer}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-5 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          <div className="shrink-0">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.16em] mb-1">
              {ml.synthesis.exampleLabel}
            </p>
            <p className="text-2xl md:text-3xl font-black bg-linear-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              {ml.synthesis.revenue}
            </p>
            <p className="text-xs text-neutral-500 mb-3">
              {ml.synthesis.revenueSub}
            </p>
            <p className="text-xl md:text-2xl font-black bg-linear-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent">
              {ml.synthesis.recoverable}
            </p>
            <p className="text-[11px] text-neutral-500">
              {ml.synthesis.recoverableSub}
            </p>
          </div>
          <div className="flex-1 text-sm text-neutral-300 leading-relaxed">
            <p className="mb-1">
              {ml.synthesis.body1}{" "}
              <span className="font-semibold text-amber-400">
                {ml.synthesis.body1Highlight}
              </span>{" "}
              {ml.synthesis.body1End}
            </p>
            <p className="text-neutral-500">
              {ml.synthesis.body2}{" "}
              <span className="text-neutral-300">
                {ml.synthesis.body2End}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
