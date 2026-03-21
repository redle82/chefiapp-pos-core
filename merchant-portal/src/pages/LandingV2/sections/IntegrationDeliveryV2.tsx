/**
 * IntegrationDeliveryV2 — Secção Delivery (Uber Eats, agregadores)
 * Ref: docs/FLOW_KDS_TASKS_TABLES.md
 * Nível 1: manual assistido hoje. Nível 2: agregadores em roadmap.
 */
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import { getIntegrationDelivery } from "../i18n/landingV2Copy";

export const IntegrationDeliveryV2 = () => {
  const { locale } = useLandingLocale();
  const d = getIntegrationDelivery(locale);

  return (
    <section
      id="integracoes"
      className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            {d.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {d.headline}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {d.headlineAccent}
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            {d.subhead}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/50 p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {d.level1Badge}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{d.level1Title}</h3>
            <p className="text-sm text-neutral-400 mb-4">{d.level1Desc}</p>
            <ul className="space-y-2 text-sm text-neutral-300">
              {d.level1Points.map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/50 p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {d.level2Badge}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{d.level2Title}</h3>
            <p className="text-sm text-neutral-400 mb-4">{d.level2Desc}</p>
            <ul className="space-y-2 text-sm text-neutral-300">
              {d.level2Points.map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-amber-500">→</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-neutral-500 text-sm mt-8">
          {d.recommendation}
        </p>
      </div>
    </section>
  );
};
