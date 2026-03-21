/**
 * Commercial Tracking — Event types & contracts.
 *
 * Canonical event shapes for the commercial funnel.
 * All events share a base shape; discriminated by `event` property.
 *
 * Ref: docs/commercial/TRACKING_EVENTS_SPEC.md
 */

import type { CountryCode } from "../../landings/countries";
import type { Segment } from "../../landings/countryCopy";

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export interface CommercialEventBase {
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Country code where the event was captured */
  country: CountryCode;
  /** Visitor segment */
  segment: Segment;
  /** Landing version (e.g. "country-v1", "landing-v2") */
  landing_version: string;
  /** Device category */
  device: "mobile" | "tablet" | "desktop";
  /** Current pathname */
  path: string;
  /** UTM source (optional) */
  utm_source?: string;
  /** UTM medium (optional) */
  utm_medium?: string;
  /** UTM campaign (optional) */
  utm_campaign?: string;
}

// ---------------------------------------------------------------------------
// Event discriminants
// ---------------------------------------------------------------------------

export type CommercialEventName =
  | "page_view"
  | "cta_whatsapp_click"
  | "cta_demo_click"
  | "pricing_view"
  | "banner_impression"
  | "banner_click"
  | "upgrade_click"
  | "module_interest"
  | "pricing_toggle"
  | "pricing_conversion_click"
  | "enterprise_export_click"
  | "enterprise_page_view"
  | "enterprise_date_change"
  | "enterprise_heatmap_toggle"
  | "enterprise_heatmap_day_click"
  | "enterprise_backend_missing"
  | "enterprise_risk_view"
  | "enterprise_risk_high"
  | "enterprise_trend_detected"
  | "enterprise_health_banner_view"
  | "enterprise_trend_view"
  | "enterprise_upsell_view"
  | "enterprise_upsell_click"
  | "admin_revenue_dashboard_view"
  | "admin_revenue_metric_view"
  | "admin_revenue_growth_flag"
  | "trial_started"
  | "onboarding_completed"
  | "first_order_created"
  | "lead_email_submit"
  | "first_login"
  | "first_menu_created"
  | "first_shift_opened"
  | "first_payment_received"
  | "activation_automation_triggered";

export interface TrialStartedEvent extends CommercialEventBase {
  event: "trial_started";
  restaurant_id: string;
}

export interface OnboardingCompletedEvent extends CommercialEventBase {
  event: "onboarding_completed";
  restaurant_id?: string;
}

export interface FirstOrderCreatedEvent extends CommercialEventBase {
  event: "first_order_created";
  restaurant_id: string;
  order_id: string;
}

// -- page_view --------------------------------------------------------------
export interface PageViewEvent extends CommercialEventBase {
  event: "page_view";
}

// -- cta_whatsapp_click -----------------------------------------------------
export interface CtaWhatsAppClickEvent extends CommercialEventBase {
  event: "cta_whatsapp_click";
  /** Where in the page the CTA was placed (hero, footer, sticky, pricing…) */
  placement: string;
}

// -- cta_demo_click ---------------------------------------------------------
export interface CtaDemoClickEvent extends CommercialEventBase {
  event: "cta_demo_click";
}

// -- pricing_view -----------------------------------------------------------
export interface PricingViewEvent extends CommercialEventBase {
  event: "pricing_view";
  /** Which plan card was in view */
  plan: string;
}

// -- banner_impression ------------------------------------------------------
export interface BannerImpressionEvent extends CommercialEventBase {
  event: "banner_impression";
  message_index: number;
}

// -- banner_click -----------------------------------------------------------
export interface BannerClickEvent extends CommercialEventBase {
  event: "banner_click";
  message_index: number;
}

// -- upgrade_click ----------------------------------------------------------
export interface UpgradeClickEvent extends CommercialEventBase {
  event: "upgrade_click";
  module?: string;
  placement?: string;
}

// -- module_interest --------------------------------------------------------
export interface ModuleInterestEvent extends CommercialEventBase {
  event: "module_interest";
  module: string;
}

// -- pricing_toggle ---------------------------------------------------------
export interface PricingToggleEvent extends CommercialEventBase {
  event: "pricing_toggle";
  /** "monthly" | "annual" */
  value: string;
}

// -- pricing_conversion_click -----------------------------------------------
export interface PricingConversionClickEvent extends CommercialEventBase {
  event: "pricing_conversion_click";
  plan?: string;
  billing?: "monthly" | "annual";
}

// -- enterprise_export_click ------------------------------------------------
export interface EnterpriseExportClickEvent extends CommercialEventBase {
  event: "enterprise_export_click";
}

// -- enterprise_page_view ---------------------------------------------------
export interface EnterprisePageViewEvent extends CommercialEventBase {
  event: "enterprise_page_view";
}

// -- enterprise_date_change -------------------------------------------------
export interface EnterpriseDateChangeEvent extends CommercialEventBase {
  event: "enterprise_date_change";
  date?: string;
}

// -- enterprise_heatmap_toggle ----------------------------------------------
export interface EnterpriseHeatmapToggleEvent extends CommercialEventBase {
  event: "enterprise_heatmap_toggle";
  enabled?: boolean;
}

// -- enterprise_heatmap_day_click -------------------------------------------
export interface EnterpriseHeatmapDayClickEvent extends CommercialEventBase {
  event: "enterprise_heatmap_day_click";
  date?: string;
}

// -- enterprise_backend_missing ---------------------------------------------
export interface EnterpriseBackendMissingEvent extends CommercialEventBase {
  event: "enterprise_backend_missing";
}

// -- enterprise_risk_view ---------------------------------------------------
export interface EnterpriseRiskViewEvent extends CommercialEventBase {
  event: "enterprise_risk_view";
}

