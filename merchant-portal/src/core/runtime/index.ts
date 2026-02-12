/**
 * Runtime Module Exports
 *
 * Central export point for all runtime-related functionality.
 */

export {
  devStableReason,
  isDebugEnabled,
  isDevStableMode,
} from "./devStableMode";

export {
  RUNTIME,
  assertNoMock,
  assertProduction,
  assertValidRestaurantId,
  isProduction,
  isTrial,
  logRuntimeStatus,
  runtimeMode,
  validateDemoFlags,
  type RuntimeContext,
  type RuntimeMode,
} from "./RuntimeContext";
