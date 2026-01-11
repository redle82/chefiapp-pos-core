/**
 * ACTIVATION TRACKER & METRICS — UNIT TESTS
 * 
 * Phase 3C — Activation Feedback Loop
 * 
 * Tests:
 * - ActivationTracker event tracking
 * - Session deduplication
 * - ActivationMetrics aggregation
 * - Pure function behavior
 */

import {
    ActivationTracker,
    getActivationTracker,
    resetActivationTracker,
    type ActivationEvent
} from '../../../merchant-portal/src/core/activation/ActivationTracker';

import {
    aggregateActivationMetrics,
    formatCTR,
    formatTimeRange,
    getMetricsSummaryText,
    type ActivationMetricsSummary
} from '../../../merchant-portal/src/core/activation/ActivationMetrics';

// ═══════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
    getItem: jest.fn((key: string) => mockStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
    clear: jest.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); })
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock window.location
Object.defineProperty(global, 'window', {
    value: {
        location: { pathname: '/test' },
        dataLayer: []
    }
});

// Mock console.info to capture track calls
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});

beforeEach(() => {
    localStorageMock.clear();
    mockConsoleInfo.mockClear();
    resetActivationTracker();
});

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

const createMockEvent = (
    name: string,
    payload?: Record<string, unknown>,
    ts?: number
): { name: string; ts: number; payload?: Record<string, unknown> } => ({
    name,
    ts: ts || Date.now(),
    payload
});

const createActivationEvents = (): Array<{ name: string; ts: number; payload?: Record<string, unknown> }> => [
    createMockEvent('activation.panel_opened', { variant: 'compact', visibleCount: 3 }, 1000),
    createMockEvent('activation.recommendation_viewed', { recommendationId: 'rec-1', impact: 'high' }, 1001),
    createMockEvent('activation.recommendation_viewed', { recommendationId: 'rec-2', impact: 'medium' }, 1002),
    createMockEvent('activation.recommendation_viewed', { recommendationId: 'rec-3', impact: 'low' }, 1003),
    createMockEvent('activation.recommendation_clicked', { recommendationId: 'rec-1', impact: 'high', destination: '/settings' }, 1004),
    createMockEvent('activation.recommendation_clicked', { recommendationId: 'rec-1', impact: 'high', destination: '/settings' }, 1005),
    createMockEvent('activation.recommendation_dismissed', { recommendationId: 'rec-3', impact: 'low' }, 1006),
    createMockEvent('other.event', { foo: 'bar' }, 1007) // Should be ignored
];

// ═══════════════════════════════════════════════════════════════
// ACTIVATION TRACKER TESTS
// ═══════════════════════════════════════════════════════════════