// -- enterprise_risk_high ---------------------------------------------------
export interface EnterpriseRiskHighEvent extends CommercialEventBase {
  event: "enterprise_risk_high";
}

// -- enterprise_trend_detected -----------------------------------------------
export interface EnterpriseTrendDetectedEvent extends CommercialEventBase {
  event: "enterprise_trend_detected";
}

// -- enterprise_health_banner_view -------------------------------------------
export interface EnterpriseHealthBannerViewEvent extends CommercialEventBase {
  event: "enterprise_health_banner_view";
}

// -- enterprise_trend_view ---------------------------------------------------
export interface EnterpriseTrendViewEvent extends CommercialEventBase {
  event: "enterprise_trend_view";
}

// -- enterprise_upsell_view --------------------------------------------------
export interface EnterpriseUpsellViewEvent extends CommercialEventBase {
  event: "enterprise_upsell_view";
}

// -- enterprise_upsell_click -------------------------------------------------
export interface EnterpriseUpsellClickEvent extends CommercialEventBase {
  event: "enterprise_upsell_click";
}

// -- admin_revenue_dashboard_view --------------------------------------------
export interface AdminRevenueDashboardViewEvent extends CommercialEventBase {
  event: "admin_revenue_dashboard_view";
}

// -- admin_revenue_metric_view -----------------------------------------------
export interface AdminRevenueMetricViewEvent extends CommercialEventBase {
  event: "admin_revenue_metric_view";
  metric: string;
}

// -- admin_revenue_growth_flag -----------------------------------------------
export interface AdminRevenueGrowthFlagEvent extends CommercialEventBase {
  event: "admin_revenue_growth_flag";
  growthPct: number;
}

// -- lead_email_submit ------------------------------------------------------
export interface LeadEmailSubmitEvent extends CommercialEventBase {
  event: "lead_email_submit";
  email: string;
  placement?: string;
}

// -- trial_start ------------------------------------------------------------
export interface TrialStartEvent extends CommercialEventBase {
  event: "trial_start";
  restaurant_id: string;
}

// -- Activation milestones (Activation Engine) -------------------------------
export interface FirstLoginEvent extends CommercialEventBase {
  event: "first_login";
  restaurant_id: string;
}

export interface FirstMenuCreatedEvent extends CommercialEventBase {
  event: "first_menu_created";
  restaurant_id: string;
}

export interface FirstShiftOpenedEvent extends CommercialEventBase {
  event: "first_shift_opened";
  restaurant_id: string;
  shift_id?: string;
}

export interface FirstPaymentReceivedEvent extends CommercialEventBase {
  event: "first_payment_received";
  restaurant_id: string;
  order_id: string;
  amount_cents?: number;
}

export interface ActivationAutomationTriggeredEvent
  extends CommercialEventBase {
  event: "activation_automation_triggered";
  restaurant_id: string;
  trigger: "activation_velocity_low";
  action_title: string;
  automation: string;
  velocity_score: number;
  classification: "Fast activators" | "Slow activators" | "Stalled";
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type CommercialEvent =
  | PageViewEvent
  | CtaWhatsAppClickEvent
  | CtaDemoClickEvent
  | PricingViewEvent
  | BannerImpressionEvent
  | BannerClickEvent
  | UpgradeClickEvent
  | ModuleInterestEvent
  | PricingToggleEvent
  | PricingConversionClickEvent
  | EnterpriseExportClickEvent
  | EnterprisePageViewEvent
  | EnterpriseDateChangeEvent
  | EnterpriseHeatmapToggleEvent
  | EnterpriseHeatmapDayClickEvent
  | EnterpriseBackendMissingEvent
  | EnterpriseRiskViewEvent
  | EnterpriseRiskHighEvent
  | EnterpriseTrendDetectedEvent
  | EnterpriseHealthBannerViewEvent
  | EnterpriseTrendViewEvent
  | EnterpriseUpsellViewEvent
  | EnterpriseUpsellClickEvent
  | AdminRevenueDashboardViewEvent
  | AdminRevenueMetricViewEvent
  | AdminRevenueGrowthFlagEvent
  | TrialStartedEvent
  | OnboardingCompletedEvent
  | FirstOrderCreatedEvent
  | LeadEmailSubmitEvent
  | TrialStartEvent
  | FirstLoginEvent
  | FirstMenuCreatedEvent
  | FirstShiftOpenedEvent
  | FirstPaymentReceivedEvent
  | ActivationAutomationTriggeredEvent;

// ---------------------------------------------------------------------------
// CRM Lead Payload
// ---------------------------------------------------------------------------

/**
 * Lead object built from commercial events — ready for future CRM push.
 */
export interface LeadPayload {
  /** ISO-8601 when the lead was generated */
  created_at: string;
  /** Email (for lead_email source) */
  email?: string;
  /** Country code */
  country: CountryCode;
  /** Segment at lead-capture time */
  segment: Segment;
  /** How the lead was captured */
  source: "whatsapp" | "demo_request" | "lead_email";
  /** Landing version string */
  landing_version: string;
  /** Device category */
  device: "mobile" | "tablet" | "desktop";
  /** Page path where conversion happened */
  conversion_path: string;
  /** Optional placement (for WhatsApp CTAs) */
  placement?: string;
  /** UTM source */
  utm_source?: string;
  /** UTM medium */
  utm_medium?: string;
  /** UTM campaign */
  utm_campaign?: string;
  /** User-agent raw string (for CRM enrichment) */
  user_agent: string;
  /** Referrer */
  referrer: string;
  /** Session event count (how many events before conversion) */
  session_event_count: number;
}
