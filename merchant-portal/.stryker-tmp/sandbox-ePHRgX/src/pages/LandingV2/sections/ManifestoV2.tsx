/**
 * ManifestoV2 — "Por que isto é um Sistema Operacional?"
 * Copy via useLandingLocale + getManifesto (i18n/landingV2Copy).
 */
// @ts-nocheck

import { getManifesto } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const ManifestoV2 = () => {
  const { locale } = useLandingLocale();
  const m = getManifesto(locale);

  return (
    <section className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {m.headline}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {m.headlineAccent}
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {m.subhead}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-0 rounded-2xl border border-white/5 overflow-hidden mb-16">
          <div className="bg-neutral-900/20 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <h3 className="text-xs font-semibold text-red-400/80 uppercase tracking-wider">
                {m.beforeLabel}
              </h3>
            </div>
            <div className="space-y-4">
              {m.beforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 text-red-400/50 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-base text-neutral-500 line-through decoration-red-400/30">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-sm text-neutral-600">{m.beforeFooter}</p>
            </div>
          </div>

          <div className="bg-amber-500/3 border-l border-white/5 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                {m.afterLabel}
              </h3>
            </div>
            <p className="text-xl font-bold text-white mb-8 leading-relaxed">
              {m.afterHeadline}
            </p>
            <div className="space-y-6">
              {m.osReasons.map((r) => (
                <div key={r.title}>
                  <div className="flex items-start gap-3 mb-1">
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <div>
                      <h4 className="text-base font-semibold text-white mb-1">
                        {r.title}
                      </h4>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-500/5 to-transparent py-10 px-8">
            <p className="text-2xl md:text-3xl font-bold text-white leading-snug mb-3">
              {m.callout1}
            </p>
            <p className="text-2xl md:text-3xl font-bold text-amber-500 leading-snug">
              {m.callout2}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
