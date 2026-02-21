/**
 * RhythmBreakV2 — micro-secção de respiração. Copy via useLandingLocale + getRhythmBreak.
 */
// @ts-nocheck

import { getRhythmBreak } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const RhythmBreakV2 = () => {
  const { locale } = useLandingLocale();
  const rb = getRhythmBreak(locale);
  return (
    <section className="py-12 md:py-16 bg-[#050505] border-y border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500 mb-3">
          {rb.label}
        </p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
          {rb.headline}
        </p>
      </div>
    </section>
  );
};

