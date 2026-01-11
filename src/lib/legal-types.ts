// Legal Adaptation Engine — Types

export type ISO2CountryCode =
  | "ES"
  | "PT"
  | "UK"
  | "US"
  | "BR"
  | "FR"
  | "DE"
  | "IT"
  | "MX"
  | string;

export interface LaborLaws {
  max_hours_per_day: number;
  max_hours_per_week: number;
  mandatory_break_after: number; // hours
  night_shift_premium?: number; // percent
  overtime_rules?: "strict" | "normal" | "lenient";
  min_rest_between_shifts_hours?: number; // e.g., 12h
}

export interface DataProtection {
  gdpr?: boolean;
  lgpd?: boolean;
  ccpa?: boolean;
  photo_restrictions?: "explicit_consent" | "implicit_consent" | "prohibited";
  data_retention_max_years?: number;
}

export interface HygieneRegulations {
  haccp_required?: boolean;
  temperature_logs_required?: boolean;
  food_handler_certification_required?: boolean;
  retention_years?: number;
}

export interface Penalties {
  privacy_violations?: string;
  food_safety_violations?: string;
  labor_violations?: string;
}

export interface LegalProfile {
  country: string;
  iso: ISO2CountryCode;
  languages: string[];
  currency: string;
  labor_laws: LaborLaws;
  data_protection: DataProtection;
  hygiene_regulations: HygieneRegulations;
  penalties?: Penalties;
}

export interface AdaptedAppConfig {
  countryCode: ISO2CountryCode;
  companyId: string;
  locale: string; // e.g., "es-ES"
  timeZone?: string;
  currency: string;
  enabledFeatures: string[]; // e.g., ["haccp", "gdpr_compliance"]
  warnings: string[];
  requiredActions: string[];
}

export type OperationType =
  | "photo_capture"
  | "employee_shift"
  | "data_export"
  | "card_payment"
  | "alcohol_service"
  | string;

export interface OperationValidationResult {
  valid: boolean;
  violations: string[];
}

export interface OvertimeValidationResult {
  valid: boolean;
  violations: string[];
  recommendedActions?: string[];
}

export interface ComplianceScoreBreakdown {
  score: number; // 0-100
  checks: {
    key: string;
    passed: boolean;
    weight: number;
    note?: string;
  }[];
}

export interface DetectCountryHints {
  navigatorLanguage?: string;
  timeZone?: string;
  geoCountryCode?: ISO2CountryCode;
}
