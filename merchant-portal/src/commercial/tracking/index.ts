/**
 * Commercial Tracking — Public API barrel.
 */

// Types
export type {
  CommercialEvent,
  CommercialEventBase,
  CommercialEventName,
  CtaDemoClickEvent,
  CtaWhatsAppClickEvent,
  LeadPayload,
  PageViewEvent,
  PricingViewEvent,
} from "./types";

// Service
export {
  commercialTracking,
  type TrackingProvider,
} from "./CommercialTrackingService";

// Funnel baseline
export {
  buildCommercialFunnelSnapshotCsv,
  computeActivationIntelligenceInsights,
  computeActivationRecommendedActions,
  computeCommercialFunnelMetrics,
  computeCommercialFunnelSegmentation,
  type ActivationClassification,
  type ActivationDropoffStep,
  type ActivationIntelligenceInsights,
  type ActivationRecommendedAction,
  type CommercialFunnelMetrics,
  type CommercialFunnelSegmentation,
} from "./funnelMetrics";

// Hook
export { useCommercialTracking } from "./useCommercialTracking";

// Lead
export {
  buildLeadPayload,
  captureLeadPayload,
  clearBufferedLeads,
  getBufferedLeads,
} from "./buildLeadPayload";

// Flag
export {
  isActivationAutomationDispatchEnabled,
  isActivationAutomationEnabled,
  isCommercialTrackingEnabled,
} from "./flag";

// Device
export { detectDevice } from "./detectDevice";

// Lead scoring
export { getLeadScore, isLeadHot, resetLeadScore } from "./leadScoring";
