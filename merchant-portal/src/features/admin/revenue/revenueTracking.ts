/**
 * Revenue Dashboard — Admin internal tracking.
 */

import {
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../../../commercial/tracking";

function basePayload() {
  return {
    timestamp: new Date().toISOString(),
    country: "gb" as const,
    segment: "small" as const,
    landing_version: "admin-revenue",
    device: detectDevice(),
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };
}

export function trackAdminRevenueDashboardView(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "admin_revenue_dashboard_view" });
}

export function trackAdminRevenueMetricView(metric: string): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({
    ...basePayload(),
    event: "admin_revenue_metric_view",
    metric,
  });
}

export function trackAdminRevenueGrowthFlag(growthPct: number): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({
    ...basePayload(),
    event: "admin_revenue_growth_flag",
    growthPct,
  });
}
