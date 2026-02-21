/**
 * ACTIVATION INSIGHTS PANEL
 * 
 * Presentational component that renders activation recommendations.
 * 
 * Constitutional Principle:
 * - Pure presentation — NO state mutations
 * - CTAs use React Router Link only (navigation, not activation)
 * - Never bypasses ToolBoundary
 * - Tracking callbacks are optional (append-only)
 * 
 * Phase 3B — Activation Intelligence
 * Phase 3C — Activation Feedback Loop (tracking props)
 */
// @ts-nocheck


import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { ActivationRecommendation, ActivationImpact } from '../../core/activation/ActivationAdvisor';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ActivationInsightsPanelProps {
    /** Recommendations to display */
    recommendations: ActivationRecommendation[];
    /** Maximum recommendations to show (default: all) */
    limit?: number;
    /** Display mode */
    variant?: 'full' | 'compact' | 'minimal';
    /** Whether to show the header */
    showHeader?: boolean;
    /** Custom title */
    title?: string;
    /** Whether to group by impact level */
    groupByImpact?: boolean;
    /** Callback when a recommendation is clicked (optional) */
    onRecommendationClick?: (recommendation: ActivationRecommendation) => void;
    /** Callback when a recommendation is viewed — for tracking (optional) */
    onRecommendationView?: (recommendation: ActivationRecommendation) => void;
    /** Callback when panel is mounted — for tracking (optional) */
    onPanelMount?: (variant: 'full' | 'compact' | 'minimal', count: number) => void;
}

// ═══════════════════════════════════════════════════════════════
// STYLING
// ═══════════════════════════════════════════════════════════════

const impactStyles: Record<ActivationImpact, {
    bg: string;
    border: string;
    badge: string;
    icon: string;
}> = {
    high: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        icon: '⚡'
    },
    medium: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: '📊'
    },
    low: {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-700',
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        icon: '💡'
    }
};

const impactLabels: Record<ActivationImpact, string> = {
    high: 'Alto Impacto',
    medium: 'Médio Impacto',
    low: 'Dica'
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ActivationInsightsPanel({
    recommendations,
    limit,
    variant = 'full',
    showHeader = true,
    title = 'Recomendações para seu negócio',
    groupByImpact = false,
    onRecommendationClick,
    onRecommendationView,
    onPanelMount
}: ActivationInsightsPanelProps): React.ReactElement | null {
    const hasMounted = useRef(false);

    // Guard: No recommendations
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    // Apply limit
    const displayRecs = limit ? recommendations.slice(0, limit) : recommendations;

    // Track panel mount (once)
    useEffect(() => {
        if (hasMounted.current || displayRecs.length === 0) return;
        hasMounted.current = true;
        
        // Notify panel mounted
        onPanelMount?.(variant, displayRecs.length);
        
        // Notify each visible recommendation
        displayRecs.forEach(rec => {
            onRecommendationView?.(rec);
        });
    }, [displayRecs, variant, onPanelMount, onRecommendationView]);

    // Group by impact if requested
    if (groupByImpact) {
        return (
            <GroupedRecommendations
                recommendations={displayRecs}
                variant={variant}
                showHeader={showHeader}
                title={title}
                onRecommendationClick={onRecommendationClick}
            />
        );
    }

    return (
        <div className="activation-insights-panel">
            {showHeader && variant !== 'minimal' && (
                <PanelHeader title={title} count={displayRecs.length} />
            )}
            <div className={`
                ${variant === 'full' ? 'space-y-3' : ''}
                ${variant === 'compact' ? 'space-y-2' : ''}
                ${variant === 'minimal' ? 'space-y-1' : ''}
            `}>
                {displayRecs.map((rec) => (
                    <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        variant={variant}
                        onClick={onRecommendationClick}
                    />
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function PanelHeader({ title, count }: { title: string; count: number }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
            </h3>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                {count} {count === 1 ? 'recomendação' : 'recomendações'}
            </span>
        </div>
    );
}

function RecommendationCard({
    recommendation,
    variant,
    onClick
}: {
    recommendation: ActivationRecommendation;
    variant: 'full' | 'compact' | 'minimal';
    onClick?: (rec: ActivationRecommendation) => void;
}) {
    const styles = impactStyles[recommendation.impact];

    // Minimal variant
    if (variant === 'minimal') {
        return (
            <div 
                className={`flex items-center gap-2 px-3 py-2 rounded ${styles.bg}`}
                onClick={() => onClick?.(recommendation)}
            >
                <span>{styles.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {recommendation.title}
                </span>
            </div>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        return (
            <div 
                className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
                onClick={() => onClick?.(recommendation)}
            >
                <div className="flex items-start gap-3">
                    <span className="text-xl">{styles.icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {recommendation.title}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${styles.badge}`}>
                                {impactLabels[recommendation.impact]}
                            </span>
                        </div>
                        {recommendation.action && (
                            <ActionButton action={recommendation.action} compact />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Full variant
    return (
        <div 
            className={`p-4 rounded-xl border ${styles.bg} ${styles.border} transition-shadow hover:shadow-md`}
            onClick={() => onClick?.(recommendation)}
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm">
                    <span className="text-2xl">{styles.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            {recommendation.title}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles.badge}`}>
                            {impactLabels[recommendation.impact]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {recommendation.reason}
                    </p>
                    {recommendation.tags && recommendation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {recommendation.tags.map((tag) => (
                                <span 
                                    key={tag}
                                    className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    {recommendation.action && (
                        <ActionButton action={recommendation.action} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionButton({ 
    action, 
    compact = false 
}: { 
    action: { label: string; to: string };
    compact?: boolean;
}) {
    return (
        <Link
            to={action.to}
            className={`
                inline-flex items-center gap-1.5
                ${compact ? 'text-xs mt-1' : 'text-sm'}
                font-medium text-brand-600 hover:text-brand-700
                dark:text-brand-400 dark:hover:text-brand-300
                transition-colors
            `}
        >
            {action.label}
            <svg 
                className={compact ? 'w-3 h-3' : 'w-4 h-4'} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                />
            </svg>
        </Link>
    );
}

function GroupedRecommendations({
    recommendations,
    variant,
    showHeader,
    title,
    onRecommendationClick
}: {
    recommendations: ActivationRecommendation[];
    variant: 'full' | 'compact' | 'minimal';
    showHeader: boolean;
    title: string;
    onRecommendationClick?: (rec: ActivationRecommendation) => void;
}) {
    const grouped = {
        high: recommendations.filter(r => r.impact === 'high'),
        medium: recommendations.filter(r => r.impact === 'medium'),
        low: recommendations.filter(r => r.impact === 'low')
    };

    return (
        <div className="activation-insights-panel">
            {showHeader && variant !== 'minimal' && (
                <PanelHeader title={title} count={recommendations.length} />
            )}
            
            {grouped.high.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                        <span>⚡</span> Alto Impacto
                    </h4>
                    <div className="space-y-2">
                        {grouped.high.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                variant={variant}
                                onClick={onRecommendationClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {grouped.medium.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1">
                        <span>📊</span> Médio Impacto
                    </h4>
                    <div className="space-y-2">
                        {grouped.medium.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                variant={variant}
                                onClick={onRecommendationClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {grouped.low.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <span>💡</span> Dicas
                    </h4>
                    <div className="space-y-2">
                        {grouped.low.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                variant={variant}
                                onClick={onRecommendationClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default ActivationInsightsPanel;
