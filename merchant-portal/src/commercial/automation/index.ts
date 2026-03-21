/**
 * Automation Engine v4 — Public API
 */

export { ActivationVelocityEvaluator } from "./ActivationVelocityEvaluator";
export {
  AutomationEngine,
  createGatewayDispatchAdapter,
} from "./AutomationEngine";
export {
  ChurnRiskEvaluator,
  computeChurnRiskScore,
} from "./ChurnRiskEvaluator";
export type {
  AutomationClassification,
  AutomationDispatchAdapter,
  AutomationDispatchPayload,
  AutomationEngineConfig,
  AutomationTriggerType,
  TriggerEvaluationResult,
  TriggerEvaluator,
} from "./types";
