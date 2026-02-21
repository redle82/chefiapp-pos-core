/**
 * ACTIVATION TRACKER
 * 
 * Tracks user interactions with activation recommendations.
 * 
 * Constitutional Principles:
 * - APPEND-ONLY: Never modifies or deletes past events
 * - USES EXISTING: Leverages track() from analytics/track.ts
 * - NO SIDE-EFFECTS: Pure event emission, no state mutations
 * - PRIVACY-FIRST: Only tracks aggregate behavior, no PII
 * 
 * Phase 3C — Activation Feedback Loop
 */

import { track } from '../../analytics/track';

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export type ActivationEventType = 
    | 'recommendation_viewed'
    | 'recommendation_clicked'
    | 'recommendation_dismissed'
    | 'panel_opened'
    | 'panel_closed';

export interface ActivationEvent {
    /** Event type */
    type: ActivationEventType;
    /** Recommendation ID (if applicable) */
    recommendationId?: string;
    /** Impact level of the recommendation */
    impact?: 'high' | 'medium' | 'low';
    /** Navigation target (if click) */
    destination?: string;
    /** Panel variant being used */
    variant?: 'full' | 'compact' | 'minimal';
    /** How many recommendations were shown */
    visibleCount?: number;
    /** Timestamp (auto-filled by track()) */
    timestamp?: number;
}

// ═══════════════════════════════════════════════════════════════
// TRACKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const ACTIVATION_EVENT_PREFIX = 'activation';

/**
 * Track when a recommendation is viewed (enters viewport)
 */
export function trackRecommendationViewed(
    recommendationId: string,
    impact: 'high' | 'medium' | 'low'
): void {
    track(`${ACTIVATION_EVENT_PREFIX}.recommendation_viewed`, {
        recommendationId,
        impact
    });
}

/**
 * Track when a recommendation CTA is clicked
 */
export function trackRecommendationClicked(
    recommendationId: string,
    impact: 'high' | 'medium' | 'low',
    destination: string
): void {
    track(`${ACTIVATION_EVENT_PREFIX}.recommendation_clicked`, {
        recommendationId,
        impact,
        destination
    });
}

/**
 * Track when a recommendation is dismissed
 */
export function trackRecommendationDismissed(
    recommendationId: string,
    impact: 'high' | 'medium' | 'low'
): void {
    track(`${ACTIVATION_EVENT_PREFIX}.recommendation_dismissed`, {
        recommendationId,
        impact
    });
}

/**
 * Track when the insights panel is opened/shown
 */
export function trackPanelOpened(
    variant: 'full' | 'compact' | 'minimal',
    visibleCount: number
): void {
    track(`${ACTIVATION_EVENT_PREFIX}.panel_opened`, {
        variant,
        visibleCount
    });
}

/**
 * Track when the insights panel is closed/hidden
 */
export function trackPanelClosed(
    variant: 'full' | 'compact' | 'minimal'
): void {
    track(`${ACTIVATION_EVENT_PREFIX}.panel_closed`, {
        variant
    });
}

// ═══════════════════════════════════════════════════════════════
// BATCH TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Track multiple recommendations viewed at once (panel render)
 */
export function trackRecommendationsBatch(
    recommendations: Array<{ id: string; impact: 'high' | 'medium' | 'low' }>,
    variant: 'full' | 'compact' | 'minimal'
): void {
    // Track panel open
    trackPanelOpened(variant, recommendations.length);
    
    // Track each visible recommendation
    recommendations.forEach(rec => {
        trackRecommendationViewed(rec.id, rec.impact);
    });
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATION TRACKER CLASS (Stateful wrapper for hooks)
// ═══════════════════════════════════════════════════════════════

/**
 * ActivationTracker — Stateful tracking manager
 * 
 * Maintains a session-level view of what was tracked to avoid
 * duplicate events within the same session.
 */
export class ActivationTracker {
    private viewedIds = new Set<string>();
    private panelOpened = false;

    /**
     * Track recommendation viewed (deduplicated per session)
     */
    view(recommendationId: string, impact: 'high' | 'medium' | 'low'): void {
        if (this.viewedIds.has(recommendationId)) {
            return; // Already tracked this session
        }
        this.viewedIds.add(recommendationId);
        trackRecommendationViewed(recommendationId, impact);
    }

    /**
     * Track recommendation clicked (always tracked)
     */
    click(
        recommendationId: string,
        impact: 'high' | 'medium' | 'low',
        destination: string
    ): void {
        trackRecommendationClicked(recommendationId, impact, destination);
    }

    /**
     * Track recommendation dismissed
     */
    dismiss(recommendationId: string, impact: 'high' | 'medium' | 'low'): void {
        trackRecommendationDismissed(recommendationId, impact);
    }

    /**
     * Track panel opened (deduplicated per session)
     */
    openPanel(variant: 'full' | 'compact' | 'minimal', count: number): void {
        if (this.panelOpened) {
            return; // Already tracked this session
        }
        this.panelOpened = true;
        trackPanelOpened(variant, count);
    }

    /**
     * Track panel closed
     */
    closePanel(variant: 'full' | 'compact' | 'minimal'): void {
        trackPanelClosed(variant);
        this.panelOpened = false;
    }

    /**
     * Reset session tracking (e.g., on navigation)
     */
    reset(): void {
        this.viewedIds.clear();
        this.panelOpened = false;
    }

    /**
     * Get session stats
     */
    getSessionStats(): { viewedCount: number; panelWasOpened: boolean } {
        return {
            viewedCount: this.viewedIds.size,
            panelWasOpened: this.panelOpened
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

let trackerInstance: ActivationTracker | null = null;

/**
 * Get the global ActivationTracker instance
 */
export function getActivationTracker(): ActivationTracker {
    if (!trackerInstance) {
        trackerInstance = new ActivationTracker();
    }
    return trackerInstance;
}

/**
 * Reset the global tracker (useful for testing)
 */
export function resetActivationTracker(): void {
    if (trackerInstance) {
        trackerInstance.reset();
    }
}
