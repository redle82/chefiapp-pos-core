/**
 * Operational Readiness Engine (ORE)
 *
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 */

export { BlockingScreen } from "./BlockingScreen";
export { DeviceBlockedScreen } from "./DeviceBlockedScreen";
export {
  INVALID_OR_SEED_RESTAURANT_IDS,
  hasOperationalRestaurant,
  type OperationalRestaurantIdentity,
  type OperationalRestaurantInput,
} from "./operationalRestaurant";
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
  useDeviceGate,
  type DeviceBlockedReason,
  type UseDeviceGateResult,
} from "./useDeviceGate";
export {
  useOperationalReadiness,
  type UseOperationalReadinessResult,
} from "./useOperationalReadiness";
export { usePreflightOperational } from "./usePreflightOperational";
