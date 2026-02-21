/**
 * OperationalStoriesV2 — "O restaurante em funcionamento"
 * Copy via useLandingLocale + getOperationalStories (i18n/landingV2Copy).
 */
// @ts-nocheck

import { getOperationalStories } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const OperationalStoriesV2 = () => {
  const { locale } = useLandingLocale();
  const os = getOperationalStories(locale);

  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="max-w-7xl mx-auto px-6 relative"
        data-visual-slot="service-in-motion"
      >
        <div className="max-w-2xl mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            {os.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {os.headline}
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-3">
            {os.subhead1}
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
            {os.subhead2}
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute left-[60px] top-0 bottom-0 w-px bg-linear-to-b from-amber-500/40 via-amber-500/20 to-transparent" />

          <div className="space-y-6">
            {os.scenarios.map((s) => (
              <div key={s.num} className="group relative lg:pl-32">
                <div className="hidden lg:flex absolute left-0 top-8 w-30 items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 bg-[#0a0a0a] flex items-center justify-center group-hover:border-amber-500 transition-colors z-10 relative left-9">
                    <span className="text-sm font-bold text-amber-500">
                      {s.num}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden hover:border-amber-500/20 transition-all duration-300">
                  <div className="grid lg:grid-cols-[1fr,1.2fr]">
                    <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5">
                      <div className="lg:hidden flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-500/40 flex items-center justify-center">
                          <span className="text-xs font-bold text-amber-500">
                            {s.num}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          {os.scenarioLabel} {s.num}
                        </span>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white leading-snug mb-3">
                        {s.title}
                      </h3>
                      <p className="text-neutral-500 text-sm mb-6">{s.intro}</p>
                      <div className="py-3 px-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <p className="text-xs font-medium text-amber-500 leading-relaxed">
                          {s.anchor}
                        </p>
                      </div>
                    </div>

                    <div className="p-8 lg:p-10">
                      <div className="space-y-4">
                        {s.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="mt-0.5 w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 border border-white/5">
                              <span className="text-[10px] font-bold text-neutral-400">
                                {i + 1}
                              </span>
                            </div>
                            <span className="text-sm text-neutral-300 leading-relaxed pt-0.5">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-neutral-600 text-sm max-w-xl mx-auto">
            {os.closer}
          </p>
        </div>
      </div>
    </section>
  );
};
