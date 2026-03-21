/**
 * Boot Pipeline — Public API
 *
 * @module core/boot
 */

// Types & FSM
export {
  BOOT_TIMEOUTS,
  BootStep,
  ERROR_STEPS,
  TERMINAL_STEPS,
  bootReducer,
  createInitialSnapshot,
} from "./BootState";
export type {
  AuthSnapshot,
  BootAction,
  BootDestination,
  BootReasonCode,
  BootSnapshot,
  TenantSnapshot,
} from "./BootState";

// Resolver
export { resolveBootDestination } from "./resolveBootDestination";
export type { BootDestinationInput } from "./resolveBootDestination";

// Telemetry
export {
  logBootSummary,
  logBootTransition,
  markBootStep,
  measureBootSpan,
  serializeBootSnapshot,
} from "./bootTelemetry";

// Hook
export { useBootPipeline } from "./useBootPipeline";
export type { BootPipelineResult } from "./useBootPipeline";

// UI
export { BootFallbackScreen } from "./BootFallbackScreen";
export type { BootFallbackScreenProps } from "./BootFallbackScreen";