describe('ActivationTracker', () => {
    
    describe('Instance Management', () => {
        test('getActivationTracker returns singleton', () => {
            const t1 = getActivationTracker();
            const t2 = getActivationTracker();
            expect(t1).toBe(t2);
        });

        test('resetActivationTracker clears session state', () => {
            const tracker = getActivationTracker();
            tracker.view('rec-1', 'high');
            tracker.openPanel('compact', 3);
            
            const statsBefore = tracker.getSessionStats();
            expect(statsBefore.viewedCount).toBe(1);
            expect(statsBefore.panelWasOpened).toBe(true);
            
            resetActivationTracker();
            
            const statsAfter = tracker.getSessionStats();
            expect(statsAfter.viewedCount).toBe(0);
            expect(statsAfter.panelWasOpened).toBe(false);
        });
    });

    describe('View Tracking', () => {
        test('tracks view event', () => {
            const tracker = new ActivationTracker();
            tracker.view('rec-1', 'high');
            
            expect(mockConsoleInfo).toHaveBeenCalledWith(
                '[analytics]',
                'activation.recommendation_viewed',
                expect.objectContaining({
                    name: 'activation.recommendation_viewed',
                    payload: { recommendationId: 'rec-1', impact: 'high' }
                })
            );
        });

        test('deduplicates views within session', () => {
            const tracker = new ActivationTracker();
            tracker.view('rec-1', 'high');
            tracker.view('rec-1', 'high'); // Duplicate
            tracker.view('rec-2', 'medium'); // Different
            
            expect(tracker.getSessionStats().viewedCount).toBe(2);
        });
    });

    describe('Click Tracking', () => {
        test('tracks click event with destination', () => {
            const tracker = new ActivationTracker();
            tracker.click('rec-1', 'high', '/settings/operations');
            
            expect(mockConsoleInfo).toHaveBeenCalledWith(
                '[analytics]',
                'activation.recommendation_clicked',
                expect.objectContaining({
                    payload: {
                        recommendationId: 'rec-1',
                        impact: 'high',
                        destination: '/settings/operations'
                    }
                })
            );
        });

        test('does NOT deduplicate clicks (always track)', () => {
            const tracker = new ActivationTracker();
            tracker.click('rec-1', 'high', '/settings');
            tracker.click('rec-1', 'high', '/settings');
            
            // Both clicks should be tracked
            expect(mockConsoleInfo).toHaveBeenCalledTimes(2);
        });
    });

    describe('Panel Tracking', () => {
        test('tracks panel open (deduplicated)', () => {
            const tracker = new ActivationTracker();
            tracker.openPanel('compact', 3);
            tracker.openPanel('compact', 3); // Should be ignored
            
            expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
            expect(tracker.getSessionStats().panelWasOpened).toBe(true);
        });

        test('tracks panel close', () => {
            const tracker = new ActivationTracker();
            tracker.openPanel('compact', 3);
            tracker.closePanel('compact');
            
            expect(mockConsoleInfo).toHaveBeenCalledWith(
                '[analytics]',
                'activation.panel_closed',
                expect.objectContaining({
                    payload: { variant: 'compact' }
                })
            );
        });
    });

    describe('Dismiss Tracking', () => {
        test('tracks dismiss event', () => {
            const tracker = new ActivationTracker();
            tracker.dismiss('rec-1', 'high');
            
            expect(mockConsoleInfo).toHaveBeenCalledWith(
                '[analytics]',
                'activation.recommendation_dismissed',
                expect.objectContaining({
                    payload: { recommendationId: 'rec-1', impact: 'high' }
                })
            );
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATION METRICS TESTS
// ═══════════════════════════════════════════════════════════════

describe('ActivationMetrics', () => {
    
    describe('aggregateActivationMetrics', () => {
        test('aggregates events correctly', () => {
            const events = createActivationEvents();
            const metrics = aggregateActivationMetrics(events as any);
            
            expect(metrics.panelOpens).toBe(1);
            expect(metrics.views).toBe(3);
            expect(metrics.clicks).toBe(2);
            expect(metrics.dismisses).toBe(1);
        });

        test('calculates click-through rate', () => {
            const events = createActivationEvents();
            const metrics = aggregateActivationMetrics(events as any);
            
            // 2 clicks / 3 views = 0.666...
            expect(metrics.clickThroughRate).toBeCloseTo(0.667, 2);
        });

        test('breaks down by impact level', () => {
            const events = createActivationEvents();
            const metrics = aggregateActivationMetrics(events as any);
            
            expect(metrics.byImpact.high).toEqual({ views: 1, clicks: 2 });
            expect(metrics.byImpact.medium).toEqual({ views: 1, clicks: 0 });
            expect(metrics.byImpact.low).toEqual({ views: 1, clicks: 0 });
        });

        test('tracks top clicked recommendations', () => {
            const events = createActivationEvents();
            const metrics = aggregateActivationMetrics(events as any);
            
            expect(metrics.topClicked).toHaveLength(1);
            expect(metrics.topClicked[0]).toEqual({ id: 'rec-1', clicks: 2 });
        });

        test('calculates time range', () => {
            const events = createActivationEvents();
            const metrics = aggregateActivationMetrics(events as any);
            
            expect(metrics.timeRange.earliest).toBe(1000);
            expect(metrics.timeRange.latest).toBe(1006); // Last activation event
        });

        test('ignores non-activation events', () => {
            const events = [
                createMockEvent('other.event', { foo: 'bar' }),
                createMockEvent('random.stuff', {})
            ];
            const metrics = aggregateActivationMetrics(events as any);
            
            expect(metrics.panelOpens).toBe(0);
            expect(metrics.views).toBe(0);
            expect(metrics.clicks).toBe(0);
        });

        test('handles empty events array', () => {
            const metrics = aggregateActivationMetrics([]);
            
            expect(metrics.panelOpens).toBe(0);
            expect(metrics.views).toBe(0);
            expect(metrics.clicks).toBe(0);
            expect(metrics.clickThroughRate).toBe(0);
            expect(metrics.timeRange.earliest).toBeNull();
            expect(metrics.timeRange.latest).toBeNull();
        });
    });

    describe('Formatting Utilities', () => {
        test('formatCTR formats as percentage', () => {
            expect(formatCTR(0)).toBe('0.0%');
            expect(formatCTR(0.5)).toBe('50.0%');
            expect(formatCTR(0.666)).toBe('66.6%');
            expect(formatCTR(1)).toBe('100.0%');
        });

        test('formatTimeRange handles null', () => {
            expect(formatTimeRange(null, null)).toBe('Sem dados');
        });

        test('formatTimeRange handles same day', () => {
            const now = Date.now();
            expect(formatTimeRange(now, now)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
        });

        test('getMetricsSummaryText handles zero views', () => {
            const metrics: ActivationMetricsSummary = {
                panelOpens: 0,
                views: 0,
                clicks: 0,
                dismisses: 0,
                clickThroughRate: 0,
                byImpact: {
                    high: { views: 0, clicks: 0 },
                    medium: { views: 0, clicks: 0 },
                    low: { views: 0, clicks: 0 }
                },
                topClicked: [],
                timeRange: { earliest: null, latest: null }
            };
            
            expect(getMetricsSummaryText(metrics)).toBe('Nenhuma recomendação visualizada ainda.');
        });

        test('getMetricsSummaryText formats summary', () => {
            const events = createActivationEvents();
            const metrics = aggregateActivationMetrics(events as any);
            const summary = getMetricsSummaryText(metrics);
            
            expect(summary).toContain('3 visualizações');
            expect(summary).toContain('2 cliques');
            expect(summary).toContain('CTR');
        });
    });

    describe('Pure Function Behavior', () => {
        test('same input produces same output', () => {
            const events = createActivationEvents();
            const metrics1 = aggregateActivationMetrics(events as any);
            const metrics2 = aggregateActivationMetrics(events as any);
            
            expect(metrics1).toEqual(metrics2);
        });

        test('does not mutate input', () => {
            const events = createActivationEvents();
            const eventsCopy = JSON.stringify(events);
            
            aggregateActivationMetrics(events as any);
            
            expect(JSON.stringify(events)).toBe(eventsCopy);
        });
    });
});
