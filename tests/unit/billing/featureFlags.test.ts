/**
 * Unit tests: billing-core featureFlags — resolveActiveModules, isModuleEnabledForBilling
 */
import {
  isModuleEnabledForBilling,
  resolveActiveModules,
  type BillingStatus,
} from "../../../billing-core/featureFlags";

describe("featureFlags resolveActiveModules", () => {
  it("trial_expired returns empty (block everything except landing)", () => {
    const mods = resolveActiveModules("trial_expired", "pro");
    expect(mods).toEqual([]);
  });

  it("trial returns Starter modules only", () => {
    const mods = resolveActiveModules("trial", "pro");
    expect(mods).toContain("core_pos");
    expect(mods).toContain("core_kds");
    expect(mods).toContain("team_management");
    expect(mods).toContain("analytics_basic");
    expect(mods).toContain("billing_management");
    expect(mods).toContain("exports");
    expect(mods).not.toContain("team_pulse");
    expect(mods).not.toContain("analytics_pro");
    expect(mods).not.toContain("compliance");
  });

  it("active returns plan-based modules", () => {
    const mods = resolveActiveModules("active", "enterprise");
    expect(mods).toContain("compliance");
    expect(mods).toContain("marketing_crm");
  });

  it("past_due returns core readonly only", () => {
    const mods = resolveActiveModules("past_due", "pro");
    expect(mods).toContain("core_pos");
    expect(mods).toContain("core_kds");
    expect(mods).toContain("analytics_basic");
    expect(mods).toContain("exports");
    expect(mods).not.toContain("team_pulse");
    expect(mods).not.toContain("audit_dashboard");
  });

  it("incomplete returns core readonly only", () => {
    const mods = resolveActiveModules("incomplete", "pro");
    expect(mods).toContain("core_pos");
    expect(mods).toContain("core_kds");
    expect(mods).not.toContain("team_tasks");
  });

  it("paused returns core readonly only", () => {
    const mods = resolveActiveModules("paused", "enterprise");
    expect(mods).toContain("core_pos");
    expect(mods).not.toContain("marketing_crm");
  });

  it("canceled returns core readonly only", () => {
    const mods = resolveActiveModules("canceled", "pro");
    expect(mods).toContain("exports");
    expect(mods).not.toContain("team_pulse");
  });

  it("past_due_limited returns core readonly only", () => {
    const mods = resolveActiveModules("past_due_limited", "pro");
    expect(mods).toContain("core_pos");
    expect(mods).toContain("core_kds");
    expect(mods).not.toContain("team_pulse");
  });

  it("past_due_readonly returns core readonly only", () => {
    const mods = resolveActiveModules("past_due_readonly", "enterprise");
    expect(mods).toContain("core_pos");
    expect(mods).not.toContain("compliance");
  });
});

describe("featureFlags isModuleEnabledForBilling", () => {
  it("trial_expired blocks all modules", () => {
    expect(isModuleEnabledForBilling("trial_expired", "enterprise", "core_pos")).toBe(false);
    expect(isModuleEnabledForBilling("trial_expired", "pro", "core_kds")).toBe(false);
  });

  it("trial enables Starter modules", () => {
    expect(isModuleEnabledForBilling("trial", "pro", "core_pos")).toBe(true);
    expect(isModuleEnabledForBilling("trial", "pro", "analytics_basic")).toBe(true);
    expect(isModuleEnabledForBilling("trial", "pro", "compliance")).toBe(false);
  });

  it("active + enterprise enables compliance", () => {
    expect(isModuleEnabledForBilling("active", "enterprise", "compliance")).toBe(true);
  });

  it("past_due enables core readonly only", () => {
    expect(isModuleEnabledForBilling("past_due", "pro", "core_pos")).toBe(true);
    expect(isModuleEnabledForBilling("past_due", "pro", "team_pulse")).toBe(false);
  });
});
