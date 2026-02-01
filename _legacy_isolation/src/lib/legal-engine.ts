// Legal Adaptation Engine — Core
import type {
  ISO2CountryCode,
  LegalProfile,
  AdaptedAppConfig,
  DetectCountryHints,
  OperationType,
  OperationValidationResult,
} from "./legal-types";

// Lightweight JSON loader (repo-root relative)
async function loadJSONProfile(code: ISO2CountryCode): Promise<LegalProfile> {
  const fs = await import("fs/promises");
  const pathMod = await import("path");
  const filePath = pathMod.join(process.cwd(), "src", "lib", "legal-profiles", `${code.toLowerCase()}.json`);
  const buf = await fs.readFile(filePath, "utf-8");
  return JSON.parse(buf) as LegalProfile;
}

// Simple mapping for locale
function localeFor(code: ISO2CountryCode): string {
  switch (code) {
    case "ES":
      return "es-ES";
    case "PT":
      return "pt-PT";
    case "UK":
      return "en-GB";
    case "US":
      return "en-US";
    case "BR":
      return "pt-BR";
    case "FR":
      return "fr-FR";
    default:
      return "en-US";
  }
}

// Heuristic country detection (browser/Node compatible)
export async function detectCountry(hints?: DetectCountryHints): Promise<ISO2CountryCode> {
  // Priority: explicit geo hint → timezone → language → default
  if (hints?.geoCountryCode) return hints.geoCountryCode;
  if (hints?.timeZone) {
    // Simple mapping of timezones to country codes
    const tz = hints.timeZone.toLowerCase();
    if (tz.includes("madrid") || tz.includes("europe/madrid")) return "ES";
    if (tz.includes("lisbon") || tz.includes("europe/lisbon")) return "PT";
    if (tz.includes("london") || tz.includes("europe/london")) return "UK";
    if (tz.includes("new_york") || tz.includes("america")) return "US";
    if (tz.includes("sao_paulo") || tz.includes("america/sao_paulo")) return "BR";
    if (tz.includes("paris") || tz.includes("europe/paris")) return "FR";
  }
  if (hints?.navigatorLanguage) {
    const lang = hints.navigatorLanguage.toLowerCase();
    if (lang.startsWith("es")) return "ES";
    if (lang.startsWith("pt-br")) return "BR";
    if (lang.startsWith("pt")) return "PT";
    if (lang.startsWith("fr")) return "FR";
    if (lang.startsWith("en-gb")) return "UK";
    if (lang.startsWith("en")) return "US";
  }
  return "US"; // safe default
}

export async function loadLegalProfile(code: ISO2CountryCode): Promise<LegalProfile> {
  return loadJSONProfile(code);
}

export function adaptAppConfig(
  profile: LegalProfile,
  companyId: string,
): AdaptedAppConfig {
  const enabledFeatures: string[] = [];
  const warnings: string[] = [];
  const requiredActions: string[] = [];

  // Data protection → enable GDPR/LGPD modules
  if (profile.data_protection.gdpr) enabledFeatures.push("gdpr_compliance");
  if (profile.data_protection.lgpd) enabledFeatures.push("lgpd_compliance");

  // Hygiene → HACCP
  if (profile.hygiene_regulations.haccp_required) enabledFeatures.push("haccp");
  if (profile.hygiene_regulations.temperature_logs_required) enabledFeatures.push("temperature_logs");

  // Labor → shift validations
  enabledFeatures.push("labor_law_validation");

  // Required actions based on profile
  if (profile.hygiene_regulations.food_handler_certification_required) {
    requiredActions.push("upload_food_handler_certifications");
  }

  if (profile.data_protection.photo_restrictions === "explicit_consent") {
    requiredActions.push("enable_photo_consent_flow");
  }

  // Warnings
  if (profile.data_protection.data_retention_max_years && profile.data_protection.data_retention_max_years < 10) {
    warnings.push("Data retention limited; configure archive rotation.");
  }

  return {
    countryCode: profile.iso,
    companyId,
    locale: localeFor(profile.iso),
    timeZone: undefined,
    currency: profile.currency,
    enabledFeatures,
    warnings,
    requiredActions,
  };
}

// Validate specific operation by country
export function validateOperation(
  op: OperationType,
  profile: LegalProfile,
): OperationValidationResult {
  const violations: string[] = [];

  if (op === "photo_capture") {
    const restriction = profile.data_protection.photo_restrictions;
    if (restriction === "explicit_consent") {
      violations.push("Photo capture requires explicit consent (enable consent UI).");
    } else if (restriction === "prohibited") {
      violations.push("Photo capture prohibited under current data protection laws.");
    }
  }

  if (op === "employee_shift") {
    const maxDay = profile.labor_laws.max_hours_per_day;
    if (!maxDay || maxDay <= 0) {
      violations.push("Labor laws not configured: max_hours_per_day missing.");
    }
  }

  if (op === "alcohol_service" && profile.iso === "ES") {
    // Example: block service after 03:00 — enforcement occurs in app logic
    // Here we simply warn to configure UI/business rules
    violations.push("Configure alcohol service hours and age verification (ES).");
  }

  return { valid: violations.length === 0, violations };
}
