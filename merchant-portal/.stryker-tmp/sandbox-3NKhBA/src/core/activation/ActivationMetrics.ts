/**
 * ACTIVATION METRICS
 * 
 * Pure functions to aggregate activation tracking events into metrics.
 * 
 * Constitutional Principles:
 * - PURE: No side effects, deterministic output
 * - READS: From TabIsolatedStorage analytics queue
 * - AGGREGATES: Never modifies source data
 * 
 * Phase 3C — Activation Feedback Loop
 */
// @ts-nocheck


import { getTabIsolated } from '../storage/TabIsolatedStorage';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ActivationMetricsSummary {
    /** Total panel opens */
    panelOpens: number;
    /** Total recommendation views */
    views: number;
    /** Total recommendation clicks */
    clicks: number;
    /** Total recommendation dismisses */
    dismisses: number;
    /** Click-through rate (clicks / views) */
    clickThroughRate: number;
    /** Breakdown by impact level */
    byImpact: {
        high: { views: number; clicks: number };
        medium: { views: number; clicks: number };
        low: { views: number; clicks: number };
    };
    /** Most clicked recommendations */
    topClicked: Array<{ id: string; clicks: number }>;
    /** Time range of data */
    timeRange: {
        earliest: number | null;
        latest: number | null;
    };
}

export interface ActivationEvent {
    name: string;
    ts: number;
    payload?: {
        recommendationId?: string;
        impact?: 'high' | 'medium' | 'low';
        destination?: string;
        variant?: string;
        visibleCount?: number;
    };
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ANALYTICS_STORAGE_KEY = 'chefiapp_analytics_queue';
const ACTIVATION_EVENT_PREFIX = 'activation.';

// ═══════════════════════════════════════════════════════════════
// AGGREGATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Read analytics events from TabIsolatedStorage (skip null/undefined entries)
 */
function readAnalyticsQueue(): ActivationEvent[] {
    try {
        const raw = getTabIsolated(ANALYTICS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((e): e is ActivationEvent => e != null && typeof e === 'object' && typeof e.name === 'string');
    } catch {
        return [];
    }
}

/**
 * Filter events to activation events only (skip null/undefined/malformed entries)
 */
function filterActivationEvents(events: ActivationEvent[]): ActivationEvent[] {
    return events.filter(
        (e): e is ActivationEvent =>
            e != null && typeof e === 'object' && typeof e.name === 'string' && e.name.startsWith(ACTIVATION_EVENT_PREFIX)
    );
}

/**
 * Aggregate activation events into metrics summary
 * 
 * Pure function: same input → same output
 */
export function aggregateActivationMetrics(
    events: ActivationEvent[]
): ActivationMetricsSummary {
    const activationEvents = filterActivationEvents(events);

    // Initialize counters
    let panelOpens = 0;
    let views = 0;
    let clicks = 0;
    let dismisses = 0;
    
    const byImpact = {
        high: { views: 0, clicks: 0 },
        medium: { views: 0, clicks: 0 },
        low: { views: 0, clicks: 0 }
    };
    
    const clickCounts = new Map<string, number>();
    let earliest: number | null = null;
    let latest: number | null = null;

    // Process events (each event is valid per filterActivationEvents)
    for (const event of activationEvents) {
        if (event == null || typeof event !== 'object') continue;
        // Update time range
        if (earliest === null || event.ts < earliest) earliest = event.ts;
        if (latest === null || event.ts > latest) latest = event.ts;

        const eventType = event.name.replace(ACTIVATION_EVENT_PREFIX, '');
        const impact = event.payload?.impact;
        const recId = event.payload?.recommendationId;

        switch (eventType) {
            case 'panel_opened':
                panelOpens++;
                break;
                
            case 'recommendation_viewed':
                views++;
                if (impact && impact in byImpact) {
                    byImpact[impact].views++;
                }
                break;
                
            case 'recommendation_clicked':
                clicks++;
                if (impact && impact in byImpact) {
                    byImpact[impact].clicks++;
                }
                if (recId) {
                    clickCounts.set(recId, (clickCounts.get(recId) || 0) + 1);
                }
                break;
                
            case 'recommendation_dismissed':
                dismisses++;
                break;
        }
    }

    // Calculate click-through rate
    const clickThroughRate = views > 0 ? clicks / views : 0;

    // Get top clicked (sorted by count, top 5)
    const topClicked = Array.from(clickCounts.entries())
        .map(([id, count]) => ({ id, clicks: count }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

    return {
        panelOpens,
        views,
        clicks,
        dismisses,
        clickThroughRate,
        byImpact,
        topClicked,
        timeRange: { earliest, latest }
    };
}

/**
 * Get activation metrics from localStorage
 * 
 * Convenience function that reads from storage and aggregates
 */
export function getActivationMetrics(): ActivationMetricsSummary {
    const events = readAnalyticsQueue();
    return aggregateActivationMetrics(events);
}

/**
 * Get activation metrics for a specific time range
 */
export function getActivationMetricsInRange(
    startTs: number,
    endTs: number
): ActivationMetricsSummary {
    const events = readAnalyticsQueue()
        .filter(e => e.ts >= startTs && e.ts <= endTs);
    return aggregateActivationMetrics(events);
}

/**
 * Get activation metrics for the last N days
 */
export function getActivationMetricsLastDays(days: number): ActivationMetricsSummary {
    const now = Date.now();
    const startTs = now - (days * 24 * 60 * 60 * 1000);
    return getActivationMetricsInRange(startTs, now);
}

// ═══════════════════════════════════════════════════════════════
// FORMATTING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format click-through rate as percentage string
 */
export function formatCTR(ctr: number): string {
    return `${(ctr * 100).toFixed(1)}%`;
}

/**
 * Format time range as human-readable string
 */
export function formatTimeRange(
    earliest: number | null,
    latest: number | null
): string {
    if (!earliest || !latest) return 'Sem dados';
    
    const start = new Date(earliest).toLocaleDateString('pt-BR');
    const end = new Date(latest).toLocaleDateString('pt-BR');
    
    if (start === end) return start;
    return `${start} - ${end}`;
}

/**
 * Get a human-readable summary string
 */
export function getMetricsSummaryText(metrics: ActivationMetricsSummary): string {
    if (metrics.views === 0) {
        return 'Nenhuma recomendação visualizada ainda.';
    }
    
    const ctr = formatCTR(metrics.clickThroughRate);
    const highPriority = metrics.byImpact.high;
    
    return `${metrics.views} visualizações, ${metrics.clicks} cliques (${ctr} CTR). ` +
           `Alta prioridade: ${highPriority.clicks}/${highPriority.views} convertidas.`;
}
