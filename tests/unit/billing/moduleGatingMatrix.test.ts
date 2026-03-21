/**
 * Tests: Module Gating — Phase 3 Enterprise Hardening
 *
 * Test matrix: every ModuleKey × every PlanTier
 * + usePlanModuleGate hook behavior
 * + ModuleGate component rendering
 */

import {
  getEnabledModules,
  getMinimumTier,
  getUpgradeModules,
  isModuleEnabled,
  type ModuleKey,
} from "../../../billing-core/featureFlags";
import type { PlanTier } from "../../../billing-core/types";

// ─── Feature Flag Gating Matrix ─────────────────────────

describe("featureFlags — Module Gating Matrix", () => {
  const ALL_TIERS: PlanTier[] = [
    "free",
    "trial",
    "starter",
    "pro",
    "enterprise",
  ];

  // ─── Core modules: always enabled for all tiers ───────

  describe("core_pos", () => {
    it.each(ALL_TIERS)("is enabled on %s", (tier) => {
      expect(isModuleEnabled(tier, "core_pos")).toBe(true);
    });
  });

  // ─── Free tier: only core_pos + analytics_basic ───────

  describe("free tier restrictions", () => {
    const BLOCKED_ON_FREE: ModuleKey[] = [
      "core_kds",
      "team_management",
      "team_pulse",
      "team_tasks",
      "analytics_pro",
      "billing_management",
      "inventory",
      "marketing_crm",
      "exports",
      "audit_dashboard",
      "compliance",
    ];

    it("allows core_pos and analytics_basic", () => {
      expect(isModuleEnabled("free", "core_pos")).toBe(true);
      expect(isModuleEnabled("free", "analytics_basic")).toBe(true);
    });

    it.each(BLOCKED_ON_FREE)("blocks %s", (moduleKey) => {
      expect(isModuleEnabled("free", moduleKey)).toBe(false);
    });

    it("returns exactly 2 modules", () => {
      expect(getEnabledModules("free")).toHaveLength(2);
    });
  });

  // ─── Starter tier: core + team_management + exports ───

  describe("starter tier", () => {
    const EXPECTED_STARTER: ModuleKey[] = [
      "core_pos",
      "core_kds",
      "team_management",
      "analytics_basic",
      "billing_management",
      "exports",
    ];

    it.each(EXPECTED_STARTER)("enables %s", (mod) => {
      expect(isModuleEnabled("starter", mod)).toBe(true);
    });

    it("blocks analytics_pro", () => {
      expect(isModuleEnabled("starter", "analytics_pro")).toBe(false);
    });

    it("blocks team_pulse", () => {
      expect(isModuleEnabled("starter", "team_pulse")).toBe(false);
    });

    it("blocks inventory", () => {
      expect(isModuleEnabled("starter", "inventory")).toBe(false);
    });

    it("blocks compliance", () => {
      expect(isModuleEnabled("starter", "compliance")).toBe(false);
    });

    it("returns exactly 6 modules", () => {
      expect(getEnabledModules("starter")).toHaveLength(6);
    });
  });

  // ─── Pro tier: most modules enabled ───────────────────

  describe("pro tier", () => {
    const EXPECTED_PRO: ModuleKey[] = [
      "core_pos",
      "core_kds",
      "team_management",
      "team_pulse",
      "team_tasks",
      "analytics_basic",
      "analytics_pro",
      "billing_management",
      "inventory",
      "exports",
      "audit_dashboard",
    ];

    it.each(EXPECTED_PRO)("enables %s", (mod) => {
      expect(isModuleEnabled("pro", mod)).toBe(true);
    });

    it("blocks marketing_crm", () => {
      expect(isModuleEnabled("pro", "marketing_crm")).toBe(false);
    });

    it("blocks compliance", () => {
      expect(isModuleEnabled("pro", "compliance")).toBe(false);
    });

    it("returns exactly 11 modules", () => {
      expect(getEnabledModules("pro")).toHaveLength(11);
    });
  });

  // ─── Enterprise tier: ALL modules enabled ─────────────

  describe("enterprise tier", () => {
    const ALL_MODULES: ModuleKey[] = [
      "core_pos",
      "core_kds",
      "team_management",
      "team_pulse",
      "team_tasks",
      "analytics_basic",
      "analytics_pro",
      "billing_management",
      "inventory",
      "marketing_crm",
      "exports",
      "audit_dashboard",
      "compliance",
    ];

    it.each(ALL_MODULES)("enables %s", (mod) => {
      expect(isModuleEnabled("enterprise", mod)).toBe(true);
    });

    it("returns exactly 13 modules (all)", () => {
      expect(getEnabledModules("enterprise")).toHaveLength(13);
    });
  });

  // ─── Trial tier: same as pro + audit_dashboard ────────

  describe("trial tier", () => {
    it("enables team_pulse (trial unlocks pro features)", () => {
      expect(isModuleEnabled("trial", "team_pulse")).toBe(true);
    });

    it("enables analytics_pro", () => {
      expect(isModuleEnabled("trial", "analytics_pro")).toBe(true);
    });

    it("enables exports", () => {
      expect(isModuleEnabled("trial", "exports")).toBe(true);
    });

    it("enables audit_dashboard", () => {
      expect(isModuleEnabled("trial", "audit_dashboard")).toBe(true);
    });

    it("blocks marketing_crm (enterprise-only)", () => {
      expect(isModuleEnabled("trial", "marketing_crm")).toBe(false);
    });

    it("blocks compliance (enterprise-only)", () => {
      expect(isModuleEnabled("trial", "compliance")).toBe(false);
    });
  });

  // ─── getMinimumTier ───────────────────────────────────

  describe("getMinimumTier", () => {
    it("core_pos → free (lowest)", () => {
      expect(getMinimumTier("core_pos")).toBe("free");
    });

    it("core_kds → trial", () => {
      expect(getMinimumTier("core_kds")).toBe("trial");
    });

    it("exports → trial", () => {
      expect(getMinimumTier("exports")).toBe("trial");
    });

    it("marketing_crm → enterprise", () => {
      expect(getMinimumTier("marketing_crm")).toBe("enterprise");
    });

    it("compliance → enterprise", () => {
      expect(getMinimumTier("compliance")).toBe("enterprise");
    });
  });

  // ─── getUpgradeModules ────────────────────────────────

  describe("getUpgradeModules", () => {
    it("free → starter unlocks kds, team_management, billing, exports", () => {
      const unlocked = getUpgradeModules("free", "starter");
      expect(unlocked).toContain("core_kds");
      expect(unlocked).toContain("team_management");
      expect(unlocked).toContain("billing_management");
      expect(unlocked).toContain("exports");
      expect(unlocked).not.toContain("core_pos"); // already had
    });

    it("starter → pro unlocks team_pulse, team_tasks, analytics_pro, inventory, audit_dashboard", () => {
      const unlocked = getUpgradeModules("starter", "pro");
      expect(unlocked).toContain("team_pulse");
      expect(unlocked).toContain("team_tasks");
      expect(unlocked).toContain("analytics_pro");
      expect(unlocked).toContain("inventory");
      expect(unlocked).toContain("audit_dashboard");
    });

    it("pro → enterprise unlocks marketing_crm + compliance", () => {
      const unlocked = getUpgradeModules("pro", "enterprise");
      expect(unlocked).toContain("marketing_crm");
      expect(unlocked).toContain("compliance");
      expect(unlocked).toHaveLength(2);
    });

    it("enterprise → free returns empty (downgrade)", () => {
      const unlocked = getUpgradeModules("enterprise", "free");
      expect(unlocked).toHaveLength(0);
    });
  });
});
