/**
 * ComoComecerV2 — "3 passos. 25 minutos. A operar."
 * Copy via useLandingLocale + getComoComecer (i18n/landingV2Copy).
 */
import { Link } from "react-router-dom";
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import { getComoComecer } from "../i18n/landingV2Copy";

const STEP_ICONS = [
  <svg
    key="1"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
    />
  </svg>,
  <svg
    key="2"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
    />
  </svg>,
  <svg
    key="3"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
    />
  </svg>,
];

export const ComoComecerV2 = () => {
  const { locale } = useLandingLocale();
  const cc = getComoComecer(locale);

  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            {cc.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {cc.headline}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {cc.headlineAccent}
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {cc.subhead}
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-linear-to-r from-amber-500/30 via-amber-500/20 to-amber-500/30" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {cc.steps.map((step, i) => (
              <div key={step.num} className="relative text-center group">
                <div className="relative z-10 mx-auto w-24 h-24 rounded-2xl bg-[#0a0a0a] border-2 border-amber-500/30 flex flex-col items-center justify-center mb-6 group-hover:border-amber-500 transition-colors">
                  <div className="text-amber-500 mb-1">{STEP_ICONS[i]}</div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    {cc.stepLabel} {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            to="/auth/phone"
            className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
          >
            {cc.cta}
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200"
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
          <p className="text-xs text-neutral-600 mt-4">{cc.ctaSub}</p>
        </div>
      </div>
    </section>
  );
};
