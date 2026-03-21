import type { CommercialEvent } from "./types";

export type { CommercialEvent } from "./types";

export interface CommercialFunnelMetrics {
  totalEvents: number;
  pageViews: number;
  pricingViews: number;
  ctaClicks: number;
  leadSubmits: number;
  trialStarts: number;
  firstLogins: number;
  firstMenus: number;
  firstOrders: number;
  firstShifts: number;
  firstPayments: number;
  rates: {
    pricingFromPage: number;
    ctaFromPricing: number;
    leadFromCta: number;
    leadFromPage: number;
    activationRate: number;
  };
  activation: {
    activationRate: number;
    trialConversionRate: number;
    timeToFirstOrderHoursAvg: number;
    timeToFirstOrderHoursMedian: number;
    revenuePerActivatedTrialCents: number;
    dropoffStep: {
      onboarding: number;
      firstOrder: number;
      paidConversion: number;
      activated: number;
    };
  };
}

export interface CommercialFunnelSegmentation {
  global: CommercialFunnelMetrics;
  byCountry: Record<string, CommercialFunnelMetrics>;
  bySegment: Record<string, CommercialFunnelMetrics>;
  byDevice: Record<string, CommercialFunnelMetrics>;
  bySource: Record<string, CommercialFunnelMetrics>;
  byCampaign: Record<string, CommercialFunnelMetrics>;
}

export type ActivationClassification =
  | "Fast activators"
  | "Slow activators"
  | "Stalled";

export type ActivationDropoffStep =
  | "onboarding"
  | "first_order"
  | "shift_opened"
  | "paid_conversion";

export interface ActivationIntelligenceInsights {
  worstDropoffStep: ActivationDropoffStep;
  activationVelocityScore: number;
  orgClassification: ActivationClassification;
  alerts: string[];
}

export interface ActivationRecommendedAction {
  title: string;
  reason: string;
  automation: string;
}

const CTA_EVENTS = new Set([
  "cta_demo_click",
  "cta_whatsapp_click",
  "pricing_conversion_click",
]);

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function groupByKey(
  events: CommercialEvent[],
  keySelector: (event: CommercialEvent) => string,
): Record<string, CommercialFunnelMetrics> {
  const groups = new Map<string, CommercialEvent[]>();

  events.forEach((event) => {
    const key = keySelector(event);
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  });

  const result: Record<string, CommercialFunnelMetrics> = {};
  groups.forEach((groupEvents, key) => {
    result[key] = computeCommercialFunnelMetrics(groupEvents);
  });

  return result;
}

function normalizeBucket(value?: string): string {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : "unknown";
}

function toPct(value: number): string {
  return (value * 100).toFixed(2);
}

function uniqueRestaurants(
  events: CommercialEvent[],
  eventNames: string | string[],
): Set<string> {
  const names = Array.isArray(eventNames)
    ? new Set(eventNames)
    : new Set([eventNames]);
  const ids = new Set<string>();
  events.forEach((e) => {
    if (names.has(e.event) && "restaurant_id" in e && e.restaurant_id) {
      ids.add(e.restaurant_id);
    }
  });
  return ids;
}

function earliestTimestampByRestaurant(
  events: CommercialEvent[],
  eventNames: string | string[],
): Map<string, number> {
  const names = Array.isArray(eventNames)
    ? new Set(eventNames)
    : new Set([eventNames]);
  const out = new Map<string, number>();

  events.forEach((event) => {
    if (!names.has(event.event)) return;
    if (!("restaurant_id" in event) || !event.restaurant_id) return;

    const ts = Date.parse(event.timestamp);
    if (Number.isNaN(ts)) return;

    const current = out.get(event.restaurant_id);
    if (current === undefined || ts < current) {
      out.set(event.restaurant_id, ts);
    }
  });

  return out;
}

