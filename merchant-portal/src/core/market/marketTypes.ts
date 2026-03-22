/**
 * Market / Internationalisation — Type definitions.
 *
 * Three market statuses:
 *   supported  — full onboarding, checkout, install, TPV
 *   restricted — marketing + lead capture only (waitlist / contact)
 *   blocked    — marketing visible, no onboarding, no checkout
 */

/* ─── Market Status ─── */
export type MarketStatus = "supported" | "restricted" | "blocked";

/* ─── Supported Languages ─── */
export type SupportedLanguage = "pt" | "en" | "es" | "fr";

/* ─── Market Definition ─── */
export interface MarketDefinition {
  /** ISO 3166-1 alpha-2 country code (uppercase) */
  countryCode: string;
  /** Human-readable name (in the market's primary language) */
  name: string;
  /** Market operational status */
  status: MarketStatus;
  /** Default language for this market */
  defaultLanguage: SupportedLanguage;
  /** Languages available in this market */
  availableLanguages: SupportedLanguage[];
  /** ISO 4217 currency code */
  currency: string;
  /** Currency symbol for display */
  currencySymbol: string;
  /** IANA timezone (default for new restaurants) */
  defaultTimezone: string;
  /** Whether onboarding/setup is allowed */
  onboardingEnabled: boolean;
  /** Whether checkout/billing is allowed */
  checkoutEnabled: boolean;
  /** Whether install/TPV is allowed */
  installEnabled: boolean;
  /** Whether only lead capture (waitlist) is allowed */
  leadCaptureOnly: boolean;
  /** Localized landing page route (null = use main landing) */
  landingRoute: string | null;
  /** Legal/commercial disclaimer for this market */
  disclaimer: string | null;
  /** Pricing plans visible in this market */
  visiblePlans: Array<"essencial" | "profissional" | "enterprise" | "custom">;
  /** Approximate conversion rate to EUR for display (1.0 = EUR) */
  eurConversionRate: number;
  /** Fiscal compliance notes (internal) */
  complianceNotes: string;
}

/* ─── Resolved Geo Context ─── */
export interface GeoContext {
  /** Resolved country code */
  countryCode: string;
  /** How the country was resolved */
  resolvedBy: "manual" | "geolocation" | "browser_locale" | "timezone" | "fallback";
  /** Market definition for resolved country */
  market: MarketDefinition;
  /** Active language */
  language: SupportedLanguage;
  /** How the language was resolved */
  languageResolvedBy: "manual" | "market_default" | "browser" | "fallback";
  /** Active currency */
  currency: string;
  /** Active timezone */
  timezone: string;
}

/* ─── User Preferences (persisted) ─── */
export interface UserMarketPreferences {
  /** Manually selected country (null = auto-detect) */
  countryOverride: string | null;
  /** Manually selected language (null = auto from market) */
  languageOverride: SupportedLanguage | null;
}
