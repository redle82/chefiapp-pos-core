/**
 * Automation Engine v4 — Platform Types
 *
 * Generic, reusable types for the multi-trigger automation platform.
 * Zero feature-specific logic here — only the structural contracts.
 */

// ---------------------------------------------------------------------------
// Trigger registry
// ---------------------------------------------------------------------------

/**
 * All known automation trigger identifiers.
 * Extend this union when adding new triggers.
 */
export type AutomationTriggerType = "activation_velocity_low" | "churn_risk";

/**
 * Classifications shared across all trigger types.
 * Every trigger must map its evaluation to one of these buckets
 * so that the gateway validation (AUTOMATION_ALLOWED_CLASSIFICATIONS)
 * continues to pass without changes to the server contract.
 */
export type AutomationClassification =
  | "Fast activators"
  | "Slow activators"
  | "Stalled";

// ---------------------------------------------------------------------------
// Dispatch payload (mirrors the gateway AutomationDispatchBody)
// ---------------------------------------------------------------------------

export interface AutomationDispatchPayload {
  restaurant_id: string;
  trigger: AutomationTriggerType;
  score: number;
  classification: AutomationClassification;
  recommended_action: {
    title: string;
    reason: string;
    automation: string;
  };
  idempotency_key: string;
}

// ---------------------------------------------------------------------------
// Trigger evaluation result
// ---------------------------------------------------------------------------

/**
 * Returned by each TriggerEvaluator.evaluate().
 * `shouldFire = false` → engine stops, no dispatch.
 * `shouldFire = true`  → payload is populated and engine dispatches.
 */
export type TriggerEvaluationResult =
  | { shouldFire: false }
  | {
      shouldFire: true;
      payload: Omit<AutomationDispatchPayload, "idempotency_key">;
      dedupeKey: string;
    };

// ---------------------------------------------------------------------------
// Evaluator interface (pluggable per trigger)
// ---------------------------------------------------------------------------

/**
 * Each trigger type implements this interface.
 * TContext is whatever data the evaluator needs (e.g. CommercialEvent[]).
 */
export interface TriggerEvaluator<TContext> {
  readonly trigger: AutomationTriggerType;
  evaluate(context: TContext): TriggerEvaluationResult;
}

// ---------------------------------------------------------------------------
// Dispatch adapter interface
// ---------------------------------------------------------------------------

/**
 * The engine calls this to send the payload.
 * In production: wraps fetch to the gateway.
 * In tests: can be replaced with a spy.
 */
export interface AutomationDispatchAdapter {
  dispatch(payload: AutomationDispatchPayload): Promise<void>;
}

// ---------------------------------------------------------------------------
// Engine config
// ---------------------------------------------------------------------------

export interface AutomationEngineConfig {
  /** localStorage key for storing dispatched dedupe keys */
  dedupeStorageKey: string;
  /** Max dedupe keys to keep in storage (ring buffer) */
  maxDedupeEntries: number;
}

export const DEFAULT_ENGINE_CONFIG: AutomationEngineConfig = {
  dedupeStorageKey: "chefiapp_activation_automation_dedupe",
  maxDedupeEntries: 100,
};