function firstPaymentAmountByRestaurant(
  events: CommercialEvent[],
): Map<string, number> {
  const out = new Map<string, { ts: number; amount: number }>();

  events.forEach((event) => {
    if (event.event !== "first_payment_received") return;
    if (!("restaurant_id" in event) || !event.restaurant_id) return;
    const ts = Date.parse(event.timestamp);
    if (Number.isNaN(ts)) return;
    const amount =
      "amount_cents" in event && typeof event.amount_cents === "number"
        ? event.amount_cents
        : 0;

    const current = out.get(event.restaurant_id);
    if (!current || ts < current.ts) {
      out.set(event.restaurant_id, { ts, amount });
    }
  });

  const flat = new Map<string, number>();
  out.forEach((value, key) => flat.set(key, value.amount));
  return flat;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return round2((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return round2(sorted[mid]);
}

function monthKey(isoTimestamp: string): string | null {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 7);
}

function classifyActivationScore(score: number): ActivationClassification {
  if (score >= 75) return "Fast activators";
  if (score >= 40) return "Slow activators";
  return "Stalled";
}

function computeVelocityScore(metrics: CommercialFunnelMetrics): number {
  const speedComponent = (() => {
    const medianHours = metrics.activation.timeToFirstOrderHoursMedian;
    if (medianHours <= 1) return 20;
    if (medianHours <= 4) return 15;
    if (medianHours <= 12) return 10;
    if (medianHours <= 24) return 5;
    return 0;
  })();

  const shiftCompletionRate = ratio(metrics.firstShifts, metrics.firstOrders);
  const rawScore =
    metrics.activation.activationRate * 50 +
    metrics.activation.trialConversionRate * 20 +
    shiftCompletionRate * 10 +
    speedComponent;

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

function toDropoffRates(metrics: CommercialFunnelMetrics): {
  onboardingRate: number;
  firstOrderRate: number;
  shiftOpenedRate: number;
  paidConversionRate: number;
} {
  const onboardingCompleted =
    metrics.trialStarts - metrics.activation.dropoffStep.onboarding;
  const shiftOpenedDropoff = Math.max(
    metrics.firstOrders - metrics.firstShifts,
    0,
  );
  const paidConversionDropoff = Math.max(
    metrics.firstShifts - metrics.firstPayments,
    0,
  );

  return {
    onboardingRate: ratio(
      metrics.activation.dropoffStep.onboarding,
      metrics.trialStarts,
    ),
    firstOrderRate: ratio(
      metrics.activation.dropoffStep.firstOrder,
      onboardingCompleted,
    ),
    shiftOpenedRate: ratio(shiftOpenedDropoff, metrics.firstOrders),
    paidConversionRate: ratio(paidConversionDropoff, metrics.firstShifts),
  };
}

export function computeCommercialFunnelMetrics(
  events: CommercialEvent[],
): CommercialFunnelMetrics {
  const pageViews = events.filter((e) => e.event === "page_view").length;
  const pricingViews = events.filter((e) => e.event === "pricing_view").length;
  const ctaClicks = events.filter((e) => CTA_EVENTS.has(e.event)).length;
  const leadSubmits = events.filter(
    (e) => e.event === "lead_email_submit",
  ).length;

  const trialStartIds = uniqueRestaurants(events, [
    "trial_started",
    "trial_start",
  ]);
  const onboardingCompletedIds = uniqueRestaurants(
    events,
    "onboarding_completed",
  );
  const firstOrderIds = uniqueRestaurants(events, "first_order_created");
  const firstPaymentIds = uniqueRestaurants(events, "first_payment_received");

  const trialStarts = trialStartIds.size;
  const firstLogins = uniqueRestaurants(events, "first_login").size;
  const firstMenus = uniqueRestaurants(events, "first_menu_created").size;
  const firstOrders = firstOrderIds.size;
  const firstShifts = uniqueRestaurants(events, "first_shift_opened").size;
  const firstPayments = firstPaymentIds.size;

  const trialTimes = earliestTimestampByRestaurant(events, [
    "trial_started",
    "trial_start",
  ]);
  const firstOrderTimes = earliestTimestampByRestaurant(
    events,
    "first_order_created",
  );
  const timeToFirstOrderHours = Array.from(firstOrderTimes.entries())
    .map(([restaurantId, firstOrderTs]) => {
      const trialTs = trialTimes.get(restaurantId);
      if (trialTs === undefined) return null;
      const deltaMs = firstOrderTs - trialTs;
      if (deltaMs < 0) return null;
      return deltaMs / (1000 * 60 * 60);
    })
    .filter((value): value is number => value !== null);

  const avgTimeToFirstOrderHours =
    timeToFirstOrderHours.length > 0
      ? round2(
          timeToFirstOrderHours.reduce((sum, value) => sum + value, 0) /
            timeToFirstOrderHours.length,
        )
      : 0;
  const medianTimeToFirstOrderHours = median(timeToFirstOrderHours);

  const firstPaymentAmounts = firstPaymentAmountByRestaurant(events);
  const totalFirstPaymentCents = Array.from(
    firstPaymentAmounts.values(),
  ).reduce((sum, amount) => sum + amount, 0);

  const trialStartedAndNoOnboarding = Array.from(trialStartIds).filter(
    (restaurantId) => !onboardingCompletedIds.has(restaurantId),
  ).length;
  const onboardingAndNoFirstOrder = Array.from(onboardingCompletedIds).filter(
    (restaurantId) => !firstOrderIds.has(restaurantId),
  ).length;
  const firstOrderAndNoPayment = Array.from(firstOrderIds).filter(
    (restaurantId) => !firstPaymentIds.has(restaurantId),
  ).length;

  const activationRate = ratio(firstOrders, trialStarts);
  const trialConversionRate = ratio(firstPayments, trialStarts);
  const revenuePerActivatedTrialCents =
    firstOrders > 0 ? Math.round(totalFirstPaymentCents / firstOrders) : 0;

  return {
    totalEvents: events.length,
    pageViews,
    pricingViews,
    ctaClicks,
    leadSubmits,
    trialStarts,
    firstLogins,
    firstMenus,
    firstOrders,
    firstShifts,
    firstPayments,
    rates: {
      pricingFromPage: ratio(pricingViews, pageViews),
      ctaFromPricing: ratio(ctaClicks, pricingViews),
      leadFromCta: ratio(leadSubmits, ctaClicks),
      leadFromPage: ratio(leadSubmits, pageViews),
      activationRate,
    },
    activation: {
      activationRate,
      trialConversionRate,
      timeToFirstOrderHoursAvg: avgTimeToFirstOrderHours,
      timeToFirstOrderHoursMedian: medianTimeToFirstOrderHours,
      revenuePerActivatedTrialCents,
      dropoffStep: {
        onboarding: trialStartedAndNoOnboarding,
        firstOrder: onboardingAndNoFirstOrder,
        paidConversion: firstOrderAndNoPayment,
        activated: firstOrders,
      },
    },
  };
}

export function computeCommercialFunnelSegmentation(
  events: CommercialEvent[],
): CommercialFunnelSegmentation {
  return {
    global: computeCommercialFunnelMetrics(events),
    byCountry: groupByKey(events, (event) => event.country),
    bySegment: groupByKey(events, (event) => event.segment),
    byDevice: groupByKey(events, (event) => event.device),
    bySource: groupByKey(events, (event) => normalizeBucket(event.utm_source)),
    byCampaign: groupByKey(events, (event) =>
      normalizeBucket(event.utm_campaign),
    ),
  };
}

export function computeActivationIntelligenceInsights(
  events: CommercialEvent[],
): ActivationIntelligenceInsights {
  const metrics = computeCommercialFunnelMetrics(events);
  const onboardingDropoff = metrics.activation.dropoffStep.onboarding;
  const firstOrderDropoff = metrics.activation.dropoffStep.firstOrder;
  const shiftOpenedDropoff = Math.max(
    metrics.firstOrders - metrics.firstShifts,
    0,
  );
  const paidConversionDropoff = Math.max(
    metrics.firstShifts - metrics.firstPayments,
    0,
  );

  const worstDropoffStep = (
    [
      ["onboarding", onboardingDropoff],
      ["first_order", firstOrderDropoff],
      ["shift_opened", shiftOpenedDropoff],
      ["paid_conversion", paidConversionDropoff],
    ] as const
  ).sort((a, b) => b[1] - a[1])[0][0];

  const activationVelocityScore = computeVelocityScore(metrics);
  const orgClassification = classifyActivationScore(activationVelocityScore);

  const buckets = new Map<string, CommercialEvent[]>();
  events.forEach((event) => {
    const key = monthKey(event.timestamp);
    if (!key) return;
    const bucket = buckets.get(key) ?? [];
    bucket.push(event);
    buckets.set(key, bucket);
  });

  const keys = Array.from(buckets.keys()).sort();
  const currentKey = keys[keys.length - 1];
  const previousKey = keys[keys.length - 2];
  const alerts: string[] = [];

  if (currentKey && previousKey) {
    const currentMetrics = computeCommercialFunnelMetrics(
      buckets.get(currentKey) ?? [],
    );
    const previousMetrics = computeCommercialFunnelMetrics(
      buckets.get(previousKey) ?? [],
    );

    if (previousMetrics.activation.activationRate > 0) {
      const decline =
        (previousMetrics.activation.activationRate -
          currentMetrics.activation.activationRate) /
        previousMetrics.activation.activationRate;

      if (decline >= 0.2) {
        alerts.push(`Activation slowing ${Math.round(decline * 100)}% MoM`);
      }
    }

    const currentDropoffs = toDropoffRates(currentMetrics);
    const previousDropoffs = toDropoffRates(previousMetrics);
    const shiftIncrease =
      currentDropoffs.shiftOpenedRate - previousDropoffs.shiftOpenedRate;

    if (shiftIncrease >= 0.15) {
      alerts.push("Dropoff increased at shift_opened step");
    }
  }

  return {
    worstDropoffStep,
    activationVelocityScore,
    orgClassification,
    alerts,
  };
}

export function computeActivationRecommendedActions(input: {
  insights: ActivationIntelligenceInsights;
  metrics: CommercialFunnelMetrics;
}): ActivationRecommendedAction[] {
  const candidates: ActivationRecommendedAction[] = [];
  const { insights, metrics } = input;

  const add = (action: ActivationRecommendedAction) => {
    if (candidates.some((item) => item.title === action.title)) return;
    candidates.push(action);
  };

  if (insights.worstDropoffStep === "onboarding") {
    add({
      title: "Reduce onboarding friction",
      reason: "Trial users are dropping before finishing onboarding",
      automation: "Trigger in-app onboarding checklist nudges",
    });
    add({
      title: "Offer guided setup call",
      reason: "Early operational support can unlock first value faster",
      automation: "Auto-create guided setup CTA for slow accounts",
    });
  }

  if (insights.worstDropoffStep === "first_order") {
    add({
      title: "Pre-load demo menu",
      reason: "Users stall before first order due to empty setup state",
      automation: "Auto-create starter menu on onboarding completion",
    });
    add({
      title: "Trigger contextual tooltip for menu setup",
      reason: "First-order dropoff indicates uncertainty in menu creation flow",
      automation: "Show tooltip sequence after onboarding completion",
    });
    add({
      title: "Simulate first order demo",
      reason: "Hands-on first order walkthrough accelerates time-to-value",
      automation: "Launch guided first-order demo after menu publish",
    });
  }

  if (insights.worstDropoffStep === "shift_opened") {
    add({
      title: "Auto-open first shift after onboarding",
      reason:
        "Activation drops between first order and operational shift setup",
      automation: "Enable one-click auto-open shift suggestion",
    });
    add({
      title: "Add shift-start checklist prompt",
      reason: "Users need explicit guidance to open first operational shift",
      automation: "Send in-app shift checklist reminder",
    });
  }

  if (insights.worstDropoffStep === "paid_conversion") {
    add({
      title: "Nudge payment method setup",
      reason: "Users activate but fail to convert to paid plan",
      automation: "Trigger billing setup prompt after first shift",
    });
  }

  if (insights.orgClassification === "Slow activators") {
    add({
      title: "Send onboarding email sequence",
      reason: "Accounts are progressing but too slowly",
      automation: "Enroll account in activation drip campaign",
    });
  }

  if (insights.orgClassification === "Stalled") {
    add({
      title: "Escalate stalled accounts to success outreach",
      reason: "Activation progress is critically low",
      automation: "Create high-priority CS task with account snapshot",
    });
  }

  if (insights.activationVelocityScore < 40) {
    add({
      title: "Reduce setup friction",
      reason: "Low velocity score indicates too much initial setup overhead",
      automation: "Enable fast-start mode with reduced required steps",
    });
    add({
      title: "Simulate first order demo",
      reason: "Immediate product value can recover low activation velocity",
      automation: "Auto-launch first-order simulation after first login",
    });
  }

  if (metrics.activation.timeToFirstOrderHoursMedian > 12) {
    add({
      title: "Add first-order urgency nudges",
      reason: "Median time to first order is too high",
      automation: "Trigger reminder at 6h and 12h without first order",
    });
  }

  return candidates.slice(0, 3);
}

export function buildCommercialFunnelSnapshotCsv(
  segmentation: CommercialFunnelSegmentation,
): string {
  const lines: string[] = [
    "dimension,key,pageViews,pricingViews,ctaClicks,leadSubmits,trialStarts,firstOrders,firstPayments,activationRatePct,trialConversionRatePct,timeToFirstOrderHoursMedian,revenuePerActivatedTrialCents,dropoffOnboarding,dropoffFirstOrder,dropoffPaidConversion",
  ];

  const pushDimension = (
    dimension: string,
    metricsByKey: Record<string, CommercialFunnelMetrics>,
  ) => {
    Object.entries(metricsByKey).forEach(([key, metrics]) => {
      lines.push(
        [
          dimension,
          key,
          metrics.pageViews,
          metrics.pricingViews,
          metrics.ctaClicks,
          metrics.leadSubmits,
          metrics.trialStarts,
          metrics.firstOrders,
          metrics.firstPayments,
          toPct(metrics.rates.activationRate),
          toPct(metrics.activation.trialConversionRate),
          metrics.activation.timeToFirstOrderHoursMedian,
          metrics.activation.revenuePerActivatedTrialCents,
          metrics.activation.dropoffStep.onboarding,
          metrics.activation.dropoffStep.firstOrder,
          metrics.activation.dropoffStep.paidConversion,
        ].join(","),
      );
    });
  };

  lines.push(
    [
      "global",
      "all",
      segmentation.global.pageViews,
      segmentation.global.pricingViews,
      segmentation.global.ctaClicks,
      segmentation.global.leadSubmits,
      segmentation.global.trialStarts,
      segmentation.global.firstOrders,
      segmentation.global.firstPayments,
      toPct(segmentation.global.rates.activationRate),
      toPct(segmentation.global.activation.trialConversionRate),
      segmentation.global.activation.timeToFirstOrderHoursMedian,
      segmentation.global.activation.revenuePerActivatedTrialCents,
      segmentation.global.activation.dropoffStep.onboarding,
      segmentation.global.activation.dropoffStep.firstOrder,
      segmentation.global.activation.dropoffStep.paidConversion,
    ].join(","),
  );

  pushDimension("country", segmentation.byCountry);
  pushDimension("segment", segmentation.bySegment);
  pushDimension("device", segmentation.byDevice);
  pushDimension("source", segmentation.bySource);
  pushDimension("campaign", segmentation.byCampaign);

  return lines.join("\n");
}
