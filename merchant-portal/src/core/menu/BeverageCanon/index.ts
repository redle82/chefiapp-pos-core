/**
 * BEVERAGE CANON - MAIN LOADER
 *
 * Central API for loading country-specific beverage templates.
 */

import { Logger } from "../../logger";
import { UNIVERSAL_BEVERAGE_CATEGORIES, getCategoryName } from "./categories";
import { ES_BEVERAGE_CANON } from "./countries/ES";
import { DEFAULT_BEVERAGE_CANON } from "./countries/_default";
import type { CountryBeverageCanon } from "./types";

/**
 * Load beverage canon for a specific country.
 * Falls back to default canon if country not found.
 */
export function getBeverageCanon(countryCode: string): CountryBeverageCanon {
  const normalized = countryCode.toUpperCase();

  switch (normalized) {
    case "ES":
      return ES_BEVERAGE_CANON;
    // Future: BR, PT, FR, etc.
    default:
      Logger.warn(
        `[BeverageCanon] No specific canon for ${countryCode}, using default`,
      );
      return DEFAULT_BEVERAGE_CANON;
  }
}

/**
 * Get all available country codes with canons
 */
export function getAvailableCountries(): string[] {
  return ["ES"]; // Expand as more countries are added
}

export { UNIVERSAL_BEVERAGE_CATEGORIES, getCategoryName };

export type {
  BeverageCanonCategory,
  BeverageCanonItem,
  CountryBeverageCanon,
} from "./types";
