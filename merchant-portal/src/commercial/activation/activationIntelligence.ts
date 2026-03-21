/**
 * Activation Intelligence — Score progressivo + velocity
 *
 * Phase 2.6 — Activation Intelligence Layer
 * activation_score = first_login(1) + first_menu(2) + first_shift(3) + first_payment(4) + first_order(5)
 * Máximo: 15 (ou normalizado 0–5)
 */

import type { CommercialEvent } from "../tracking/types";
import {
  computeCommercialFunnelMetrics,
  type CommercialFunnelMetrics,
} from "../tracking/funnelMetrics";

export const ACTIVATION_MILESTONES = [
  { event: "first_login", weight: 1 },
  { event: "first_menu_created", weight: 2 },
  { event: "first_shift_opened", weight: 3 },
  { event: "first_payment_received", weight: 4 },
  { event: "first_order_created", weight: 5 },
] as const;

export const MAX_ACTIVATION_SCORE = ACTIVATION_MILESTONES.reduce(
  (sum, m) => sum + m.weight,
  0,
);

function uniqueRestaurantsForEvent(
  events: CommercialEvent[],
  eventName: string,
): Set<string> {
  const ids = new Set<string>();
  events.forEach((e) => {
    if (e.event === eventName && "restaurant_id" in e && e.restaurant_id) {
      ids.add(e.restaurant_id);
    }
  });
  return ids;
}

export interface RestaurantActivationScore {
  restaurantId: string;
  score: number;
  maxScore: number;
  scoreNormalized: number; // 0–5
  milestones: Record<string, boolean>;
}

/**
 * Calcula activation_score por restaurante.
 * Score = soma dos pesos dos milestones atingidos (1+2+3+4+5 = 15 max).
 * scoreNormalized = score / 3 para escala 0–5.
 */
export function computeActivationScorePerRestaurant(
  events: CommercialEvent[],
): RestaurantActivationScore[] {
  const byRestaurant = new Map<
    string,
    { score: number; milestones: Record<string, boolean> }
  >();

  for (const { event, weight } of ACTIVATION_MILESTONES) {
    const ids = uniqueRestaurantsForEvent(events, event);
    ids.forEach((restaurantId) => {
      let entry = byRestaurant.get(restaurantId);
      if (!entry) {
        entry = { score: 0, milestones: {} };
        byRestaurant.set(restaurantId, entry);
      }
      entry.score += weight;
      entry.milestones[event] = true;
    });
  }

  return Array.from(byRestaurant.entries()).map(([restaurantId, { score, milestones }]) => ({
    restaurantId,
    score,
    maxScore: MAX_ACTIVATION_SCORE,
    scoreNormalized: Math.round((score / MAX_ACTIVATION_SCORE) * 5 * 10) / 10,
    milestones,
  }));
}

export interface ActivationIntelligenceMetrics {
  funnel: CommercialFunnelMetrics;
  activationScores: RestaurantActivationScore[];
  aggregates: {
    avgActivationScore: number;
    medianActivationScore: number;
    fullyActivatedCount: number; // score === 15
    timeToFirstOrderHoursMedian: number;
    timeToFirstOrderHoursAvg: number;
    dropoffByStep: {
      noMenu: number;
      noShift: number;
      noPayment: number;
      noOrder: number;
    };
    activationRate: number;
    trialConversionRate: number;
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Retorna métricas completas de Activation Intelligence.
 */
export function computeActivationIntelligence(
  events: CommercialEvent[],
): ActivationIntelligenceMetrics {
  const funnel = computeCommercialFunnelMetrics(events);
  const activationScores = computeActivationScorePerRestaurant(events);

  const scoreValues = activationScores.map((s) => s.score);
  const fullyActivatedCount = activationScores.filter(
    (s) => s.score === MAX_ACTIVATION_SCORE,
  ).length;

  const dropoffByStep = {
    noMenu: Math.max(0, funnel.trialStarts - funnel.firstMenus),
    noShift: Math.max(0, funnel.firstMenus - funnel.firstShifts),
    noOrder: Math.max(0, funnel.firstShifts - funnel.firstOrders),
    noPayment: Math.max(0, funnel.firstOrders - funnel.firstPayments),
  };

  return {
    funnel,
    activationScores: activationScores.sort((a, b) => b.score - a.score),
    aggregates: {
      avgActivationScore:
        scoreValues.length > 0
          ? Math.round(
              (scoreValues.reduce((s, v) => s + v, 0) / scoreValues.length) *
                10,
            ) / 10
          : 0,
      medianActivationScore:
        scoreValues.length > 0
          ? Math.round(median(scoreValues) * 10) / 10
          : 0,
      fullyActivatedCount,
      timeToFirstOrderHoursMedian: funnel.activation.timeToFirstOrderHoursMedian,
      timeToFirstOrderHoursAvg: funnel.activation.timeToFirstOrderHoursAvg,
      dropoffByStep,
      activationRate: funnel.rates.activationRate,
      trialConversionRate: funnel.activation.trialConversionRate,
    },
  };
}
