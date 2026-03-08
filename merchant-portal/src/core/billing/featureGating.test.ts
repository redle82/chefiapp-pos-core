/**
 * featureGating unit tests
 *
 * Covers:
 *   - hasFeature: plan-tier gating, fail-closed, nil safety
 *   - hasFeatureGated: PAST_DUE soft-block of advanced_reports / api_webhooks
 *   - PAST_DUE_BLOCKED_FEATURES constant
 *   - getPlanFeatures, getMaxDevices, getPlanLimits, isDeviceLimitReached
 *   - getPlanDisplayName
 */
import { describe, expect, it } from "vitest";
import {
  PAST_DUE_BLOCKED_FEATURES,
  getMaxDevices,
  getPlanDisplayName,
  getPlanFeatures,
  getPlanLimits,
  hasFeature,
  hasFeatureGated,
  isDeviceLimitReached,
  type PlanFeature,
} from "./featureGating";

// ─── hasFeature ───────────────────────────────────────────────────────────────

describe("hasFeature", () => {
  it("free plan has tpv", () => {
    expect(hasFeature("free", "tpv")).toBe(true);
  });

  it("free plan does NOT have advanced_reports", () => {
    expect(hasFeature("free", "advanced_reports")).toBe(false);
  });

  it("pro plan has advanced_reports", () => {
    expect(hasFeature("pro", "advanced_reports")).toBe(true);
  });

  it("enterprise plan has api_webhooks", () => {
    expect(hasFeature("enterprise", "api_webhooks")).toBe(true);
  });

  it("starter plan does NOT have api_webhooks", () => {
    expect(hasFeature("starter", "api_webhooks")).toBe(false);
  });

  it("returns false for null tier", () => {
    expect(hasFeature(null, "tpv")).toBe(false);
  });

  it("returns false for undefined tier", () => {
    expect(hasFeature(undefined, "tpv")).toBe(false);
  });

  it("trial has kds", () => {
    expect(hasFeature("trial", "kds")).toBe(true);
  });
});

// ─── PAST_DUE_BLOCKED_FEATURES constant ─────────────────────────────────────

describe("PAST_DUE_BLOCKED_FEATURES", () => {
  it("blocks advanced_reports", () => {
    expect(PAST_DUE_BLOCKED_FEATURES).toContain(
      "advanced_reports" as PlanFeature,
    );
  });

  it("blocks api_webhooks", () => {
    expect(PAST_DUE_BLOCKED_FEATURES).toContain("api_webhooks" as PlanFeature);
  });

  it("does NOT block tpv (core POS must remain available)", () => {
    expect(PAST_DUE_BLOCKED_FEATURES).not.toContain("tpv" as PlanFeature);
  });

  it("does NOT block kds", () => {
    expect(PAST_DUE_BLOCKED_FEATURES).not.toContain("kds" as PlanFeature);
  });
});

// ─── hasFeatureGated ──────────────────────────────────────────────────────────

describe("hasFeatureGated — active billing", () => {
  it("pro plan + active → advanced_reports allowed", () => {
    expect(hasFeatureGated("pro", "advanced_reports", "active")).toBe(true);
  });

  it("enterprise plan + active → api_webhooks allowed", () => {
    expect(hasFeatureGated("enterprise", "api_webhooks", "active")).toBe(true);
  });

  it("starter plan + active → advanced_reports denied (plan limit)", () => {
    expect(hasFeatureGated("starter", "advanced_reports", "active")).toBe(
      false,
    );
  });

  it("nil billing status behaves as active", () => {
    expect(hasFeatureGated("pro", "advanced_reports", null)).toBe(true);
    expect(hasFeatureGated("pro", "advanced_reports", undefined)).toBe(true);
  });
});

describe("hasFeatureGated — past_due billing", () => {
  it("pro plan + past_due → advanced_reports BLOCKED", () => {
    expect(hasFeatureGated("pro", "advanced_reports", "past_due")).toBe(false);
  });

  it("enterprise plan + past_due → advanced_reports BLOCKED", () => {
    expect(hasFeatureGated("enterprise", "advanced_reports", "past_due")).toBe(
      false,
    );
  });

  it("pro plan + past_due → api_webhooks BLOCKED", () => {
    expect(hasFeatureGated("pro", "api_webhooks", "past_due")).toBe(false);
  });

  it("enterprise plan + past_due → api_webhooks BLOCKED", () => {
    expect(hasFeatureGated("enterprise", "api_webhooks", "past_due")).toBe(
      false,
    );
  });

  it("pro plan + past_due → tpv still ALLOWED (POS must not be disrupted)", () => {
    expect(hasFeatureGated("pro", "tpv", "past_due")).toBe(true);
  });

  it("enterprise plan + past_due → kds still ALLOWED", () => {
    expect(hasFeatureGated("enterprise", "kds", "past_due")).toBe(true);
  });

  it("enterprise plan + past_due → appstaff still ALLOWED", () => {
    expect(hasFeatureGated("enterprise", "appstaff", "past_due")).toBe(true);
  });

  it("free plan + past_due → advanced_reports still denied (no plan access)", () => {
    // free never had it, so past_due makes no difference
    expect(hasFeatureGated("free", "advanced_reports", "past_due")).toBe(false);
  });

  it("nil tier + past_due → false (fail-closed)", () => {
    expect(hasFeatureGated(null, "tpv", "past_due")).toBe(false);
  });
});

describe("hasFeatureGated — trial billing", () => {
  it("trial plan + trial status → kds allowed", () => {
    expect(hasFeatureGated("trial", "kds", "trial")).toBe(true);
  });

  it("trial plan + trial status → advanced_reports denied (not in trial tier)", () => {
    expect(hasFeatureGated("trial", "advanced_reports", "trial")).toBe(false);
  });
});

// ─── Support functions ───────────────────────────────────────────────────────

describe("getPlanFeatures", () => {
  it("returns empty array for nil tier", () => {
    expect(getPlanFeatures(null)).toEqual([]);
    expect(getPlanFeatures(undefined)).toEqual([]);
  });

  it("pro has more features than starter", () => {
    expect(getPlanFeatures("pro").length).toBeGreaterThan(
      getPlanFeatures("starter").length,
    );
  });
});

describe("getMaxDevices", () => {
  it("free → 1 device", () => expect(getMaxDevices("free")).toBe(1));
  it("pro → 2 devices", () => expect(getMaxDevices("pro")).toBe(2));
  it("enterprise → 4 devices", () =>
    expect(getMaxDevices("enterprise")).toBe(4));
  it("nil tier → 0", () => expect(getMaxDevices(null)).toBe(0));
});

describe("isDeviceLimitReached", () => {
  it("returns true when at limit", () => {
    expect(isDeviceLimitReached("pro", 2)).toBe(true);
  });

  it("returns true when over limit", () => {
    expect(isDeviceLimitReached("pro", 5)).toBe(true);
  });

  it("returns false when under limit", () => {
    expect(isDeviceLimitReached("pro", 1)).toBe(false);
  });
});

describe("getPlanLimits", () => {
  it("nil tier falls back to free limits", () => {
    expect(getPlanLimits(null)).toEqual(getPlanLimits("free"));
  });
});

describe("getPlanDisplayName", () => {
  it("known tiers return correct names", () => {
    expect(getPlanDisplayName("free")).toBe("Free");
    expect(getPlanDisplayName("pro")).toBe("Pro");
    expect(getPlanDisplayName("enterprise")).toBe("Enterprise");
  });

  it("nil tier returns 'Sem plano'", () => {
    expect(getPlanDisplayName(null)).toBe("Sem plano");
  });
});
