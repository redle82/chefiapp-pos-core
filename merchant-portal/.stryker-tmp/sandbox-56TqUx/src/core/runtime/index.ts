/**
 * Runtime Module Exports
 *
 * Central export point for all runtime-related functionality.
 */
// @ts-nocheck


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
