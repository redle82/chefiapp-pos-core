/**
 * ProblemSolutionV2 — Problemas reais vs ChefIApp™ OS
 * Copy via useLandingLocale + getProblemSolution (i18n/landingV2Copy).
 */
import { getProblemSolution } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const ProblemSolutionV2 = () => {
  const { locale } = useLandingLocale();
  const ps = getProblemSolution(locale);

  return (
    <section className="py-24 md:py-32 bg-[#060606] relative overflow-hidden">
      <div className="hidden md:block absolute -top-32 right-0 w-[420px] h-[420px] bg-amber-500/6 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="max-w-3xl mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
            {ps.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {ps.headline}
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed">
            {ps.subhead}
          </p>
        </div>

        <div className="space-y-6">
          {ps.problems.map((block) => (
            <div
              key={block.title}
              className="rounded-2xl border border-white/5 bg-neutral-950/70 overflow-hidden hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="border-b border-white/5 px-6 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                    {block.title}
                  </h3>
                  <p className="text-xs text-neutral-500">{block.lossLabel}</p>
                </div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-400">
                  {ps.columnLabel}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-px bg-white/5">
                <div className="bg-neutral-950 px-6 md:px-8 py-6 md:py-7">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.16em] mb-3">
                    {ps.labelWithout}
                  </p>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    {block.without.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500/70" />
                        <span className="leading-relaxed text-neutral-400">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-950 px-6 md:px-8 py-6 md:py-7">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.16em] mb-3">
                    {ps.labelWith}
                  </p>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    {block.with.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
