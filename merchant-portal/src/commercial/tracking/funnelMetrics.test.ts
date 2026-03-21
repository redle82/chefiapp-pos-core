import { describe, expect, it } from "vitest";
import {
  buildCommercialFunnelSnapshotCsv,
  computeActivationIntelligenceInsights,
  computeActivationRecommendedActions,
  computeCommercialFunnelMetrics,
  computeCommercialFunnelSegmentation,
  type CommercialEvent,
} from "./funnelMetrics";

const baseEvent = {
  timestamp: "2026-02-26T10:00:00.000Z",
  segment: "small",
  landing_version: "country-v1",
  path: "/gb",
} as const;

describe("funnelMetrics segmentation", () => {
  it("computes global and segmented funnel breakdowns", () => {
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        event: "page_view",
        country: "gb",
        device: "desktop",
        utm_source: "google",
        utm_campaign: "spring_launch",
      },
      {
        ...baseEvent,
        event: "pricing_view",
        country: "gb",
        device: "desktop",
        plan: "starter",
        utm_source: "google",
        utm_campaign: "spring_launch",
      },
      {
        ...baseEvent,
        event: "cta_demo_click",
        country: "gb",
        device: "desktop",
        utm_source: "google",
        utm_campaign: "spring_launch",
      },
      {
        ...baseEvent,
        event: "lead_email_submit",
        country: "gb",
        device: "desktop",
        email: "owner@gb.test",
        utm_source: "google",
        utm_campaign: "spring_launch",
      },
      {
        ...baseEvent,
        event: "page_view",
        country: "es",
        device: "mobile",
        utm_source: "instagram",
        utm_campaign: "iberia_q1",
      },
      {
        ...baseEvent,
        event: "pricing_view",
        country: "es",
        device: "mobile",
        plan: "pro",
        utm_source: "instagram",
        utm_campaign: "iberia_q1",
      },
    ];

    const segmentation = computeCommercialFunnelSegmentation(events);

    expect(segmentation.global.totalEvents).toBe(6);
    expect(segmentation.global.pageViews).toBe(2);
    expect(segmentation.global.pricingViews).toBe(2);
    expect(segmentation.global.ctaClicks).toBe(1);
    expect(segmentation.global.leadSubmits).toBe(1);

    expect(segmentation.byCountry.gb.leadSubmits).toBe(1);
    expect(segmentation.byCountry.es.leadSubmits).toBe(0);
    expect(segmentation.byCountry.gb.rates.leadFromPage).toBe(1);
    expect(segmentation.byCountry.es.rates.leadFromPage).toBe(0);

    expect(segmentation.byDevice.desktop.leadSubmits).toBe(1);
    expect(segmentation.byDevice.mobile.leadSubmits).toBe(0);
    expect(segmentation.bySource.google.pageViews).toBe(1);
    expect(segmentation.bySource.instagram.pageViews).toBe(1);
    expect(segmentation.byCampaign.spring_launch.leadSubmits).toBe(1);
    expect(segmentation.byCampaign.iberia_q1.leadSubmits).toBe(0);
  });

  it("computes activation metrics: trialStarts, firstOrders, activationRate", () => {
    const r1 = "r1-111";
    const r2 = "r2-222";
    const ev = {
      ...baseEvent,
      country: "gb" as const,
      device: "desktop" as const,
    };
    const events: CommercialEvent[] = [
      { ...ev, event: "trial_started", restaurant_id: r1 },
      { ...ev, event: "trial_started", restaurant_id: r2 },
      { ...ev, event: "onboarding_completed", restaurant_id: r1 },
      { ...ev, event: "onboarding_completed", restaurant_id: r2 },
      {
        ...ev,
        event: "first_order_created",
        restaurant_id: r1,
        order_id: "ord-1",
      },
      {
        ...ev,
        timestamp: "2026-02-26T11:00:00.000Z",
        event: "first_payment_received",
        restaurant_id: r1,
        amount_cents: 2999,
        plan: "pro",
      },
    ];

    const metrics = computeCommercialFunnelMetrics(events);

    expect(metrics.trialStarts).toBe(2);
    expect(metrics.firstOrders).toBe(1);
    expect(metrics.firstPayments).toBe(1);
    expect(metrics.rates.activationRate).toBe(0.5); // 1/2
    expect(metrics.activation.trialConversionRate).toBe(0.5); // 1/2
    expect(metrics.activation.revenuePerActivatedTrialCents).toBe(2999);
    expect(metrics.activation.dropoffStep.onboarding).toBe(0);
    expect(metrics.activation.dropoffStep.firstOrder).toBe(1);
    expect(metrics.activation.dropoffStep.paidConversion).toBe(0);
    expect(metrics.activation.dropoffStep.activated).toBe(1);
  });

  it("computes time-to-first-order average and median in hours", () => {
    const r1 = "r1-111";
    const r2 = "r2-222";
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        timestamp: "2026-02-26T08:00:00.000Z",
        event: "trial_started",
        restaurant_id: r1,
      },
      {
        ...baseEvent,
        timestamp: "2026-02-26T10:00:00.000Z",
        event: "first_order_created",
        restaurant_id: r1,
        order_id: "ord-1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-26T09:00:00.000Z",
        event: "trial_started",
        restaurant_id: r2,
      },
      {
        ...baseEvent,
        timestamp: "2026-02-26T15:00:00.000Z",
        event: "first_order_created",
        restaurant_id: r2,
        order_id: "ord-2",
      },
    ];

    const metrics = computeCommercialFunnelMetrics(events);

    expect(metrics.activation.timeToFirstOrderHoursAvg).toBe(4);
    expect(metrics.activation.timeToFirstOrderHoursMedian).toBe(4);
  });

  it("groups missing UTM values under unknown bucket", () => {
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        event: "page_view",
        country: "gb",
        device: "desktop",
      },
    ];

    const segmentation = computeCommercialFunnelSegmentation(events);

    expect(segmentation.bySource.unknown.pageViews).toBe(1);
    expect(segmentation.byCampaign.unknown.pageViews).toBe(1);
  });

  it("builds CSV snapshot for segmented output", () => {
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        event: "page_view",
        country: "gb",
        device: "desktop",
        utm_source: "google",
        utm_campaign: "spring_launch",
      },
      {
        ...baseEvent,
        event: "lead_email_submit",
        country: "gb",
        device: "desktop",
        email: "owner@gb.test",
        utm_source: "google",
        utm_campaign: "spring_launch",
      },
    ];

    const segmentation = computeCommercialFunnelSegmentation(events);
    const csv = buildCommercialFunnelSnapshotCsv(segmentation);

    expect(csv).toContain(
      "dimension,key,pageViews,pricingViews,ctaClicks,leadSubmits,trialStarts,firstOrders,firstPayments,activationRatePct,trialConversionRatePct,timeToFirstOrderHoursMedian,revenuePerActivatedTrialCents,dropoffOnboarding,dropoffFirstOrder,dropoffPaidConversion",
    );
    expect(csv).toContain("global,all,1,0,0,1,0,0,0,");
    expect(csv).toContain("country,gb,");
    expect(csv).toContain("source,google,");
  });

  it("computes activation intelligence v2 insights", () => {
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        timestamp: "2026-02-01T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-01T08:30:00.000Z",
        event: "onboarding_completed",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-01T10:00:00.000Z",
        event: "first_order_created",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
        order_id: "ord-1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-01T10:30:00.000Z",
        event: "first_shift_opened",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-01T11:00:00.000Z",
        event: "first_payment_received",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
        amount_cents: 1999,
        plan: "starter",
      },
    ];

    const insights = computeActivationIntelligenceInsights(events);

    expect(insights.worstDropoffStep).toBe("onboarding");
    expect(insights.activationVelocityScore).toBeGreaterThan(70);
    expect(insights.orgClassification).toBe("Fast activators");
    expect(insights.alerts).toHaveLength(0);
  });

  it("flags MoM slowdown and shift-open dropoff increase", () => {
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        timestamp: "2026-01-10T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "jan-r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-01-10T09:00:00.000Z",
        event: "first_order_created",
        country: "gb",
        device: "desktop",
        restaurant_id: "jan-r1",
        order_id: "jan-ord-1",
      },
      {
        ...baseEvent,
        timestamp: "2026-01-10T09:20:00.000Z",
        event: "first_shift_opened",
        country: "gb",
        device: "desktop",
        restaurant_id: "jan-r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-01-12T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "jan-r2",
      },
      {
        ...baseEvent,
        timestamp: "2026-01-12T09:00:00.000Z",
        event: "first_order_created",
        country: "gb",
        device: "desktop",
        restaurant_id: "jan-r2",
        order_id: "jan-ord-2",
      },
      {
        ...baseEvent,
        timestamp: "2026-01-12T09:20:00.000Z",
        event: "first_shift_opened",
        country: "gb",
        device: "desktop",
        restaurant_id: "jan-r2",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "feb-r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T09:00:00.000Z",
        event: "first_order_created",
        country: "gb",
        device: "desktop",
        restaurant_id: "feb-r1",
        order_id: "feb-ord-1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T09:20:00.000Z",
        event: "first_shift_opened",
        country: "gb",
        device: "desktop",
        restaurant_id: "feb-r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-12T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "feb-r2",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-12T09:00:00.000Z",
        event: "first_order_created",
        country: "gb",
        device: "desktop",
        restaurant_id: "feb-r2",
        order_id: "feb-ord-2",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-14T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "feb-r3",
      },
    ];

    const insights = computeActivationIntelligenceInsights(events);

    expect(insights.alerts.join(" ")).toContain("Activation slowing");
    expect(insights.alerts.join(" ")).toContain(
      "Dropoff increased at shift_opened step",
    );
    expect(insights.orgClassification).toBe("Slow activators");
  });

  it("builds top 3 prescriptive actions for first-order dropoff", () => {
    const events: CommercialEvent[] = [
      {
        ...baseEvent,
        timestamp: "2026-02-10T08:00:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T09:00:00.000Z",
        event: "onboarding_completed",
        country: "gb",
        device: "desktop",
        restaurant_id: "r1",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T08:10:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "r2",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T09:10:00.000Z",
        event: "onboarding_completed",
        country: "gb",
        device: "desktop",
        restaurant_id: "r2",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T08:20:00.000Z",
        event: "trial_started",
        country: "gb",
        device: "desktop",
        restaurant_id: "r3",
      },
      {
        ...baseEvent,
        timestamp: "2026-02-10T09:20:00.000Z",
        event: "onboarding_completed",
        country: "gb",
        device: "desktop",
        restaurant_id: "r3",
      },
    ];

    const insights = computeActivationIntelligenceInsights(events);
    const metrics = computeCommercialFunnelMetrics(events);
    const actions = computeActivationRecommendedActions({ insights, metrics });

    expect(actions).toHaveLength(3);
    expect(actions.map((a) => a.title).join(" ")).toContain(
      "Pre-load demo menu",
    );
    expect(actions.map((a) => a.title).join(" ")).toContain(
      "Trigger contextual tooltip for menu setup",
    );
    expect(actions.every((a) => a.automation.length > 0)).toBe(true);
  });
});
