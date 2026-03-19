/**
 * Country Configuration Map
 *
 * Single source of truth for country-specific settings: timezone, currency,
 * locale, VAT rates, fiscal system, phone prefix, and date format.
 *
 * Used by onboarding (contract generation) and runtime (formatting, fiscal).
 * Default: PT when country is unknown.
 */

export interface CountryConfig {
  /** ISO 3166-1 alpha-2 */
  code: string;
  /** Human-readable country name (English) */
  name: string;
  /** IANA timezone */
  timezone: string;
  /** ISO 4217 currency code */
  currency: string;
  /** Currency display symbol */
  currencySymbol: string;
  /** BCP 47 locale tag */
  locale: string;
  /** Standard VAT rates (descending) */
  vatRates: number[];
  /** Fiscal reporting system identifier */
  fiscalSystem: string;
  /** International dialling prefix */
  phonePrefix: string;
  /** Date display format convention */
  dateFormat: string;
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  PT: {
    code: "PT",
    name: "Portugal",
    timezone: "Europe/Lisbon",
    currency: "EUR",
    currencySymbol: "\u20ac",
    locale: "pt-PT",
    vatRates: [23, 13, 6],
    fiscalSystem: "saft",
    phonePrefix: "+351",
    dateFormat: "DD/MM/YYYY",
  },
  ES: {
    code: "ES",
    name: "Spain",
    timezone: "Europe/Madrid",
    currency: "EUR",
    currencySymbol: "\u20ac",
    locale: "es-ES",
    vatRates: [21, 10, 4],
    fiscalSystem: "ticketbai",
    phonePrefix: "+34",
    dateFormat: "DD/MM/YYYY",
  },
  BR: {
    code: "BR",
    name: "Brazil",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    currencySymbol: "R$",
    locale: "pt-BR",
    vatRates: [17, 12, 7],
    fiscalSystem: "nfce",
    phonePrefix: "+55",
    dateFormat: "DD/MM/YYYY",
  },
  IT: {
    code: "IT",
    name: "Italy",
    timezone: "Europe/Rome",
    currency: "EUR",
    currencySymbol: "\u20ac",
    locale: "it-IT",
    vatRates: [22, 10, 5, 4],
    fiscalSystem: "sdi",
    phonePrefix: "+39",
    dateFormat: "DD/MM/YYYY",
  },
  FR: {
    code: "FR",
    name: "France",
    timezone: "Europe/Paris",
    currency: "EUR",
    currencySymbol: "\u20ac",
    locale: "fr-FR",
    vatRates: [20, 10, 5.5, 2.1],
    fiscalSystem: "nf525",
    phonePrefix: "+33",
    dateFormat: "DD/MM/YYYY",
  },
  DE: {
    code: "DE",
    name: "Germany",
    timezone: "Europe/Berlin",
    currency: "EUR",
    currencySymbol: "\u20ac",
    locale: "de-DE",
    vatRates: [19, 7],
    fiscalSystem: "tse",
    phonePrefix: "+49",
    dateFormat: "DD.MM.YYYY",
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    timezone: "Europe/London",
    currency: "GBP",
    currencySymbol: "\u00a3",
    locale: "en-GB",
    vatRates: [20, 5, 0],
    fiscalSystem: "none",
    phonePrefix: "+44",
    dateFormat: "DD/MM/YYYY",
  },
  US: {
    code: "US",
    name: "United States",
    timezone: "America/New_York",
    currency: "USD",
    currencySymbol: "$",
    locale: "en-US",
    vatRates: [],
    fiscalSystem: "none",
    phonePrefix: "+1",
    dateFormat: "MM/DD/YYYY",
  },
};

/** Default country when lookup fails */
const DEFAULT_COUNTRY = "PT";

/**
 * Get config for a country code. Falls back to PT if unknown.
 */
export function getCountryConfig(code: string): CountryConfig {
  const upper = code?.toUpperCase().trim();
  return COUNTRY_CONFIGS[upper] ?? COUNTRY_CONFIGS[DEFAULT_COUNTRY];
}

/**
 * Infer country code from the browser's IANA timezone.
 * Falls back to PT if no match is found.
 */
export function inferCountryFromTimezone(): string {
  if (typeof Intl === "undefined") return DEFAULT_COUNTRY;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return DEFAULT_COUNTRY;

    // Build a reverse map from timezone to country code
    const tzLower = tz.toLowerCase();
    for (const [code, cfg] of Object.entries(COUNTRY_CONFIGS)) {
      if (cfg.timezone.toLowerCase() === tzLower) return code;
    }

    // Extended timezone heuristics for countries with multiple zones
    const TZ_PREFIX_MAP: Record<string, string> = {
      "america/sao_paulo": "BR",
      "america/fortaleza": "BR",
      "america/recife": "BR",
      "america/bahia": "BR",
      "america/belem": "BR",
      "america/manaus": "BR",
      "america/cuiaba": "BR",
      "america/porto_velho": "BR",
      "america/rio_branco": "BR",
      "america/new_york": "US",
      "america/chicago": "US",
      "america/denver": "US",
      "america/los_angeles": "US",
      "america/anchorage": "US",
      "pacific/honolulu": "US",
      "europe/lisbon": "PT",
      "atlantic/madeira": "PT",
      "atlantic/azores": "PT",
      "europe/madrid": "ES",
      "atlantic/canary": "ES",
      "europe/london": "GB",
      "europe/paris": "FR",
      "europe/berlin": "DE",
      "europe/rome": "IT",
      "america/toronto": "CA",
      "america/vancouver": "CA",
      "australia/sydney": "AU",
      "australia/melbourne": "AU",
      "australia/brisbane": "AU",
      "australia/perth": "AU",
    };

    const match = TZ_PREFIX_MAP[tzLower];
    if (match) return match;
  } catch {
    // Intl may throw in constrained environments
  }
  return DEFAULT_COUNTRY;
}

/**
 * Infer country code from the browser's locale (navigator.language).
 * Falls back to PT if no match is found.
 */
export function inferCountryFromLocale(): string {
  if (typeof navigator === "undefined") return DEFAULT_COUNTRY;
  try {
    const lang = navigator.language || "";
    // BCP 47 tags like "pt-BR", "en-US", "es-ES"
    const parts = lang.split("-");
    if (parts.length >= 2) {
      const region = parts[parts.length - 1].toUpperCase();
      if (COUNTRY_CONFIGS[region]) return region;
    }
    // Fallback: language prefix heuristics
    const prefix = parts[0].toLowerCase();
    const LANG_COUNTRY: Record<string, string> = {
      pt: "PT",
      es: "ES",
      it: "IT",
      fr: "FR",
      de: "DE",
    };
    if (LANG_COUNTRY[prefix]) return LANG_COUNTRY[prefix];
  } catch {
    // Safe fallback
  }
  return DEFAULT_COUNTRY;
}

/**
 * Best-effort country inference combining timezone and locale signals.
 * Timezone takes priority since it is more specific.
 */
export function inferCountry(): string {
  const fromTz = inferCountryFromTimezone();
  if (fromTz !== DEFAULT_COUNTRY) return fromTz;
  return inferCountryFromLocale();
}
