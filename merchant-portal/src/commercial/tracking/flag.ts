/**
 * Commercial Tracking — Feature flag.
 *
 * Single source of truth for the commercial tracking toggle.
 * Checks VITE_COMMERCIAL_TRACKING_ENABLED env var → default false in prod, true in dev.
 *
 * Usage:
 *   import { isCommercialTrackingEnabled } from '../commercial/tracking/flag';
 *   if (!isCommercialTrackingEnabled()) return;
 */

const DEV = import.meta.env.DEV;

export function isCommercialTrackingEnabled(): boolean {
  const envVal = import.meta.env.VITE_COMMERCIAL_TRACKING_ENABLED;
  if (envVal === "true" || envVal === "1") return true;
  if (envVal === "false" || envVal === "0") return false;
  // Default: enabled in dev, disabled in prod
  return DEV;
}

export function isActivationAutomationEnabled(): boolean {
  const envVal = import.meta.env.VITE_ACTIVATION_AUTOMATION_ENABLED;
  if (envVal === "true" || envVal === "1") return true;
  if (envVal === "false" || envVal === "0") return false;
  return DEV;
}

export function isActivationAutomationDispatchEnabled(): boolean {
  const envVal = import.meta.env.VITE_ACTIVATION_AUTOMATION_DISPATCH_ENABLED;
  if (envVal === "true" || envVal === "1") return true;
  if (envVal === "false" || envVal === "0") return false;
  return false;
}

export function isChurnRiskAutomationEnabled(): boolean {
  const envVal = import.meta.env.VITE_CHURN_RISK_AUTOMATION_ENABLED;
  if (envVal === "true" || envVal === "1") return true;
  if (envVal === "false" || envVal === "0") return false;
  return DEV;
}
