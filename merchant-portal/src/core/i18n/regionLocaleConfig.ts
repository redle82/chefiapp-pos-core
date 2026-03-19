/**
 * Configuração de idioma por região e país.
 * - Brasil: pt-BR
 * - Europa: idioma do país (pt-PT, es, en, de, fr, it, ...)
 * - Resto do mundo: en (ou idioma do país quando existir)
 *
 * Locales suportados na app: pt-PT, pt-BR, en, es.
 * Países sem locale específico usam fallback por região.
 */

export type SupportedLocale = "pt-PT" | "pt-BR" | "en" | "es";

export type PaymentRegion = "br" | "europe" | "rest";

/** País (ISO 3166-1 alpha-2) → locale i18n. */
export const COUNTRY_LOCALE: Record<string, SupportedLocale> = {
  // Brasil
  BR: "pt-BR",
  // Europa — idioma do país
  PT: "pt-PT",
  ES: "es",
  AD: "es", // Andorra — es
  FR: "en", // France — fallback en until fr bundle exists
  DE: "en", // Germany — fallback en until de bundle exists
  IT: "en", // Italy — fallback en until it bundle exists
  NL: "en",
  BE: "en",
  AT: "en",
  CH: "en",
  PL: "en",
  RO: "en",
  GR: "en",
  CZ: "en",
  HU: "en",
  SE: "en",
  IE: "en",
  FI: "en",
  DK: "en",
  NO: "en",
  // Resto do mundo
  US: "en",
  GB: "en",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  CA: "en",
  AU: "en",
  JP: "en",
  CN: "en",
  IN: "en",
};

/** Região → locale padrão quando não há país. */
export const REGION_DEFAULT_LOCALE: Record<PaymentRegion, SupportedLocale> = {
  br: "pt-BR",
  europe: "en",
  rest: "en",
};

/** Moeda → região (para fallback quando não há país). */
export const CURRENCY_REGION: Record<string, PaymentRegion> = {
  BRL: "br",
  EUR: "europe",
  USD: "rest",
  GBP: "rest",
  MXN: "rest",
  CAD: "rest",
  AUD: "rest",
};

/**
 * Devolve o locale i18n para um país.
 * Fallback: rest → en.
 */
export function getLocaleForCountry(
  country: string | null | undefined,
): SupportedLocale {
  if (!country || typeof country !== "string") return "en";
  const code = country.trim().toUpperCase().slice(0, 2);
  return COUNTRY_LOCALE[code] ?? "en";
}

/**
 * Devolve o locale para uma região (e opcionalmente país).
 * When only region is known, uses neutral default (en for Europe).
 */
export function getLocaleForRegion(
  region: PaymentRegion,
  country?: string | null,
): SupportedLocale {
  if (country) return getLocaleForCountry(country);
  return REGION_DEFAULT_LOCALE[region] ?? "en";
}

/**
 * Devolve o locale a usar: prioridade país > moeda (região) > default.
 * Útil no arranque quando temos country e/ou currency em storage.
 */
export function resolveLocale(
  country: string | null | undefined,
  currency: string | null | undefined,
): SupportedLocale {
  if (country) return getLocaleForCountry(country);
  if (currency) {
    const region = CURRENCY_REGION[currency.toUpperCase()];
    if (region) return REGION_DEFAULT_LOCALE[region];
  }
  return "en";
}

/**
 * Mapeia um BCP 47 / navigator.language para SupportedLocale.
 * Usado na primeira visita quando não há chefiapp_locale nem país/moeda.
 */
function mapBrowserLangToSupported(lang: string): SupportedLocale | null {
  const lower = lang.toLowerCase();
  const prefix = lower.slice(0, 2);
  if (prefix === "es") return "es";
  if (prefix === "en") return "en";
  if (prefix === "pt") {
    if (lower.includes("br") || lower === "pt-br") return "pt-BR";
    if (lower === "pt-pt" || lower.startsWith("pt-pt")) return "pt-PT";
    return "pt-BR";
  }
  return null;
}

/**
 * Devolve o locale sugerido a partir do idioma do browser (navigator.language / navigator.languages).
 * Só corre no client; em SSR devolve "en".
 */
export function getLocaleFromBrowser(): SupportedLocale {
  if (typeof window === "undefined") return "en";
  const lang = navigator.language || (navigator.languages && navigator.languages[0]) || "";
  const mapped = mapBrowserLangToSupported(lang);
  if (mapped) return mapped;
  for (const l of navigator.languages || []) {
    const m = mapBrowserLangToSupported(l);
    if (m) return m;
  }
  return "en";
}

// ---------------------------------------------------------------------------
// Intl-compatible locale for date/number formatting
// ---------------------------------------------------------------------------

/**
 * Map SupportedLocale (i18n key) → full BCP 47 locale for Intl APIs.
 *
 * "pt-PT" and "pt-BR" are already valid BCP 47 tags.
 * "en" → "en-GB" (European-oriented default; day-month-year order).
 * "es" → "es-ES".
 */
const INTL_LOCALE_MAP: Record<SupportedLocale, string> = {
  "pt-PT": "pt-PT",
  "pt-BR": "pt-BR",
  en: "en-GB",
  es: "es-ES",
};

/**
 * Convert a SupportedLocale to a BCP 47 locale string suitable for
 * `Intl.DateTimeFormat`, `Intl.NumberFormat`, `toLocaleString`, etc.
 */
export function toIntlLocale(locale: SupportedLocale): string {
  return INTL_LOCALE_MAP[locale] ?? "en-GB";
}

const LOCALE_STORAGE_KEY = "chefiapp_locale";

/**
 * Return the current Intl-compatible locale for formatting.
 *
 * Reads the persisted app locale from localStorage (set by useCurrency
 * hook via `resolveLocale`) and maps it to a full BCP 47 tag.
 *
 * Safe to call outside React (services, utilities, helpers).
 */
export function getFormatLocale(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(
      LOCALE_STORAGE_KEY,
    ) as SupportedLocale | null;
    if (saved && saved in INTL_LOCALE_MAP) {
      return INTL_LOCALE_MAP[saved];
    }
  }
  return "en-GB";
}
