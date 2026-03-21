/**
 * Activation Velocity Evaluator
 *
 * Trigger: activation_velocity_low
 *
 * Extracts and isolates the evaluation logic previously embedded in
 * CommercialTrackingService.maybeTriggerActivationAutomation().
 *
 * A restaurant has low activation velocity when:
 *   - trialStarts >= 1 (onboarded)
 *   - activationVelocityScore < 40 (from ActivationIntelligenceInsights)
 *
 * Classification comes from ActivationIntelligenceInsights.orgClassification
 * (already maps to "Fast activators" | "Slow activators" | "Stalled").
 *
 * Idempotency key: activation:{restaurantId}:{month}:activation_velocity_low:{actionKey}
 * (same format as V1.1 — backward compatible with existing dedupe records)
 */

import {
  computeActivationIntelligenceInsights,
  computeActivationRecommendedActions,
  computeCommercialFunnelMetrics,
} from "../tracking/funnelMetrics";
import type { CommercialEvent } from "../tracking/types";
import type { TriggerEvaluationResult, TriggerEvaluator } from "./types";

function toIdempotencyPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 48);
}

export interface ActivationVelocityContext {
  events: CommercialEvent[];
}

export class ActivationVelocityEvaluator
  implements TriggerEvaluator<ActivationVelocityContext>
{
  readonly trigger = "activation_velocity_low" as const;

  evaluate(context: ActivationVelocityContext): TriggerEvaluationResult {
    const { events } = context;

    const metrics = computeCommercialFunnelMetrics(events);
    if (metrics.trialStarts < 1) return { shouldFire: false };

    const insights = computeActivationIntelligenceInsights(events);
    if (insights.activationVelocityScore >= 40) return { shouldFire: false };

    const actions = computeActivationRecommendedActions({ insights, metrics });
    const firstAction = actions[0];
    if (!firstAction) return { shouldFire: false };

    const latestEvent = events[events.length - 1];
    if (!latestEvent) return { shouldFire: false };

    // Find restaurant_id
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

    const month = latestEvent.timestamp.slice(0, 7);
    const actionKey = toIdempotencyPart(firstAction.title);
    const dedupeKey = [
      "activation",
      toIdempotencyPart(restaurantId),
      month,
      "activation_velocity_low",
      actionKey,
    ].join(":");

    return {
      shouldFire: true,
      dedupeKey,
      payload: {
        restaurant_id: restaurantId,
        trigger: "activation_velocity_low",
        score: insights.activationVelocityScore,
        classification: insights.orgClassification,
        recommended_action: {
          title: firstAction.title,
          reason: firstAction.reason,
          automation: firstAction.automation,
        },
      },
    };
  }
}
