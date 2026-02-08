// MCP.LEGAL — Endpoints
import { detectCountry, loadLegalProfile, adaptAppConfig, validateOperation } from "./legal-engine";
import type {
  ISO2CountryCode,
  LegalProfile,
  OperationType,
  OperationValidationResult,
  OvertimeValidationResult,
  ComplianceScoreBreakdown,
} from "./legal-types";

export default {
  async autoDetectAndConfigure(companyId: string, hints?: { navigatorLanguage?: string; timeZone?: string; geoCountryCode?: ISO2CountryCode }) {
    const iso = await detectCountry(hints);
    const profile = await loadLegalProfile(iso);
    const config = adaptAppConfig(profile, companyId);
    return { iso, profile, config };
  },

  async loadCountryProfile(iso: ISO2CountryCode): Promise<LegalProfile> {
    return loadLegalProfile(iso);
  },

  async validateOperation(op: OperationType, companyId: string, iso: ISO2CountryCode): Promise<OperationValidationResult> {
    const profile = await loadLegalProfile(iso);
    return validateOperation(op, profile);
  },

  async validateEmployeeOvertime(
    userId: string,
    companyId: string,
    weeklyHours: number,
    overtimeHours: number,
    iso: ISO2CountryCode,
  ): Promise<OvertimeValidationResult> {
    const profile = await loadLegalProfile(iso);
    const violations: string[] = [];
    const actions: string[] = [];

    const maxWeek = profile.labor_laws.max_hours_per_week;
    const maxDay = profile.labor_laws.max_hours_per_day;
    const restMin = profile.labor_laws.min_rest_between_shifts_hours ?? 11;

    if (weeklyHours > maxWeek) {
      violations.push(`Weekly hours ${weeklyHours} exceed limit ${maxWeek}.`);
      actions.push("Reduce scheduled hours or split shifts.");
    }
    if (overtimeHours > 0 && profile.labor_laws.overtime_rules === "strict") {
      actions.push("Require manager approval for overtime (strict). ");
    }

    return { valid: violations.length === 0, violations, recommendedActions: actions };
  },

  async getComplianceWarnings(companyId: string, iso: ISO2CountryCode): Promise<string[]> {
    const profile = await loadLegalProfile(iso);
    const warnings: string[] = [];
    if (profile.data_protection.gdpr) warnings.push("GDPR enabled — ensure consent and data retention policies.");
    if (profile.hygiene_regulations.haccp_required) warnings.push("HACCP required — enable temperature logging and certification uploads.");
    return warnings;
  },

  async getRequiredActions(companyId: string, iso: ISO2CountryCode): Promise<string[]> {
    const profile = await loadLegalProfile(iso);
    const cfg = adaptAppConfig(profile, companyId);
    return cfg.requiredActions;
  },

  async calculateComplianceScore(companyId: string, iso: ISO2CountryCode): Promise<ComplianceScoreBreakdown> {
    const profile = await loadLegalProfile(iso);
    const checks: { key: string; passed: boolean; weight: number; note?: string }[] = [];

    // Example weights
    checks.push({ key: "gdpr", passed: !!profile.data_protection.gdpr, weight: 20 });
    checks.push({ key: "data_retention", passed: !!profile.data_protection.data_retention_max_years, weight: 10 });
    checks.push({ key: "haccp", passed: !!profile.hygiene_regulations.haccp_required, weight: 20 });
    checks.push({ key: "temperature_logs", passed: !!profile.hygiene_regulations.temperature_logs_required, weight: 10 });
    checks.push({ key: "labor_week_limit", passed: !!profile.labor_laws.max_hours_per_week, weight: 20 });
    checks.push({ key: "photo_consent", passed: profile.data_protection.photo_restrictions === "explicit_consent", weight: 20 });

    const total = checks.reduce((acc, c) => acc + (c.passed ? c.weight : 0), 0);
    const score = Math.min(100, total);

    return { score, checks };
  },
};
