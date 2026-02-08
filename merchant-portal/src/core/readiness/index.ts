/**
 * Operational Readiness Engine (ORE)
 *
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 */

export { BlockingScreen } from "./BlockingScreen";
export {
  computePreflight,
  type PreflightBlocker,
  type PreflightBlockerCode,
  type PreflightOperationalResult,
} from "./preflightOperational";
export type {
  BlockingReason,
  OperationalReadiness,
  Surface,
  UiDirective,
} from "./types";
export {
  hasOperationalRestaurant,
  INVALID_OR_SEED_RESTAURANT_IDS,
  type OperationalRestaurantIdentity,
  type OperationalRestaurantInput,
} from "./operationalRestaurant";
export {
  useOperationalReadiness,
  type UseOperationalReadinessResult,
} from "./useOperationalReadiness";
export { usePreflightOperational } from "./usePreflightOperational";
