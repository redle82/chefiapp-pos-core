/**
 * CountryHero — Hero localizado com value proposition e CTAs por segmento.
 * Ref: docs/commercial/COUNTRY_DEPLOYMENT_SYSTEM.md, SEGMENTED_SALES_FUNNEL.md
 */
import { Link } from "react-router-dom";
import type { CountryConfig } from "../countries";
import type { Segment } from "../countryCopy";
import { getSegmentCopy } from "../countryCopy";
import { WhatsAppCTA } from "./WhatsAppCTA";

export interface CountryHeroProps {
  country: CountryConfig;
  segment: Segment;
}

export function CountryHero({ country, segment }: CountryHeroProps) {
  const segmentCopy = getSegmentCopy(segment, country.locale);
  const showSegmentHeadline = segment !== "small";
  const headline = showSegmentHeadline
    ? segmentCopy.heroHeadline
    : country.hero.h1;
  const subhead = showSegmentHeadline
    ? segmentCopy.heroSubhead
    : country.hero.subhead;

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-white">
          {headline}
          {country.hero.h1Accent && (
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {country.hero.h1Accent}
            </span>
          )}
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
          {subhead}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/auth/phone"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all"
          >
            {segmentCopy.ctaPrimary}
            <svg
              className="w-4 h-4 ml-2"
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
          <WhatsAppCTA country={country} placement="hero" />
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          {country.locale === "en"
            ? "14-day free trial. No card required."
            : country.locale === "es"
            ? "14 días gratis. Sin tarjeta."
            : "14 dias grátis. Sem cartão."}
        </p>
      </div>
    </section>
  );
}
