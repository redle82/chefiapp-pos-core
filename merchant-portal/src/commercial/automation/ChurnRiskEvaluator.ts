/**
 * Churn Risk Evaluator
 *
 * Trigger: churn_risk (inactividade)
 *
 * A restaurant is considered at churn risk when it has completed onboarding
 * (has a first_login event) but has not created any order in the current
 * month AND the last known activity is older than INACTIVITY_THRESHOLD_DAYS.
 *
 * Score model (0–100):
 *   - Days since last activity:  up to +60 pts  (linear: 1pt/day up to 60)
 *   - No orders in current month: +30 pts
 *   - No shift in current month:  +10 pts
 *
 * Thresholds:
 *   score >= 70 → "Stalled"       (high churn risk)
 *   score >= 40 → "Slow activators" (medium risk)
 *   score <  40 → no trigger (healthy enough)
 *
 * Idempotency key: churn:{restaurantId}:{month}:{scoreRange}
 */

import type { CommercialEvent } from "../tracking/types";
import type {
  AutomationClassification,
  TriggerEvaluationResult,
  TriggerEvaluator,
} from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INACTIVITY_THRESHOLD_DAYS = 7;
const SCORE_TRIGGER_THRESHOLD = 40;

// ---------------------------------------------------------------------------
// Score thresholds → classification
// ---------------------------------------------------------------------------

function classifyChurnScore(score: number): AutomationClassification | null {
  if (score >= 70) return "Stalled";
  if (score >= SCORE_TRIGGER_THRESHOLD) return "Slow activators";
  return null; // healthy — do not trigger
}

// ---------------------------------------------------------------------------
// Context definition
// ---------------------------------------------------------------------------

export interface ChurnRiskContext {
  /** All commercial events for this restaurant */
  events: CommercialEvent[];
  /** ISO date string of "now" — injected for testability */
  nowIso?: string;
}

// ---------------------------------------------------------------------------
// Scoring logic (pure — easily unit-tested)
// ---------------------------------------------------------------------------

export interface ChurnRiskScore {
  score: number;
  daysSinceLastActivity: number;
  hasOrdersThisMonth: boolean;
  hasShiftThisMonth: boolean;
  lastActivityIso: string | null;
}

/**
 * Compute churn risk score from a set of events.
 * Pure function — no side effects, no localStorage.
 */
export function computeChurnRiskScore(
  events: CommercialEvent[],
  nowIso?: string,
): ChurnRiskScore {
  const now = nowIso ? new Date(nowIso) : new Date();
  const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

  // Find last activity timestamp across all events
  let lastActivityIso: string | null = null;
  let hasOrdersThisMonth = false;
  let hasShiftThisMonth = false;

  for (const event of events) {
    const ts = event.timestamp;
    if (!lastActivityIso || ts > lastActivityIso) {
      lastActivityIso = ts;
    }
    const eventMonth = ts.slice(0, 7);
    if (eventMonth === currentMonth) {
      if (
        event.event === "first_order_created" ||
        event.event === "onboarding_completed"
      ) {
        hasOrdersThisMonth = true;
      }
      if (event.event === "first_shift_opened") {
        hasShiftThisMonth = true;
      }
    }
  }

  // Days since last activity
  let daysSinceLastActivity = 0;
  if (lastActivityIso) {
    const lastMs = new Date(lastActivityIso).getTime();
    const nowMs = now.getTime();
    daysSinceLastActivity = Math.max(
      0,
      Math.floor((nowMs - lastMs) / (1000 * 60 * 60 * 24)),
    );
  }

  // Score composition
  let score = 0;

  // Inactivity component: 1pt/day capped at 60
  score += Math.min(60, daysSinceLastActivity);

  // No orders this month
  if (!hasOrdersThisMonth) score += 30;

  // No shift this month
  if (!hasShiftThisMonth) score += 10;

  return {
    score: Math.min(100, score),
    daysSinceLastActivity,
    hasOrdersThisMonth,
    hasShiftThisMonth,
    lastActivityIso,
  };
}

// ---------------------------------------------------------------------------
// Recommended actions per risk level
// ---------------------------------------------------------------------------

interface ChurnRecommendedAction {
  title: string;
  reason: string;
  automation: string;
}

function getChurnRecommendedAction(
  score: number,
  daysSinceLastActivity: number,
): ChurnRecommendedAction {
  if (score >= 70) {
    return {
      title: "Reactivação urgente — restaurante inativo",
      reason: `Sem atividade há ${daysSinceLastActivity} dia(s). Alto risco de churn.`,
      automation: "churn_reactivation_urgent",
    };
  }
  return {
    title: "Check-in proativo — atividade abaixo do esperado",
    reason: `Atividade reduzida há ${daysSinceLastActivity} dia(s). Intervir antes do abandono.`,
    automation: "churn_checkin_proactive",
  };
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

function toIdempotencyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 48);
}

export class ChurnRiskEvaluator implements TriggerEvaluator<ChurnRiskContext> {
  readonly trigger = "churn_risk" as const;

  evaluate(context: ChurnRiskContext): TriggerEvaluationResult {
    const { events, nowIso } = context;

    if (events.length === 0) return { shouldFire: false };

    // Must have at least one first_login to be onboarded
    const hasOnboarded = events.some(
      (e) => e.event === "first_login" || e.event === "trial_start",
    );
    if (!hasOnboarded) return { shouldFire: false };

    const now = nowIso ? new Date(nowIso) : new Date();

    // Must have been inactive for at least the threshold
    const churnScore = computeChurnRiskScore(events, nowIso);
    if (churnScore.daysSinceLastActivity < INACTIVITY_THRESHOLD_DAYS) {
      return { shouldFire: false };
    }

    const classification = classifyChurnScore(churnScore.score);
    if (!classification) return { shouldFire: false };

    // Find restaurant_id from events
    let restaurantId: string | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (
        "restaurant_id" in e &&
        typeof e.restaurant_id === "string" &&
        e.restaurant_id.trim()
      ) {
        restaurantId = e.restaurant_id;
        break;
      }
    }
    if (!restaurantId) return { shouldFire: false };

    const month = now.toISOString().slice(0, 7);
    const scoreRange = churnScore.score >= 70 ? "high" : "medium";
    const dedupeKey = [
      "churn",
      toIdempotencyPart(restaurantId),
      month,
      "churn_risk",
      scoreRange,
    ].join(":");

    const action = getChurnRecommendedAction(
      churnScore.score,
      churnScore.daysSinceLastActivity,
    );

    return {
      shouldFire: true,
      dedupeKey,
      payload: {
        restaurant_id: restaurantId,
        trigger: "churn_risk",
        score: churnScore.score,
        classification,
        recommended_action: action,
      },
    };
  }
}
