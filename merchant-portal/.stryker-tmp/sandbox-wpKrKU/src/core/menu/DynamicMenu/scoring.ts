/**
 * DYNAMIC MENU SCORING ENGINE
 * 
 * Calculates intelligent product scores based on:
 * - Time match (historical orders at this hour)
 * - Recent frequency (last 7 days)
 * - Click recency (exponential decay)
 * - Favorite bonus (manual pins)
 */

import type { ProductDynamics, ScoreWeights, ScoreComponents, TimeSlot } from './types';

const DEFAULT_WEIGHTS: ScoreWeights = {
    time_match: 0.4,
    recent_frequency: 0.3,
    click_recency: 0.2,
    favorite_bonus: 0.1
};

/**
 * Fallback scores for products with no historical data.
 * Categorized by time slot and product category.
 */
const FALLBACK_SCORES: Record<TimeSlot, Record<string, number>> = {
    morning: {
        quentes: 90,      // Coffee, tea
        sucos: 70,        // Juices
        agua: 50,         // Water
        refrigerantes: 30
    },
    lunch: {
        comida: 90,       // Food categories get priority
        vinhos: 60,
        agua: 70,
        refrigerantes: 50,
        cervejas: 40
    },
    afternoon: {
        quentes: 60,
        refrigerantes: 50,
        agua: 40
    },
    night: {
        cervejas: 90,
        destilados: 80,
        vinhos: 70,
        refrigerantes: 40,
        agua: 30
    }
};

/**
 * Determine current time slot
 */
export function getCurrentTimeSlot(hour: number): TimeSlot {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'lunch';
    if (hour >= 17 && hour < 20) return 'afternoon';
    return 'night';
}

/**
 * Calculate time match score (0-100)
 * Based on historical orders at current hour ± 1
 */
function timeMatchScore(dynamics: ProductDynamics, currentHour: number): number {
    const hourKey = currentHour.toString().padStart(2, '0');
    const prevHourKey = ((currentHour - 1 + 24) % 24).toString().padStart(2, '0');
    const nextHourKey = ((currentHour + 1) % 24).toString().padStart(2, '0');

    const currentHourOrders = dynamics.hour_stats[hourKey] || 0;
    const adjacentOrders =
        ((dynamics.hour_stats[prevHourKey] || 0) * 0.5) +
        ((dynamics.hour_stats[nextHourKey] || 0) * 0.5);

    const totalOrders = Object.values(dynamics.hour_stats).reduce((sum, count) => sum + count, 0);

    if (totalOrders === 0) {
        // No history: use fallback
        return 0; // Fallback handled separately
    }

    const relevantOrders = currentHourOrders + adjacentOrders;
    return (relevantOrders / totalOrders) * 100;
}

/**
 * Calculate recent frequency score (0-100)
 * Based on order count in last 7 days
 */
function recentFrequencyScore(dynamics: ProductDynamics): number {
    // Each order in last 7 days contributes 10 points, max 100
    return Math.min(dynamics.recent_order_count * 10, 100);
}

/**
 * Calculate click recency score (0-100)
 * Exponential decay: 100 at 0min, 50 at 30min, ~0 at 2hr
 */
function clickRecencyScore(dynamics: ProductDynamics): number {
    if (!dynamics.last_clicked_at) return 0;

    const clickedAt = new Date(dynamics.last_clicked_at).getTime();
    const now = Date.now();
    const minutesAgo = (now - clickedAt) / 60000;

    // Exponential decay with 30-minute half-life
    return Math.max(0, 100 * Math.exp(-minutesAgo / 30));
}

/**
 * Favorite bonus (0-100)
 */
function favoriteBonus(dynamics: ProductDynamics): number {
    return dynamics.is_favorite ? 100 : 0;
}

/**
 * Get fallback score for product with no history
 */
function getFallbackScore(productCategory: string, hour: number): number {
    const timeSlot = getCurrentTimeSlot(hour);
    const categoryScores = FALLBACK_SCORES[timeSlot];

    // Try exact category match
    if (categoryScores[productCategory]) {
        return categoryScores[productCategory];
    }

    // Try partial match (e.g., "cafe" matches "quentes")
    const categoryLower = productCategory.toLowerCase();
    for (const [key, score] of Object.entries(categoryScores)) {
        if (categoryLower.includes(key) || key.includes(categoryLower)) {
            return score;
        }
    }

    // Default fallback
    return 20;
}

/**
 * Calculate complete dynamic score for a product
 */
export function calculateDynamicScore(
    dynamics: ProductDynamics,
    productCategory: string,
    currentHour: number,
    weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoreComponents {
    const timeMatch = timeMatchScore(dynamics, currentHour);
    const recentFreq = recentFrequencyScore(dynamics);
    const clickRecency = clickRecencyScore(dynamics);
    const favBonus = favoriteBonus(dynamics);

    // If no historical data, use fallback for time_match component
    const effectiveTimeMatch = timeMatch > 0
        ? timeMatch
        : getFallbackScore(productCategory, currentHour);

    const finalScore =
        (effectiveTimeMatch * weights.time_match) +
        (recentFreq * weights.recent_frequency) +
        (clickRecency * weights.click_recency) +
        (favBonus * weights.favorite_bonus);

    return {
        time_match: effectiveTimeMatch,
        recent_frequency: recentFreq,
        click_recency: clickRecency,
        favorite_bonus: favBonus,
        final_score: Math.round(finalScore * 100) / 100
    };
}

/**
 * Batch calculate scores for multiple products
 */
export function calculateBatchScores(
    dynamicsList: ProductDynamics[],
    productCategories: Map<string, string>,
    currentHour: number,
    weights?: ScoreWeights
): Map<string, number> {
    const scores = new Map<string, number>();

    for (const dynamics of dynamicsList) {
        const category = productCategories.get(dynamics.product_id) || '';
        const result = calculateDynamicScore(dynamics, category, currentHour, weights);
        scores.set(dynamics.product_id, result.final_score);
    }

    return scores;
}
