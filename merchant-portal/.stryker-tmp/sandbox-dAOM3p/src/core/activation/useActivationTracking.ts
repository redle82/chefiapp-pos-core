/**
 * USE ACTIVATION TRACKING
 * 
 * React hook that provides tracking capabilities for activation recommendations.
 * 
 * Constitutional Principles:
 * - READS recommendations from useActivationAdvisor
 * - WRITES events via ActivationTracker (append-only)
 * - NO STATE MUTATIONS on recommendations
 * - Session-scoped deduplication
 * 
 * Phase 3C — Activation Feedback Loop
 */
// @ts-nocheck


import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getActivationTracker,
    type ActivationTracker 
} from './ActivationTracker';
import type { ActivationRecommendation } from './ActivationAdvisor';

// ═══════════════════════════════════════════════════════════════
// HOOK RETURN TYPE
// ═══════════════════════════════════════════════════════════════

export interface UseActivationTrackingResult {
    /** Track that the panel was opened with recommendations */
    trackPanelOpen: (variant: 'full' | 'compact' | 'minimal', count: number) => void;
    
    /** Track that the panel was closed */
    trackPanelClose: (variant: 'full' | 'compact' | 'minimal') => void;
    
    /** Track that a recommendation was viewed */
    trackView: (recommendation: ActivationRecommendation) => void;
    
    /** Track that a recommendation CTA was clicked (and navigate) */
    trackClick: (recommendation: ActivationRecommendation) => void;
    
    /** Track that a recommendation was dismissed */
    trackDismiss: (recommendation: ActivationRecommendation) => void;
    
    /** Get current session stats */
    getStats: () => { viewedCount: number; panelWasOpened: boolean };
    
    /** The underlying tracker instance */
    tracker: ActivationTracker;
}

// ═══════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

/**
 * useActivationTracking — Provides tracking callbacks for InsightsPanel
 * 
 * Usage:
 * ```tsx
 * const { trackClick, trackView } = useActivationTracking();
 * 
 * <ActivationInsightsPanel
 *   recommendations={recs}
 *   onRecommendationClick={trackClick}
 *   onRecommendationView={trackView}
 * />
 * ```
 */
export function useActivationTracking(): UseActivationTrackingResult {
    const navigate = useNavigate();
    const trackerRef = useRef<ActivationTracker>(getActivationTracker());

    // Track panel open (deduplicated)
    const trackPanelOpen = useCallback((
        variant: 'full' | 'compact' | 'minimal',
        count: number
    ) => {
        trackerRef.current.openPanel(variant, count);
    }, []);

    // Track panel close
    const trackPanelClose = useCallback((
        variant: 'full' | 'compact' | 'minimal'
    ) => {
        trackerRef.current.closePanel(variant);
    }, []);

    // Track recommendation viewed
    const trackView = useCallback((recommendation: ActivationRecommendation) => {
        trackerRef.current.view(recommendation.id, recommendation.impact);
    }, []);

    // Track recommendation clicked AND navigate
    const trackClick = useCallback((recommendation: ActivationRecommendation) => {
        if (!recommendation.action?.to) {
            console.warn('[useActivationTracking] Click without action.to:', recommendation.id);
            return;
        }
        
        // Track the click
        trackerRef.current.click(
            recommendation.id,
            recommendation.impact,
            recommendation.action.to
        );
        
        // Navigate (constitutional: safe route only)
        navigate(recommendation.action.to);
    }, [navigate]);

    // Track recommendation dismissed
    const trackDismiss = useCallback((recommendation: ActivationRecommendation) => {
        trackerRef.current.dismiss(recommendation.id, recommendation.impact);
    }, []);

    // Get session stats
    const getStats = useCallback(() => {
        return trackerRef.current.getSessionStats();
    }, []);

    return {
        trackPanelOpen,
        trackPanelClose,
        trackView,
        trackClick,
        trackDismiss,
        getStats,
        tracker: trackerRef.current
    };
}

// ═══════════════════════════════════════════════════════════════
// AUTO-TRACKING HOOK (for simpler integration)
// ═══════════════════════════════════════════════════════════════

export interface UseAutoTrackingOptions {
    recommendations: ActivationRecommendation[];
    variant: 'full' | 'compact' | 'minimal';
    enabled?: boolean;
}

/**
 * useAutoActivationTracking — Automatically tracks panel open on mount
 * 
 * Use this when you want automatic tracking without manual callbacks.
 * 
 * Usage:
 * ```tsx
 * const tracking = useAutoActivationTracking({
 *   recommendations,
 *   variant: 'compact',
 *   enabled: isReady
 * });
 * 
 * <button onClick={() => tracking.trackClick(rec)}>
 *   {rec.action.label}
 * </button>
 * ```
 */
export function useAutoActivationTracking(options: UseAutoTrackingOptions): UseActivationTrackingResult {
    const { recommendations, variant, enabled = true } = options;
    const tracking = useActivationTracking();
    const hasTrackedOpen = useRef(false);

    // Auto-track panel open when recommendations become available
    useEffect(() => {
        if (!enabled || hasTrackedOpen.current || recommendations.length === 0) {
            return;
        }
        
        hasTrackedOpen.current = true;
        tracking.trackPanelOpen(variant, recommendations.length);
        
        // Track visible recommendations
        recommendations.forEach(rec => {
            tracking.trackView(rec);
        });
    }, [enabled, recommendations, variant, tracking]);

    // Reset on unmount
    useEffect(() => {
        return () => {
            hasTrackedOpen.current = false;
        };
    }, []);

    return tracking;
}
