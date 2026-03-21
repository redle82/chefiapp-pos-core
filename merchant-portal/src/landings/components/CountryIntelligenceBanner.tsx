/**
 * CountryIntelligenceBanner — Dynamic banner on country landing pages.
 *
 * "Top restaurants in {country} are upgrading to Pro"
 * Rotates 3 messages. Tracks banner_impression and banner_click.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../../commercial/tracking";
import type { CountryCode, CountryConfig } from "../countries";

const COUNTRY_LABELS: Record<CountryCode, string> = {
  br: "Brasil",
  es: "España",
  gb: "UK",
  us: "USA",
};

/** 3 rotating messages by locale. */
const MESSAGES_BY_LOCALE: Record<string, ((c: string) => string)[]> = {
  "pt-BR": [
    (c) => `Os melhores restaurantes em ${c} estão a fazer upgrade para Pro`,
    (c) => `Restaurantes de topo em ${c} escolhem o plano Pro`,
    (c) => `${c}: restaurantes a crescer escolhem ChefIApp Pro`,
  ],
  es: [
    (c) => `Los mejores restaurantes en ${c} están pasando a Pro`,
    (c) => `Restaurantes punteros en ${c} eligen ChefIApp Pro`,
    (c) => `${c}: los restaurantes que crecen eligen Pro`,
  ],
  en: [
    (c) => `Top restaurants in ${c} are upgrading to Pro`,
    (c) => `Leading restaurants in ${c} choose ChefIApp Pro`,
    (c) => `${c}: growing restaurants upgrade to Pro`,
  ],
};

function getMessage(
  index: number,
  countryLabel: string,
  locale: string,
): string {
  const msgs = MESSAGES_BY_LOCALE[locale] ?? MESSAGES_BY_LOCALE.en;
  const msg = msgs[index % msgs.length];
  return msg(countryLabel);
}

export interface CountryIntelligenceBannerProps {
  country: CountryConfig;
}

export function CountryIntelligenceBanner({
  country,
}: CountryIntelligenceBannerProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const trackedRef = useRef(false);
  const localeMessages =
    MESSAGES_BY_LOCALE[country.locale] ?? MESSAGES_BY_LOCALE.en;

  const countryLabel =
    COUNTRY_LABELS[country.code] ?? country.code.toUpperCase();
  const message = getMessage(messageIndex, countryLabel, country.locale);

  // Rotate message every 6 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setMessageIndex((i) => (i + 1) % localeMessages.length);
    }, 6000);
    return () => clearInterval(t);
  }, [localeMessages.length]);

  // Track banner_impression once on mount
  useEffect(() => {
    if (!isCommercialTrackingEnabled() || trackedRef.current) return;
    trackedRef.current = true;
    commercialTracking.track({
      timestamp: new Date().toISOString(),
      country: country.code,
      segment: "small",
      landing_version: "country-v1",
      device: detectDevice(),
      path: typeof window !== "undefined" ? window.location.pathname : "",
      event: "banner_impression",
      message_index: messageIndex,
    });
  }, [country.code, messageIndex]);

  const handleClick = () => {
    if (isCommercialTrackingEnabled()) {
      commercialTracking.track({
        timestamp: new Date().toISOString(),
        country: country.code,
        segment: "small",
        landing_version: "country-v1",
        device: detectDevice(),
        path: typeof window !== "undefined" ? window.location.pathname : "",
        event: "banner_click",
        message_index: messageIndex,
      });
    }
  };

  return (
    <div className="py-4 px-6 bg-amber-500/10 border-b border-amber-500/20">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
        <p className="text-sm text-amber-200/90 text-center sm:text-left">
          {message}
        </p>
        <Link
          to="/auth/phone"
          onClick={handleClick}
          className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          {country.locale === "en" ? "Upgrade Plan" : "Ver planos Pro"}
        </Link>
      </div>
    </div>
  );
}
