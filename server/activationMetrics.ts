/**
 * Activation Metrics — Server-side compute for /internal/activation/metrics
 *
 * Phase 2.6 — Accepts commercial events, returns activation intelligence.
 * Logic mirrors merchant-portal activationIntelligence + funnelMetrics.
 */

export interface ActivationEvent {
  event: string;
  restaurant_id?: string;
  timestamp?: string;
  amount_cents?: number;
}

const MILESTONES = [
  { event: "first_login", weight: 1 },
  { event: "first_menu_created", weight: 2 },
  { event: "first_shift_opened", weight: 3 },
  { event: "first_payment_received", weight: 4 },
  { event: "first_order_created", weight: 5 },
] as const;

const MAX_SCORE = MILESTONES.reduce((s, m) => s + m.weight, 0);

function uniqueRestaurants(
  events: ActivationEvent[],
  eventNames: string | string[],
): Set<string> {
  const names =
    typeof eventNames === "string"
      ? new Set([eventNames])
      : new Set(eventNames);
  const ids = new Set<string>();
  events.forEach((e) => {
    if (names.has(e.event) && e.restaurant_id) ids.add(e.restaurant_id);
  });
  return ids;
}

function earliestByRestaurant(
  events: ActivationEvent[],
  eventNames: string[],
): Map<string, number> {
  const names = new Set(eventNames);
  const out = new Map<string, number>();
  events.forEach((e) => {
    if (!names.has(e.event) || !e.restaurant_id || !e.timestamp) return;
    const ts = Date.parse(e.timestamp);
    if (Number.isNaN(ts)) return;
    const cur = out.get(e.restaurant_id);
    if (cur === undefined || ts < cur) out.set(e.restaurant_id, ts);
  });
  return out;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface ActivationMetricsResponse {
  trialStarts: number;
  firstLogins: number;
  firstMenus: number;
  firstShifts: number;
  firstOrders: number;
  firstPayments: number;
  activationRate: number;
  trialConversionRate: number;
  timeToFirstOrderHoursMedian: number;
  timeToFirstOrderHoursAvg: number;
  activationScores: Array<{
    restaurantId: string;
    score: number;
    maxScore: number;
    scoreNormalized: number;
    milestones: Record<string, boolean>;
  }>;
  aggregates: {
    avgActivationScore: number;
    medianActivationScore: number;
    fullyActivatedCount: number;
    dropoffByStep: {
      noMenu: number;
      noShift: number;
      noOrder: number;
      noPayment: number;
    };
  };
}

export function computeActivationMetrics(
  events: ActivationEvent[],
): ActivationMetricsResponse {
  const trialIds = uniqueRestaurants(events, ["trial_start", "trial_started"]);
  const firstLoginIds = uniqueRestaurants(events, "first_login");
  const firstMenuIds = uniqueRestaurants(events, "first_menu_created");
  const firstShiftIds = uniqueRestaurants(events, "first_shift_opened");
  const firstOrderIds = uniqueRestaurants(events, "first_order_created");
  const firstPaymentIds = uniqueRestaurants(events, "first_payment_received");

  const trialStarts = trialIds.size;
  const firstLogins = firstLoginIds.size;
  const firstMenus = firstMenuIds.size;
  const firstShifts = firstShiftIds.size;
  const firstOrders = firstOrderIds.size;
  const firstPayments = firstPaymentIds.size;

  const trialTimes = earliestByRestaurant(events, [
    "trial_start",
    "trial_started",
  ]);
  const firstOrderTimes = earliestByRestaurant(events, ["first_order_created"]);

  const timeToFirstOrderHours = Array.from(firstOrderTimes.entries())
    .map(([rid, orderTs]) => {
      const t = trialTimes.get(rid);
      if (t === undefined) return null;
      const d = (orderTs - t) / (1000 * 60 * 60);
      return d >= 0 ? d : null;
    })
    .filter((x): x is number => x !== null);

  const avg =
    timeToFirstOrderHours.length > 0
      ? timeToFirstOrderHours.reduce((s, v) => s + v, 0) /
        timeToFirstOrderHours.length
      : 0;
  const med = median(timeToFirstOrderHours);

  const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
  const activationRate = ratio(firstOrders, trialStarts);
  const trialConversionRate = ratio(firstPayments, trialStarts);

  const byRestaurant = new Map<
    string,
    { score: number; milestones: Record<string, boolean> }
  >();

  for (const { event, weight } of MILESTONES) {
    const ids = uniqueRestaurants(events, event);
    ids.forEach((rid) => {
      let entry = byRestaurant.get(rid);
      if (!entry) {
        entry = { score: 0, milestones: {} };
        byRestaurant.set(rid, entry);
      }
      entry.score += weight;
      entry.milestones[event] = true;
    });
  }

  const activationScores = Array.from(byRestaurant.entries())
    .map(([restaurantId, { score, milestones }]) => ({
      restaurantId,
      score,
      maxScore: MAX_SCORE,
      scoreNormalized: Math.round((score / MAX_SCORE) * 5 * 10) / 10,
      milestones,
    }))
    .sort((a, b) => b.score - a.score);

  const scores = activationScores.map((s) => s.score);
  const fullyActivated = activationScores.filter((s) => s.score === MAX_SCORE).length;

  const dropoffByStep = {
    noMenu: Math.max(0, trialStarts - firstMenus),
    noShift: Math.max(0, firstMenus - firstShifts),
    noOrder: Math.max(0, firstShifts - firstOrders),
    noPayment: Math.max(0, firstOrders - firstPayments),
  };

  return {
    trialStarts,
    firstLogins,
    firstMenus,
    firstShifts,
    firstOrders,
    firstPayments,
    activationRate,
    trialConversionRate,
    timeToFirstOrderHoursMedian: Math.round(med * 100) / 100,
    timeToFirstOrderHoursAvg: Math.round(avg * 100) / 100,
    activationScores,
    aggregates: {
      avgActivationScore:
        scores.length > 0
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10,
            ) / 10
          : 0,
      medianActivationScore:
        scores.length > 0 ? Math.round(median(scores) * 10) / 10 : 0,
      fullyActivatedCount: fullyActivated,
      dropoffByStep,
    },
  };
}
