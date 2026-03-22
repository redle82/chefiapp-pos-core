/**
 * GeoResolver — Resolve country, language, currency and timezone.
 *
 * Resolution order (each step only used if previous fails):
 *   1. Manual override (user chose country/language)
 *   2. Persisted preference (localStorage)
 *   3. Browser locale / Accept-Language
 *   4. Timezone-based heuristic
 *   5. Fallback (International / EN)
 *
 * This is a pure function module — no side effects, no React dependencies.
 */
import type {
  GeoContext,
  SupportedLanguage,
  UserMarketPreferences,
} from "./marketTypes";
import { getMarket, DEFAULT_MARKET } from "./markets";

/* ─── Storage Keys ─── */
const STORAGE_KEY_COUNTRY = "chefiapp_market_country";
const STORAGE_KEY_LANGUAGE = "chefiapp_market_language";

/* ─── Timezone → Country mapping (most common) ─── */
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  "Europe/Madrid": "ES",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Lisbon": "PT",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Sao_Paulo": "BR",
  "America/Buenos_Aires": "AR",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Australia/Brisbane": "AU",
  "Pacific/Auckland": "NZ",
  "Atlantic/Canary": "ES",
  "Atlantic/Madeira": "PT",
  "Atlantic/Azores": "PT",
};

/* ─── Language → Country hint (weak signal) ─── */
const LANG_COUNTRY_HINT: Record<string, string> = {
  "pt-BR": "BR",
  "pt-PT": "PT",
  "pt": "PT",
  "es-ES": "ES",
  "es-MX": "US",
  "es": "ES",
  "en-GB": "GB",
  "en-AU": "AU",
  "en-NZ": "NZ",
  "en-IE": "IE",
  "en-US": "US",
  "en": "GB",
  "fr-FR": "FR",
  "fr-BE": "BE",
  "fr": "FR",
  "de-DE": "DE",
  "de-AT": "DE",
  "de": "DE",
  "nl-NL": "NL",
  "nl-BE": "BE",
  "nl": "NL",
  "it-IT": "IT",
  "it": "IT",
};

const VALID_LANGUAGES = new Set<SupportedLanguage>(["pt", "en", "es", "fr"]);

/* ─── Helpers ─── */

function getPersistedPreferences(): UserMarketPreferences {
  try {
    return {
      countryOverride: localStorage.getItem(STORAGE_KEY_COUNTRY),
      languageOverride: localStorage.getItem(STORAGE_KEY_LANGUAGE) as SupportedLanguage | null,
    };
  } catch {
    return { countryOverride: null, languageOverride: null };
  }
}

function persistPreferences(prefs: Partial<UserMarketPreferences>): void {
  try {
    if (prefs.countryOverride !== undefined) {
      if (prefs.countryOverride) {
        localStorage.setItem(STORAGE_KEY_COUNTRY, prefs.countryOverride);
      } else {
        localStorage.removeItem(STORAGE_KEY_COUNTRY);
      }
    }
    if (prefs.languageOverride !== undefined) {
      if (prefs.languageOverride) {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, prefs.languageOverride);
      } else {
        localStorage.removeItem(STORAGE_KEY_LANGUAGE);
      }
    }
  } catch {
    // localStorage unavailable (SSR, privacy mode)
  }
}

function getBrowserLanguage(): string | null {
  try {
    const lang = navigator.language || (navigator.languages?.[0] ?? null);
    return lang ?? null;
  } catch {
    return null;
  }
}

function getBrowserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

function extractLangBase(lang: string): SupportedLanguage | null {
  const base = lang.split("-")[0].toLowerCase();
  return VALID_LANGUAGES.has(base as SupportedLanguage) ? (base as SupportedLanguage) : null;
}

/* ─── Main Resolver ─── */

export function resolveGeoContext(
  manualOverrides?: Partial<UserMarketPreferences>
): GeoContext {
  const persisted = getPersistedPreferences();

  // Apply manual overrides if provided
  const effectiveCountryOverride = manualOverrides?.countryOverride ?? persisted.countryOverride;
  const effectiveLangOverride = manualOverrides?.languageOverride ?? persisted.languageOverride;

  // ─── Step 1: Resolve Country ───
  let countryCode: string;
  let resolvedBy: GeoContext["resolvedBy"];

  if (effectiveCountryOverride) {
    countryCode = effectiveCountryOverride.toUpperCase();
    resolvedBy = "manual";
  } else {
    // Try browser locale
    const browserLang = getBrowserLanguage();
    const langHint = browserLang ? LANG_COUNTRY_HINT[browserLang] ?? LANG_COUNTRY_HINT[browserLang.split("-")[0]] : null;

    // Try timezone
    const tz = getBrowserTimezone();
    const tzHint = tz ? TIMEZONE_COUNTRY_MAP[tz] : null;

    if (langHint) {
      countryCode = langHint;
      resolvedBy = "browser_locale";
    } else if (tzHint) {
      countryCode = tzHint;
      resolvedBy = "timezone";
    } else {
      countryCode = DEFAULT_MARKET.countryCode;
      resolvedBy = "fallback";
    }
  }

  const market = getMarket(countryCode);

  // ─── Step 2: Resolve Language ───
  let language: SupportedLanguage;
  let languageResolvedBy: GeoContext["languageResolvedBy"];

  if (effectiveLangOverride && VALID_LANGUAGES.has(effectiveLangOverride)) {
    language = effectiveLangOverride;
    languageResolvedBy = "manual";
  } else {
    // Try browser language against market's available languages
    const browserLang = getBrowserLanguage();
    const browserLangBase = browserLang ? extractLangBase(browserLang) : null;

    if (browserLangBase && market.availableLanguages.includes(browserLangBase)) {
      language = browserLangBase;
      languageResolvedBy = "browser";
    } else {
      language = market.defaultLanguage;
      languageResolvedBy = "market_default";
    }
  }

  return {
    countryCode: market.countryCode === "XX" ? countryCode : market.countryCode,
    resolvedBy,
    market,
    language,
    languageResolvedBy,
    currency: market.currency,
    timezone: market.defaultTimezone,
  };
}

/* ─── Manual Override API ─── */

export function setCountryOverride(countryCode: string | null): void {
  persistPreferences({ countryOverride: countryCode });
}

export function setLanguageOverride(language: SupportedLanguage | null): void {
  persistPreferences({ languageOverride: language });
}

export function clearOverrides(): void {
  persistPreferences({ countryOverride: null, languageOverride: null });
}

/* ─── Market Availability Checks ─── */

export function isOnboardingAllowed(ctx: GeoContext): boolean {
  return ctx.market.onboardingEnabled;
}

export function isCheckoutAllowed(ctx: GeoContext): boolean {
  return ctx.market.checkoutEnabled;
}

export function isInstallAllowed(ctx: GeoContext): boolean {
  return ctx.market.installEnabled;
}

export function isLeadCaptureOnly(ctx: GeoContext): boolean {
  return ctx.market.leadCaptureOnly;
}

export function isMarketBlocked(ctx: GeoContext): boolean {
  return ctx.market.status === "blocked";
}
