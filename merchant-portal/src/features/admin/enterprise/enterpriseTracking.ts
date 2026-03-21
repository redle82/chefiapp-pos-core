/**
 * Enterprise dashboard tracking — CommercialTrackingService events
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
    landing_version: "admin-enterprise",
    device: detectDevice(),
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };
}

export function trackEnterprisePageView(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_page_view" });
}

export function trackEnterpriseDateChange(date: string): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({
    ...basePayload(),
    event: "enterprise_date_change",
    date,
  });
}

export function trackEnterpriseHeatmapToggle(enabled: boolean): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({
    ...basePayload(),
    event: "enterprise_heatmap_toggle",
    enabled,
  });
}

export function trackEnterpriseHeatmapDayClick(date: string): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({
    ...basePayload(),
    event: "enterprise_heatmap_day_click",
    date,
  });
}

export function trackEnterpriseExportClick(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_export_click" });
}

export function trackEnterpriseBackendMissing(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_backend_missing" });
}

export function trackEnterpriseRiskView(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_risk_view" });
}

export function trackEnterpriseRiskHigh(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_risk_high" });
}

export function trackEnterpriseTrendDetected(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_trend_detected" });
}

export function trackEnterpriseHealthBannerView(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_health_banner_view" });
}

export function trackEnterpriseTrendView(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_trend_view" });
}

export function trackEnterpriseUpsellView(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_upsell_view" });
}

export function trackEnterpriseUpsellClick(): void {
  if (!isCommercialTrackingEnabled()) return;
  commercialTracking.track({ ...basePayload(), event: "enterprise_upsell_click" });
}
