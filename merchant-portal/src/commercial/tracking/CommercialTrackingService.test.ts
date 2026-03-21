import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  commercialTracking,
  resetAutomationEngine,
} from "./CommercialTrackingService";
import { computeCommercialFunnelMetrics } from "./funnelMetrics";
import { getLeadScore, isLeadHot, resetLeadScore } from "./leadScoring";

const {
  mockIsActivationAutomationEnabled,
  mockIsActivationAutomationDispatchEnabled,
  mockIsChurnRiskAutomationEnabled,
} = vi.hoisted(() => ({
  mockIsActivationAutomationEnabled: vi.fn(),
  mockIsActivationAutomationDispatchEnabled: vi.fn(),
  mockIsChurnRiskAutomationEnabled: vi.fn(() => false),
}));

vi.mock("./flag", () => ({
  isCommercialTrackingEnabled: () => true,
  isActivationAutomationEnabled: () => mockIsActivationAutomationEnabled(),
  isActivationAutomationDispatchEnabled: () =>
    mockIsActivationAutomationDispatchEnabled(),
  isChurnRiskAutomationEnabled: () => mockIsChurnRiskAutomationEnabled(),
}));

const baseEvent = {
  timestamp: new Date().toISOString(),
  country: "gb" as const,
  segment: "small" as const,
  landing_version: "country-v1",
  device: "desktop" as const,
  path: "/gb",
};

