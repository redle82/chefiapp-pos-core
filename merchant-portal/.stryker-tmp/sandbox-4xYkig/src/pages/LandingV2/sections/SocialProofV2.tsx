/**
 * SocialProof V2 — Prova social
 *
 * Depoimentos via copy (getSocialProof). Só publicar com autorização explícita.
 * Se featuredTestimonial for null, mostra placeholder CTA. secondaryTestimonials vazio = sem cards extras.
 */
import { Link } from "react-router-dom";
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import { getSocialProof } from "../i18n/landingV2Copy";

export const SocialProofV2 = () => {
  const { locale } = useLandingLocale();
  const sp = getSocialProof(locale);

  return (
    <section className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/3 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            {sp.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {sp.headline}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {sp.headlineAccent}
            </span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/40 overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/40 ring-1 ring-white/5">
            {sp.featuredTestimonial ? (
              <>
                <div className="p-8 md:p-12">
                  <svg
                    className="w-10 h-10 text-amber-500/40 mb-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
                  </svg>
                  <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-8">
                    {sp.featuredTestimonial.quote}
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                      {sp.featuredTestimonial.initials}
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {sp.featuredTestimonial.authorName}
                      </div>
                      <div className="text-xs text-amber-500/70 font-medium mb-0.5">
                        {sp.featuredTestimonial.authorSubline}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {sp.featuredTestimonial.authorLocation}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/5 bg-neutral-950/50 grid grid-cols-2 md:grid-cols-4">
                  {sp.featuredTestimonial.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="p-6 text-center border-r border-white/5 last:border-r-0"
                    >
                      <div className="text-2xl font-bold text-amber-500 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 md:p-12 text-center">
                <p className="text-neutral-400 text-lg mb-6">
                  {sp.placeholderCta}
                </p>
                <Link
                  to="/auth/phone"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                >
                  {sp.placeholderButton}
                </Link>
              </div>
            )}
          </div>
        </div>

        {sp.secondaryTestimonials.length > 0 && (
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {sp.secondaryTestimonials.map((t) => (
              <div
                key={t.initials}
                className="rounded-xl border border-white/5 bg-neutral-900/30 p-6 hover:border-amber-500/20 hover:bg-neutral-900/50 transition-all duration-300"
              >
                <svg
                  className="w-6 h-6 text-amber-500/30 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
                </svg>
                <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t.name}
                    </div>
                    <div className="text-xs text-neutral-500">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-neutral-500">
          {sp.trustLabels.map((label) => (
            <div key={label} className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-500 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
