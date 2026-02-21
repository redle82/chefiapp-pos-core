/**
 * ACTIVATION MODULE INDEX
 * 
 * Phase 3B — Activation Intelligence
 * Phase 3C — Activation Feedback Loop
 * 
 * Exports:
 * - ActivationAdvisor: Pure recommendation engine
 * - useActivationAdvisor: React hook (read-only)
 * - ActivationTracker: Event tracking for feedback loop
 * - useActivationTracking: React hook for tracking
 * - Types: ActivationRecommendation, OnboardingAnswers, etc.
 */
// @ts-nocheck


// Engine
export {
    ActivationAdvisor,
    getActivationRecommendations,
    type ActivationRecommendation,
    type ActivationImpact,
    type OnboardingAnswers,
    type ActivationAdvisorInput
} from './ActivationAdvisor';

// Hook (read-only recommendations)
export {
    useActivationAdvisor,
    getRecommendationsFromStorage,
    type UseActivationAdvisorResult
} from './useActivationAdvisor';

// Tracking (Phase 3C)
export {
    ActivationTracker,
    getActivationTracker,
    resetActivationTracker,
    trackRecommendationViewed,
    trackRecommendationClicked,
    trackRecommendationDismissed,
    trackPanelOpened,
    trackPanelClosed,
    trackRecommendationsBatch,
    type ActivationEventType,
    type ActivationEvent
} from './ActivationTracker';

// Tracking Hook (Phase 3C)
export {
    useActivationTracking,
    useAutoActivationTracking,
    type UseActivationTrackingResult,
    type UseAutoTrackingOptions
} from './useActivationTracking';

// Metrics (Phase 3C)
export {
    aggregateActivationMetrics,
    getActivationMetrics,
    getActivationMetricsInRange,
    getActivationMetricsLastDays,
    formatCTR,
    formatTimeRange,
    getMetricsSummaryText,
    type ActivationMetricsSummary
} from './ActivationMetrics';

// Guard
export { RequireActivation } from './RequireActivation';
