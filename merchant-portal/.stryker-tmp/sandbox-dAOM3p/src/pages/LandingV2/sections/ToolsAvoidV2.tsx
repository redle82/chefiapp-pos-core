/**
 * ToolsAvoidV2 — "O que cada ferramenta evita"
 * Copy via useLandingLocale + getToolsAvoid (i18n/landingV2Copy).
 */
// @ts-nocheck

import { getToolsAvoid } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const ToolsAvoidV2 = () => {
  const { locale } = useLandingLocale();
  const ta = getToolsAvoid(locale);

  return (
    <section className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-0 w-80 h-80 bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-40px] w-96 h-96 bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
            {ta.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {ta.headline1}
            <br />
            {ta.headline2}
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            {ta.subhead}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {ta.items.map((item) => (
            <div
              key={item.badge}
              className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6"
            >
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
                {item.badge}
              </p>
              <h3 className="text-sm md:text-base font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

