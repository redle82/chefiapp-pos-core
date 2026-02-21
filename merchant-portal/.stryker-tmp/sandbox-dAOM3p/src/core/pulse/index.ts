/**
 * merchant-portal/src/core/pulse — barrel exports
 *
 * React layer for Operational Pulse (Pulso Operacional).
 * Core calculation lives in core-engine/pulse/.
 */
// @ts-nocheck


// Hook
export { usePulse } from "./usePulse";
export type { UsePulseOptions, UsePulseResult } from "./usePulse";

// Provider + context hooks
export {
  PulseProvider,
  usePulseContext,
  usePulseOptional,
} from "./PulseProvider";
export type { PulseContextValue } from "./PulseProvider";

// Visual component
export { PulseIndicator } from "./PulseIndicator";
export type { PulseIndicatorProps } from "./PulseIndicator";
