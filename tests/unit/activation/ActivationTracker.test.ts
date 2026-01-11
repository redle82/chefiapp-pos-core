/**
 * 🧪 ACTIVATION TRACKER — UNIT TESTS
 * 
 * Tests the tracking system for activation recommendations.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    ActivationTracker,
    getActivationTracker,
    resetActivationTracker,
    trackRecommendationViewed,
    trackRecommendationClicked,
    trackRecommendationDismissed,
    trackPanelOpened,
    trackPanelClosed,
    trackRecommendationsBatch,
} from '../../../merchant-portal/src/core/activation/ActivationTracker';

// Mock the track function
const mockTrack = jest.fn();
jest.mock('../../../merchant-portal/src/analytics/track', () => ({
    track: (...args: any[]) => mockTrack(...args),
}));

describe('ActivationTracker', () => {
    beforeEach(() => {
        mockTrack.mockClear();
        resetActivationTracker();
    });

    describe('trackRecommendationViewed', () => {
        it('should call track with correct event name and payload', () => {
            trackRecommendationViewed('rec-123', 'high');
            
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_viewed',
                {
                    recommendationId: 'rec-123',
                    impact: 'high',
                }
            );
        });

        it('should handle different impact levels', () => {
            trackRecommendationViewed('rec-456', 'medium');
            trackRecommendationViewed('rec-789', 'low');
            
            expect(mockTrack).toHaveBeenCalledTimes(2);
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_viewed',
                expect.objectContaining({ impact: 'medium' })
            );
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_viewed',
                expect.objectContaining({ impact: 'low' })
            );
        });
    });

    describe('trackRecommendationClicked', () => {
        it('should call track with correct event name and payload', () => {
            trackRecommendationClicked('rec-123', 'high', '/settings/payments');
            
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_clicked',
                {
                    recommendationId: 'rec-123',
                    impact: 'high',
                    destination: '/settings/payments',
                }
            );
        });

        it('should track destination correctly', () => {
            trackRecommendationClicked('rec-456', 'medium', '/settings/team');
            
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_clicked',
                expect.objectContaining({
                    destination: '/settings/team',
                })
            );
        });
    });

    describe('trackRecommendationDismissed', () => {
        it('should call track with correct event name and payload', () => {
            trackRecommendationDismissed('rec-123', 'high');
            
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_dismissed',
                {
                    recommendationId: 'rec-123',
                    impact: 'high',
                }
            );
        });
    });

    describe('trackPanelOpened', () => {
        it('should call track with correct event name and payload', () => {
            trackPanelOpened('full', 5);
            
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.panel_opened',
                {
                    variant: 'full',
                    visibleCount: 5,
                }
            );
        });

        it('should handle different variants', () => {
            trackPanelOpened('compact', 3);
            trackPanelOpened('minimal', 1);
            
            expect(mockTrack).toHaveBeenCalledTimes(2);
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.panel_opened',
                expect.objectContaining({ variant: 'compact' })
            );
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.panel_opened',
                expect.objectContaining({ variant: 'minimal' })
            );
        });
    });

    describe('trackPanelClosed', () => {
        it('should call track with correct event name and payload', () => {
            trackPanelClosed('full');
            
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.panel_closed',
                {
                    variant: 'full',
                }
            );
        });
    });

    describe('trackRecommendationsBatch', () => {
        it('should track panel opened and all recommendations', () => {
            const recommendations = [
                { id: 'rec-1', impact: 'high' as const },
                { id: 'rec-2', impact: 'medium' as const },
                { id: 'rec-3', impact: 'low' as const },
            ];

            trackRecommendationsBatch(recommendations, 'full');
            
            // Should track panel opened once
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.panel_opened',
                expect.objectContaining({ visibleCount: 3 })
            );
            
            // Should track each recommendation viewed
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_viewed',
                expect.objectContaining({ recommendationId: 'rec-1' })
            );
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_viewed',
                expect.objectContaining({ recommendationId: 'rec-2' })
            );
            expect(mockTrack).toHaveBeenCalledWith(
                'activation.recommendation_viewed',
                expect.objectContaining({ recommendationId: 'rec-3' })
            );
            
            // Total: 1 panel open + 3 views = 4 calls
            expect(mockTrack).toHaveBeenCalledTimes(4);
        });
    });

    describe('ActivationTracker class', () => {
        let tracker: ActivationTracker;

        beforeEach(() => {
            tracker = new ActivationTracker();
            mockTrack.mockClear();
        });

        describe('view', () => {
            it('should track recommendation viewed', () => {
                tracker.view('rec-123', 'high');
                
                expect(mockTrack).toHaveBeenCalledWith(
                    'activation.recommendation_viewed',
                    expect.objectContaining({ recommendationId: 'rec-123' })
                );
            });

            it('should deduplicate views per session', () => {
                tracker.view('rec-123', 'high');
                tracker.view('rec-123', 'high');
                tracker.view('rec-123', 'medium'); // Different impact, but same ID
                
                // Should only track once
                expect(mockTrack).toHaveBeenCalledTimes(1);
            });

            it('should track different recommendations separately', () => {
                tracker.view('rec-1', 'high');
                tracker.view('rec-2', 'medium');
                tracker.view('rec-3', 'low');
                
                expect(mockTrack).toHaveBeenCalledTimes(3);
            });
        });

        describe('click', () => {
            it('should always track clicks (no deduplication)', () => {
                tracker.click('rec-123', 'high', '/settings/payments');
                tracker.click('rec-123', 'high', '/settings/payments');
                
                expect(mockTrack).toHaveBeenCalledTimes(2);
            });

            it('should track destination correctly', () => {
                tracker.click('rec-456', 'medium', '/settings/team');
                
                expect(mockTrack).toHaveBeenCalledWith(
                    'activation.recommendation_clicked',
                    expect.objectContaining({
                        destination: '/settings/team',
                    })
                );
            });
        });

        describe('dismiss', () => {
            it('should track dismissal', () => {
                tracker.dismiss('rec-123', 'high');
                
                expect(mockTrack).toHaveBeenCalledWith(
                    'activation.recommendation_dismissed',
                    expect.objectContaining({ recommendationId: 'rec-123' })
                );
            });
        });

        describe('openPanel', () => {
            it('should track panel opened', () => {
                tracker.openPanel('full', 5);
                
                expect(mockTrack).toHaveBeenCalledWith(
                    'activation.panel_opened',
                    expect.objectContaining({ visibleCount: 5 })
                );
            });

            it('should deduplicate panel opens per session', () => {
                tracker.openPanel('full', 5);
                tracker.openPanel('full', 3);
                tracker.openPanel('compact', 2);
                
                // Should only track once
                expect(mockTrack).toHaveBeenCalledTimes(1);
            });
        });

        describe('closePanel', () => {
            it('should track panel closed', () => {
                tracker.closePanel('full');
                
                expect(mockTrack).toHaveBeenCalledWith(
                    'activation.panel_closed',
                    expect.objectContaining({ variant: 'full' })
                );
            });

            it('should reset panel opened state', () => {
                tracker.openPanel('full', 5);
                tracker.closePanel('full');
                
                // After close, should be able to open again
                tracker.openPanel('full', 3);
                expect(mockTrack).toHaveBeenCalledTimes(3); // open, close, open again
            });
        });

        describe('reset', () => {
            it('should clear viewed IDs and panel state', () => {
                tracker.view('rec-1', 'high');
                tracker.view('rec-2', 'medium');
                tracker.openPanel('full', 2);
                
                tracker.reset();
                
                // After reset, should be able to view and open again
                tracker.view('rec-1', 'high');
                tracker.openPanel('full', 1);
                
                // Should track again (not deduplicated)
                // reset() doesn't call track, so: 2 views + 1 open + 1 view + 1 open = 5
                expect(mockTrack).toHaveBeenCalledTimes(5);
            });
        });

        describe('getSessionStats', () => {
            it('should return correct session stats', () => {
                tracker.view('rec-1', 'high');
                tracker.view('rec-2', 'medium');
                tracker.openPanel('full', 2);
                
                const stats = tracker.getSessionStats();
                
                expect(stats.viewedCount).toBe(2);
                expect(stats.panelWasOpened).toBe(true);
            });

            it('should return zero stats for new tracker', () => {
                const stats = tracker.getSessionStats();
                
                expect(stats.viewedCount).toBe(0);
                expect(stats.panelWasOpened).toBe(false);
            });
        });
    });

    describe('Singleton functions', () => {
        beforeEach(() => {
            resetActivationTracker();
        });

        it('getActivationTracker should return same instance', () => {
            const tracker1 = getActivationTracker();
            const tracker2 = getActivationTracker();
            
            expect(tracker1).toBe(tracker2);
        });

        it('resetActivationTracker should reset singleton', () => {
            const tracker1 = getActivationTracker();
            tracker1.view('rec-123', 'high');
            
            resetActivationTracker();
            
            const tracker2 = getActivationTracker();
            const stats = tracker2.getSessionStats();
            
            expect(stats.viewedCount).toBe(0);
        });
    });
});
