import { getCountryConfig, inferCountry } from "../config/CountryConfig";
import type { SalesChannel } from "./catalogTypes";

export type CatalogBusinessType =
  | "RESTAURANT"
  | "BAR"
  | "CAFE"
  | "FAST_CASUAL"
  | "OTHER";

export type CatalogImportMode = "none" | "photo" | "pdf" | "text" | "csv";

export interface CatalogSetupDraft {
  businessType: CatalogBusinessType;
  country: string;
  currency: string;
  locale: string;
  primaryLanguage: string;
  brands: string[];
  channels: SalesChannel[];
  initialTemplateId: string;
  importMode: CatalogImportMode;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = "chefiapp_catalog_setup_v1";

function buildDefaultDraft(): Omit<CatalogSetupDraft, "updatedAt"> {
  const country = inferCountry();
  const cfg = getCountryConfig(country);
  return {
    businessType: "RESTAURANT",
    country: cfg.code,
    currency: cfg.currency,
    locale: cfg.locale,
    primaryLanguage: cfg.locale,
    brands: ["Marca principal"],
    channels: ["LOCAL", "TAKEAWAY"],
    initialTemplateId: "classic-restaurant",
    importMode: "none",
  };
}

const DEFAULT_DRAFT: Omit<CatalogSetupDraft, "updatedAt"> = buildDefaultDraft();

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeChannels(value: unknown): SalesChannel[] {
  if (!Array.isArray(value)) return DEFAULT_DRAFT.channels;
  const allowed = new Set<SalesChannel>(["LOCAL", "TAKEAWAY", "DELIVERY"]);
  const channels = value.filter((item): item is SalesChannel =>
    allowed.has(item as SalesChannel),
  );
  return channels.length > 0 ? channels : DEFAULT_DRAFT.channels;
}

function normalizeBrands(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_DRAFT.brands;
  const brands = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return brands.length > 0 ? brands : DEFAULT_DRAFT.brands;
}

function sanitizeDraft(raw: Partial<CatalogSetupDraft>): CatalogSetupDraft {
  return {
    businessType:
      raw.businessType &&
      ["RESTAURANT", "BAR", "CAFE", "FAST_CASUAL", "OTHER"].includes(
        raw.businessType,
      )
        ? raw.businessType
        : DEFAULT_DRAFT.businessType,
    country: raw.country?.trim() || DEFAULT_DRAFT.country,
    currency: raw.currency?.trim() || DEFAULT_DRAFT.currency,
    locale: raw.locale?.trim() || DEFAULT_DRAFT.locale,
    primaryLanguage:
      raw.primaryLanguage?.trim() || DEFAULT_DRAFT.primaryLanguage,
    brands: normalizeBrands(raw.brands),
    channels: normalizeChannels(raw.channels),
    initialTemplateId:
      raw.initialTemplateId?.trim() || DEFAULT_DRAFT.initialTemplateId,
    importMode:
      raw.importMode &&
      ["none", "photo", "pdf", "text", "csv"].includes(raw.importMode)
        ? raw.importMode
        : DEFAULT_DRAFT.importMode,
    updatedAt: raw.updatedAt ?? nowIso(),
  };
}

export function buildCatalogSetupStorageKey(restaurantId: string): string {
  return `${STORAGE_KEY_PREFIX}_${restaurantId}`;
}

export function getDefaultCatalogSetupDraft(): CatalogSetupDraft {
  return {
    ...DEFAULT_DRAFT,
    updatedAt: nowIso(),
  };
}

export function loadCatalogSetupDraft(restaurantId: string): CatalogSetupDraft {
  if (typeof window === "undefined") return getDefaultCatalogSetupDraft();

  try {
    const raw = window.localStorage.getItem(
      buildCatalogSetupStorageKey(restaurantId),
    );
    if (!raw) return getDefaultCatalogSetupDraft();
    const parsed = JSON.parse(raw) as Partial<CatalogSetupDraft>;
    return sanitizeDraft(parsed);
  } catch {
    return getDefaultCatalogSetupDraft();
  }
}

export function saveCatalogSetupDraft(
  restaurantId: string,
  draft: CatalogSetupDraft,
): CatalogSetupDraft {
  const sanitized = sanitizeDraft({
    ...draft,
    updatedAt: nowIso(),
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        buildCatalogSetupStorageKey(restaurantId),
        JSON.stringify(sanitized),
      );
    } catch {
      // Ignore storage errors and keep app usable.
    }
  }

  return sanitized;
}

export function clearCatalogSetupDraft(restaurantId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(buildCatalogSetupStorageKey(restaurantId));
  } catch {
    // Ignore storage errors and keep app usable.
  }
}