describe("CommercialTrackingService + Lead Scoring", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    commercialTracking.clearBuffer();
    resetLeadScore();
    resetAutomationEngine();
    mockIsActivationAutomationEnabled.mockReturnValue(true);
    mockIsActivationAutomationDispatchEnabled.mockReturnValue(false);
    mockIsChurnRiskAutomationEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("score increments on pricing_view", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_view",
      plan: "all",
    });
    expect(getLeadScore()).toBe(10);
  });

  it("score increments on cta_demo_click", () => {
    commercialTracking.track({ ...baseEvent, event: "cta_demo_click" });
    expect(getLeadScore()).toBe(20);
  });

  it("score increments on upgrade_click", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "upgrade_click",
      module: "analytics_pro",
    });
    expect(getLeadScore()).toBe(15);
  });

  it("score increments on cta_whatsapp_click", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "cta_whatsapp_click",
      placement: "hero",
    });
    expect(getLeadScore()).toBe(5);
  });

  it("score accumulates across events", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_view",
      plan: "pro",
    });
    commercialTracking.track({ ...baseEvent, event: "cta_demo_click" });
    commercialTracking.track({
      ...baseEvent,
      event: "upgrade_click",
      placement: "panel",
    });
    expect(getLeadScore()).toBe(10 + 20 + 15);
  });

  it("flags lead as hot when score > 40", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_view",
      plan: "all",
    });
    commercialTracking.track({ ...baseEvent, event: "cta_demo_click" });
    commercialTracking.track({
      ...baseEvent,
      event: "upgrade_click",
      module: "analytics_pro",
    });
    expect(getLeadScore()).toBe(45);
    expect(isLeadHot()).toBe(true);
  });

  it("does not flag as hot when score <= 40", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_view",
      plan: "all",
    });
    commercialTracking.track({ ...baseEvent, event: "cta_demo_click" });
    expect(getLeadScore()).toBe(30);
    expect(isLeadHot()).toBe(false);
  });

  it("toggle events do not affect score (no points)", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_toggle",
      value: "annual",
    });
    expect(getLeadScore()).toBe(0);
  });

  it("computes baseline funnel metrics from tracked events", () => {
    commercialTracking.track({ ...baseEvent, event: "page_view" });
    commercialTracking.track({ ...baseEvent, event: "page_view" });
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_view",
      plan: "all",
    });
    commercialTracking.track({ ...baseEvent, event: "cta_demo_click" });
    commercialTracking.track({
      ...baseEvent,
      event: "pricing_conversion_click",
      plan: "pro",
      billing: "monthly",
    });
    commercialTracking.track({
      ...baseEvent,
      event: "lead_email_submit",
      email: "owner@restaurant.test",
      placement: "lead-modal",
    });

    const funnel = commercialTracking.getFunnelMetrics();

    expect(funnel.totalEvents).toBe(6);
    expect(funnel.pageViews).toBe(2);
    expect(funnel.pricingViews).toBe(1);
    expect(funnel.ctaClicks).toBe(2);
    expect(funnel.leadSubmits).toBe(1);
    expect(funnel.rates.pricingFromPage).toBe(0.5);
    expect(funnel.rates.ctaFromPricing).toBe(2);
    expect(funnel.rates.leadFromCta).toBe(0.5);
    expect(funnel.rates.leadFromPage).toBe(0.5);
  });

  it("returns zero ratios when there is no denominator", () => {
    const funnel = computeCommercialFunnelMetrics([]);
    expect(funnel.totalEvents).toBe(0);
    expect(funnel.pageViews).toBe(0);
    expect(funnel.pricingViews).toBe(0);
    expect(funnel.ctaClicks).toBe(0);
    expect(funnel.leadSubmits).toBe(0);
    expect(funnel.rates.pricingFromPage).toBe(0);
    expect(funnel.rates.ctaFromPricing).toBe(0);
    expect(funnel.rates.leadFromCta).toBe(0);
    expect(funnel.rates.leadFromPage).toBe(0);
  });

  it("computes segmented funnel by country and source", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "page_view",
      country: "gb",
      utm_source: "google",
      utm_campaign: "spring",
    });
    commercialTracking.track({
      ...baseEvent,
      event: "lead_email_submit",
      country: "gb",
      email: "owner@gb.test",
      utm_source: "google",
      utm_campaign: "spring",
    });
    commercialTracking.track({
      ...baseEvent,
      event: "page_view",
      country: "es",
      device: "mobile",
      utm_source: "meta",
      utm_campaign: "iberia",
    });

    const segmented = commercialTracking.getFunnelSegmentation();

    expect(segmented.global.totalEvents).toBe(3);
    expect(segmented.byCountry.gb.leadSubmits).toBe(1);
    expect(segmented.byCountry.es.leadSubmits).toBe(0);
    expect(segmented.bySource.google.pageViews).toBe(1);
    expect(segmented.bySource.meta.pageViews).toBe(1);
  });

  it("builds funnel CSV snapshot", () => {
    commercialTracking.track({
      ...baseEvent,
      event: "page_view",
      country: "gb",
      utm_source: "google",
      utm_campaign: "spring",
    });
    commercialTracking.track({
      ...baseEvent,
      event: "lead_email_submit",
      country: "gb",
      email: "owner@gb.test",
      utm_source: "google",
      utm_campaign: "spring",
    });

    const csv = commercialTracking.getFunnelSnapshotCsv();
    expect(csv).toContain(
      "dimension,key,pageViews,pricingViews,ctaClicks,leadSubmits,trialStarts,firstOrders,firstPayments,activationRatePct,trialConversionRatePct,timeToFirstOrderHoursMedian,revenuePerActivatedTrialCents,dropoffOnboarding,dropoffFirstOrder,dropoffPaidConversion",
    );
    expect(csv).toContain("global,all,1,0,0,1,0,0,0,0.00,0.00,0,0,0,0,0");
    expect(csv).toContain("country,gb,");
    expect(csv).toContain("source,google,");
  });

  it("triggers activation automation dispatch when velocity is low", async () => {
    mockIsActivationAutomationEnabled.mockReturnValue(true);
    mockIsActivationAutomationDispatchEnabled.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    commercialTracking.track({
      ...baseEvent,
      timestamp: "2026-02-20T10:00:00.000Z",
      event: "trial_started",
      restaurant_id: "r-automation-1",
    });

    // Engine dispatch is async — flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Find the automation dispatch call (URL contains "automation/dispatch")
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    };
    const automationCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("automation"),
    );
    expect(automationCall).toBeDefined();
    const body = JSON.parse(String(automationCall![1]?.body));
    expect(body).toMatchObject({
      trigger: "activation_velocity_low",
    });
  });

  it("does not trigger activation automation more than once per month (dedupe via engine)", async () => {
    mockIsActivationAutomationEnabled.mockReturnValue(true);
    mockIsActivationAutomationDispatchEnabled.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    commercialTracking.track({
      ...baseEvent,
      timestamp: "2026-02-20T10:00:00.000Z",
      event: "trial_started",
      restaurant_id: "r-automation-1",
    });
    commercialTracking.track({
      ...baseEvent,
      timestamp: "2026-02-21T10:00:00.000Z",
      event: "trial_started",
      restaurant_id: "r-automation-1",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Dedupe: at most 1 automation dispatch call (same dedupeKey)
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    };
    const automationCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("automation"),
    );
    expect(automationCalls.length).toBeLessThanOrEqual(1);
  });

  it("respects activation automation feature flag", async () => {
    mockIsActivationAutomationEnabled.mockReturnValue(false);
    mockIsChurnRiskAutomationEnabled.mockReturnValue(false);
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    commercialTracking.track({
      ...baseEvent,
      timestamp: "2026-02-20T10:00:00.000Z",
      event: "trial_started",
      restaurant_id: "r-automation-1",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // No automation dispatch should have been made
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    };
    const automationCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("automation"),
    );
    expect(automationCalls.length).toBe(0);
  });

  it("dispatches automation event to gateway when dispatch flag is enabled", async () => {
    mockIsActivationAutomationEnabled.mockReturnValue(true);
    mockIsActivationAutomationDispatchEnabled.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as typeof fetch;

    commercialTracking.track({
      ...baseEvent,
      timestamp: "2026-02-20T10:00:00.000Z",
      event: "trial_started",
      restaurant_id: "r-automation-1",
    });

    // Engine dispatch is async — flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Find the automation dispatch call (URL contains "automation/dispatch")
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    };
    const automationCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("automation"),
    );
    expect(automationCall).toBeDefined();
    const body = JSON.parse(String(automationCall![1]?.body));
    expect(body).toMatchObject({
      restaurant_id: "r-automation-1",
      trigger: "activation_velocity_low",
      recommended_action: {
        title: expect.any(String),
      },
    });
    expect(String(body.idempotency_key)).toContain("activation");
    expect(String(body.idempotency_key)).toContain("r-automation-1");
    expect(String(body.idempotency_key)).toContain("activation_velocity_low");
  });
});
