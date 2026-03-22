/**
 * MarketContext — React context for geo/market/locale state.
 *
 * Provides resolved GeoContext to the entire app tree.
 * Supports manual overrides (country, language) that persist.
 * Emits analytics events on resolution and changes.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GeoContext, SupportedLanguage } from "./marketTypes";
import {
  resolveGeoContext,
  setCountryOverride,
  setLanguageOverride,
} from "./GeoResolver";

interface MarketContextValue {
  /** Current resolved geo context */
  geo: GeoContext;
  /** Change country manually */
  changeCountry: (countryCode: string) => void;
  /** Change language manually */
  changeLanguage: (language: SupportedLanguage) => void;
  /** Whether onboarding is allowed in current market */
  canOnboard: boolean;
  /** Whether checkout is allowed in current market */
  canCheckout: boolean;
  /** Whether install/TPV is allowed in current market */
  canInstall: boolean;
  /** Whether market is blocked */
  isBlocked: boolean;
  /** Whether market is restricted (lead capture only) */
  isRestricted: boolean;
  /** Whether market is fully supported */
  isSupported: boolean;
}

const MarketCtx = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [geo, setGeo] = useState<GeoContext>(() => resolveGeoContext());

  // Emit initial geo detection event
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Market] Resolved:", {
        country: geo.countryCode,
        resolvedBy: geo.resolvedBy,
        language: geo.language,
        status: geo.market.status,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCountry = useCallback((countryCode: string) => {
    setCountryOverride(countryCode);
    const newGeo = resolveGeoContext({ countryOverride: countryCode });
    setGeo(newGeo);

    if (import.meta.env.DEV) {
      console.log("[Market] Country changed:", countryCode, "→", newGeo.market.status);
    }
  }, []);

  const changeLanguage = useCallback((language: SupportedLanguage) => {
    setLanguageOverride(language);
    setGeo((prev) => ({
      ...prev,
      language,
      languageResolvedBy: "manual",
    }));

    if (import.meta.env.DEV) {
      console.log("[Market] Language changed:", language);
    }
  }, []);

  const value = useMemo<MarketContextValue>(
    () => ({
      geo,
      changeCountry,
      changeLanguage,
      canOnboard: geo.market.onboardingEnabled,
      canCheckout: geo.market.checkoutEnabled,
      canInstall: geo.market.installEnabled,
      isBlocked: geo.market.status === "blocked",
      isRestricted: geo.market.status === "restricted",
      isSupported: geo.market.status === "supported",
    }),
    [geo, changeCountry, changeLanguage]
  );

  return <MarketCtx.Provider value={value}>{children}</MarketCtx.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketCtx);
  if (!ctx) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return ctx;
}
