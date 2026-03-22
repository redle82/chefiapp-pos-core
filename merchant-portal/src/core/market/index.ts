// Market / Internationalisation — Public API
export type {
  MarketStatus,
  SupportedLanguage,
  MarketDefinition,
  GeoContext,
  UserMarketPreferences,
} from "./marketTypes";

export {
  MARKETS,
  DEFAULT_MARKET,
  getMarket,
  getSupportedMarkets,
  getAvailableMarkets,
} from "./markets";

export {
  resolveGeoContext,
  setCountryOverride,
  setLanguageOverride,
  clearOverrides,
  isOnboardingAllowed,
  isCheckoutAllowed,
  isInstallAllowed,
  isLeadCaptureOnly,
  isMarketBlocked,
} from "./GeoResolver";

export { MarketProvider, useMarket } from "./MarketContext";
export { MarketGuard } from "./MarketGuard";
