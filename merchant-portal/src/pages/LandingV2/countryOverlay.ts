/**
 * Country Overlay — Maps country codes to landing locale + country-specific data.
 *
 * Used by the unified LandingLocaleProvider when rendering /{countryCode} routes.
 * Country data (WhatsApp, currency, SEO, delivery) is layered ON TOP of the
 * premium landing template. The premium sections remain unchanged; only
 * SEO meta, WhatsApp, currency symbol, and hreflang adapt per country.
 *
 * Architecture: LANDING_CANON.md — premium landing is global base.
 * Country pages are parameterized views, not separate templates.
 */
import {
  COUNTRIES,
  COUNTRY_ROUTES,
  type CountryCode,
  type CountryConfig,
  type SupportedCurrency,
} from "../../landings/countries";
import type { LandingLocale } from "./i18n/landingV2Copy";

// ── Country → Landing locale map ──────────────────────────────────────────────
export const COUNTRY_TO_LANDING_LOCALE: Record<CountryCode, LandingLocale> = {
  br: "pt",
  pt: "pt",
  es: "es",
  gb: "en",
  us: "en",
};

// ── hreflang map (BCP-47) ─────────────────────────────────────────────────────
export const COUNTRY_HREFLANG: Record<CountryCode, string> = {
  br: "pt-BR",
  pt: "pt-PT",
  es: "es",
  gb: "en-GB",
  us: "en",
};

// ── CountryOverlay type — extra data sections can consume ─────────────────────
export interface CountryOverlay {
  /** ISO country code (lowercase). */
  countryCode: CountryCode;
  /** Full country config — WhatsApp, hero copy, SEO meta, etc. */
  config: CountryConfig;
  /** Landing locale derived from country. */
  locale: LandingLocale;
  /** Currency code for this country. */
  currency: SupportedCurrency;
  /** BCP-47 hreflang tag. */
  hreflang: string;
}

/**
 * Resolve a country code into a full overlay. Returns null for invalid codes.
 */
export function resolveCountryOverlay(
  code: string | undefined | null,
): CountryOverlay | null {
  if (!code) return null;
  const lower = code.toLowerCase() as CountryCode;
  const config = COUNTRIES[lower];
  if (!config) return null;
  return {
    countryCode: lower,
    config,
    locale: COUNTRY_TO_LANDING_LOCALE[lower],
    currency: config.currency,
    hreflang: COUNTRY_HREFLANG[lower],
  };
}

/**
 * Generate hreflang entries for SEO <head>.
 * Used by the unified landing to emit correct hreflang for all country routes.
 */
export function buildHreflangEntries(baseUrl: string): Array<{
  hreflang: string;
  href: string;
}> {
  const entries = COUNTRY_ROUTES.map((code) => ({
    hreflang: COUNTRY_HREFLANG[code],
    href: `${baseUrl}/${code}`,
  }));
  // x-default → gb (English, international)
  entries.push({ hreflang: "x-default", href: `${baseUrl}/gb` });
  return entries;
}

/** All valid country route paths — for use in router. */
export { COUNTRY_ROUTES } from "../../landings/countries";
export type { CountryCode } from "../../landings/countries";
