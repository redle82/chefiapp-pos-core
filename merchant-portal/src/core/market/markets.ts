/**
 * Market Matrix — Source of truth for all markets.
 *
 * Order of entry (go-to-market 2026/2027):
 *   1st wave: ES, UK, IE, AU, NZ  (supported)
 *   2nd wave: US, NL, BE           (restricted → supported)
 *   3rd wave: PT                    (restricted → supported after AT certification)
 *   Avoid:   FR, DE, IT, BR        (blocked)
 */
import type { MarketDefinition } from "./marketTypes";

export const MARKETS: Record<string, MarketDefinition> = {
  /* ─── 1st WAVE — Supported ─── */

  ES: {
    countryCode: "ES",
    name: "España",
    status: "supported",
    defaultLanguage: "es",
    availableLanguages: ["es", "en", "pt"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Madrid",
    onboardingEnabled: true,
    checkoutEnabled: true,
    installEnabled: true,
    leadCaptureOnly: false,
    landingRoute: "/es",
    disclaimer: null,
    visiblePlans: ["essencial", "profissional", "enterprise", "custom"],
    eurConversionRate: 1.0,
    complianceNotes: "VeriFactu obrigatório a partir de Jan 2027 (IS) / Jul 2027 (restantes). TicketBAI no País Basco.",
  },

  GB: {
    countryCode: "GB",
    name: "United Kingdom",
    status: "supported",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "GBP",
    currencySymbol: "£",
    defaultTimezone: "Europe/London",
    onboardingEnabled: true,
    checkoutEnabled: true,
    installEnabled: true,
    leadCaptureOnly: false,
    landingRoute: "/uk",
    disclaimer: null,
    visiblePlans: ["essencial", "profissional", "enterprise", "custom"],
    eurConversionRate: 0.86,
    complianceNotes: "HMRC record-keeping only. No POS certification. VAT records + till rolls.",
  },

  IE: {
    countryCode: "IE",
    name: "Ireland",
    status: "supported",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Dublin",
    onboardingEnabled: true,
    checkoutEnabled: true,
    installEnabled: true,
    leadCaptureOnly: false,
    landingRoute: "/ireland",
    disclaimer: null,
    visiblePlans: ["essencial", "profissional", "enterprise", "custom"],
    eurConversionRate: 1.0,
    complianceNotes: "Revenue record-keeping 6 years. No POS certification required.",
  },

  AU: {
    countryCode: "AU",
    name: "Australia",
    status: "supported",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "AUD",
    currencySymbol: "A$",
    defaultTimezone: "Australia/Sydney",
    onboardingEnabled: true,
    checkoutEnabled: true,
    installEnabled: true,
    leadCaptureOnly: false,
    landingRoute: "/au",
    disclaimer: null,
    visiblePlans: ["essencial", "profissional", "enterprise", "custom"],
    eurConversionRate: 1.68,
    complianceNotes: "Record-keeping + prohibition of sales suppression tools. No POS certification.",
  },

  NZ: {
    countryCode: "NZ",
    name: "New Zealand",
    status: "supported",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "NZD",
    currencySymbol: "NZ$",
    defaultTimezone: "Pacific/Auckland",
    onboardingEnabled: true,
    checkoutEnabled: true,
    installEnabled: true,
    leadCaptureOnly: false,
    landingRoute: "/nz",
    disclaimer: null,
    visiblePlans: ["essencial", "profissional", "enterprise", "custom"],
    eurConversionRate: 1.87,
    complianceNotes: "Inland Revenue record-keeping 7 years. No POS certification.",
  },

  /* ─── 2nd WAVE — Restricted (lead capture, marketing visible) ─── */

  US: {
    countryCode: "US",
    name: "United States",
    status: "restricted",
    defaultLanguage: "en",
    availableLanguages: ["en", "es"],
    currency: "USD",
    currencySymbol: "$",
    defaultTimezone: "America/New_York",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: true,
    landingRoute: null,
    disclaimer: "ChefiApp is coming soon to the United States. Join the waitlist.",
    visiblePlans: ["essencial", "profissional", "enterprise"],
    eurConversionRate: 1.08,
    complianceNotes: "No federal POS certification. Fragmented by state + sales tax. IRS record-keeping.",
  },

  NL: {
    countryCode: "NL",
    name: "Nederland",
    status: "restricted",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Amsterdam",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: true,
    landingRoute: null,
    disclaimer: "ChefiApp komt binnenkort naar Nederland. Meld je aan voor de wachtlijst.",
    visiblePlans: ["essencial", "profissional", "enterprise"],
    eurConversionRate: 1.0,
    complianceNotes: "No mandatory POS fiscalization. Belastingdienst admin-check for horeca. Record-keeping focus.",
  },

  BE: {
    countryCode: "BE",
    name: "Belgique / België",
    status: "restricted",
    defaultLanguage: "fr",
    availableLanguages: ["fr", "en"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Brussels",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: true,
    landingRoute: null,
    disclaimer: "ChefiApp arrive bientôt en Belgique.",
    visiblePlans: ["essencial", "profissional", "enterprise"],
    eurConversionRate: 1.0,
    complianceNotes: "B2B e-invoicing mandatory since Jan 2026. Horeca GKS/black box legacy. Not lightweight.",
  },

  /* ─── 3rd WAVE — Restricted (compliance in progress) ─── */

  PT: {
    countryCode: "PT",
    name: "Portugal",
    status: "restricted",
    defaultLanguage: "pt",
    availableLanguages: ["pt", "en", "es"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Lisbon",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: true,
    landingRoute: null,
    disclaimer: "O ChefiApp está em processo de certificação junto da AT. Entra na lista de espera.",
    visiblePlans: ["essencial", "profissional", "enterprise"],
    eurConversionRate: 1.0,
    complianceNotes: "AT-certified billing software required. ATCUD, QR, series, webservices. Heavy compliance stack.",
  },

  /* ─── BLOCKED — Heavy fiscal compliance ─── */

  FR: {
    countryCode: "FR",
    name: "France",
    status: "blocked",
    defaultLanguage: "fr",
    availableLanguages: ["fr", "en"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Paris",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: false,
    landingRoute: null,
    disclaimer: "ChefiApp n'est pas encore disponible en France.",
    visiblePlans: [],
    eurConversionRate: 1.0,
    complianceNotes: "NF525/LNE certification mandatory from Sep 2026. No self-certification. Heavy.",
  },

  DE: {
    countryCode: "DE",
    name: "Deutschland",
    status: "blocked",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Berlin",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: false,
    landingRoute: null,
    disclaimer: "ChefiApp ist in Deutschland noch nicht verfügbar.",
    visiblePlans: [],
    eurConversionRate: 1.0,
    complianceNotes: "KassenSichV TSE mandatory. Hardware fiscal device required.",
  },

  IT: {
    countryCode: "IT",
    name: "Italia",
    status: "blocked",
    defaultLanguage: "en",
    availableLanguages: ["en"],
    currency: "EUR",
    currencySymbol: "€",
    defaultTimezone: "Europe/Rome",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: false,
    landingRoute: null,
    disclaimer: "ChefiApp non è ancora disponibile in Italia.",
    visiblePlans: [],
    eurConversionRate: 1.0,
    complianceNotes: "Digital POS-terminal linkage mandatory since Jan 2026.",
  },

  BR: {
    countryCode: "BR",
    name: "Brasil",
    status: "blocked",
    defaultLanguage: "pt",
    availableLanguages: ["pt"],
    currency: "BRL",
    currencySymbol: "R$",
    defaultTimezone: "America/Sao_Paulo",
    onboardingEnabled: false,
    checkoutEnabled: false,
    installEnabled: false,
    leadCaptureOnly: false,
    landingRoute: null,
    disclaimer: "O ChefiApp ainda não está disponível no Brasil.",
    visiblePlans: [],
    eurConversionRate: 5.5,
    complianceNotes: "NFC-e by state. SEFAZ credentialing. ICP-Brasil digital certificate. Very heavy.",
  },
};

/* ─── Default / fallback market for unknown countries ─── */
export const DEFAULT_MARKET: MarketDefinition = {
  countryCode: "XX",
  name: "International",
  status: "restricted",
  defaultLanguage: "en",
  availableLanguages: ["en", "es", "pt", "fr"],
  currency: "EUR",
  currencySymbol: "€",
  defaultTimezone: "UTC",
  onboardingEnabled: false,
  checkoutEnabled: false,
  installEnabled: false,
  leadCaptureOnly: true,
  landingRoute: null,
  disclaimer: "ChefiApp is expanding globally. Join the waitlist for your region.",
  visiblePlans: ["essencial", "profissional", "enterprise"],
  eurConversionRate: 1.0,
  complianceNotes: "Unknown market. Default to restricted.",
};

/** Get market definition for a country code. Falls back to DEFAULT_MARKET. */
export function getMarket(countryCode: string): MarketDefinition {
  return MARKETS[countryCode.toUpperCase()] ?? DEFAULT_MARKET;
}

/** Get all supported markets (for landing page selectors etc.) */
export function getSupportedMarkets(): MarketDefinition[] {
  return Object.values(MARKETS).filter((m) => m.status === "supported");
}

/** Get all markets where lead capture is possible */
export function getAvailableMarkets(): MarketDefinition[] {
  return Object.values(MARKETS).filter((m) => m.status !== "blocked");
}
