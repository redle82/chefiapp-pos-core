/**
 * InsideSystemV2 — Veja o sistema em funcionamento
 * Copy via useLandingLocale + getInsideSystem (i18n/landingV2Copy).
 */
import React, { useEffect, useState } from "react";
import { useLandingLocale } from "../i18n/LandingLocaleContext";
import { getInsideSystem } from "../i18n/landingV2Copy";

type BrowserFrameProps = {
  url: string;
  statusLabel: string;
  imageSrc: string;
  imageAlt: string;
};

const BrowserFrame: React.FC<BrowserFrameProps> = ({
  url,
  statusLabel,
  imageSrc,
  imageAlt,
}) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:border-amber-500/40 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 mx-3 truncate rounded-md bg-black/60 border border-white/10 px-3 py-1.5 text-[11px] text-neutral-300 font-mono">
          {url}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
            aria-hidden
          />
          {statusLabel}
        </span>
      </div>
      <div className="relative bg-black min-h-[200px] flex items-center justify-center">
        {imgError ? (
          <div className="w-full min-h-[200px] flex items-center justify-center bg-neutral-900/80 text-neutral-500 text-xs uppercase tracking-widest">
            Screenshot
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>
    </div>
  );
};

const useCountUp = (target: number, durationMs: number) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const steps = 30;
    const stepDuration = durationMs / steps;
    let currentStep = 0;
    const id = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / steps, 1);
      setValue(Math.round(target * progress));
      if (progress >= 1) window.clearInterval(id);
    }, stepDuration);
    return () => window.clearInterval(id);
  }, [target, durationMs]);
  return value;
};

const FRAME_URLS = [
  "chefiapp.com/admin",
  "chefiapp.com/tpv",
  "chefiapp.com/kds",
] as const;
const FRAME_IMAGES = [
  "/landing/system/dashboard-live.png",
  "/landing/system/tpv-order.png",
  "/landing/system/kds-priority.png",
] as const;

export const InsideSystemV2: React.FC = () => {
  const { locale } = useLandingLocale();
  const is = getInsideSystem(locale);
  const liveOrders = useCountUp(47, 1400);

  return (
    <section className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-amber-400/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
            {is.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {is.headline1}
            <br />
            {is.headline2}
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-2">
            {is.subhead1}
          </p>
          <p className="text-[11px] md:text-xs text-neutral-500 uppercase tracking-[0.22em]">
            {is.subhead2}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 mb-14">
          {is.frames.map((frame, i) => (
            <div key={frame.label} className="flex flex-col gap-4">
              <BrowserFrame
                url={FRAME_URLS[i]}
                statusLabel={frame.statusLabel}
                imageSrc={FRAME_IMAGES[i]}
                imageAlt={frame.imageAlt}
              />
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1.5">
                  {frame.label}
                </p>
                <h3 className="text-sm md:text-base font-semibold text-white mb-1">
                  {frame.title}
                </h3>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed mb-2">
                  {frame.desc}
                </p>
                {frame.liveBadge != null && (
                  <div className="inline-flex items-baseline gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2.5 py-1">
                    <span className="text-[11px] font-semibold text-amber-300">
                      {liveOrders}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400">
                      {frame.liveBadge}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Block B — Linha do tempo "Da configuração à venda" */}
        <div className="rounded-2xl border border-amber-500/20 bg-neutral-950 px-5 py-5 md:px-7 md:py-6 mb-5 md:mb-6">
          <div className="flex flex-col gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.2em] mb-2">
                {is.flowLabel}
              </p>
              <h3 className="text-base md:text-lg font-semibold text-white mb-1.5">
                {is.flowTitle}
              </h3>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                {is.flowDesc}
              </p>
            </div>
            <ol className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-0 text-xs md:text-sm text-neutral-300 list-none">
              {is.steps.map((step, i) => (
                <React.Fragment key={step.numLabel}>
                  <li className="md:flex-1 flex">
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 md:mx-0.5 w-full hover:border-amber-500/30 transition-colors duration-300">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">
                        {step.numLabel}
                      </div>
                      <p className="font-semibold text-white mb-1">
                        {step.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                  {i < is.steps.length - 1 && (
                    <li
                      className="hidden md:flex items-center shrink-0 px-1"
                      aria-hidden
                    >
                      <span className="h-px w-4 bg-linear-to-r from-amber-400/50 to-amber-400/80 rounded-full" />
                      <svg
                        className="w-3 h-3 text-amber-400/70 shrink-0 ml-0.5"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 2l4 4-4 4" />
                      </svg>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-4 md:mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <p className="text-[11px] md:text-xs text-neutral-500">{is.ctaSub}</p>
          <a
            href="/auth/phone"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-xs md:text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            {is.ctaButton}
          </a>
        </div>
      </div>
    </section>
  );
};
