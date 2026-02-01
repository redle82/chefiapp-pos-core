/**
 * Unit tests for Amazon PA API score calculation
 */

import { calculateScore, parsePrice } from '../pa-api-client';

describe('calculateScore', () => {
    it('should calculate score with rating and reviews', () => {
        const score = calculateScore(4.5, 100, false);
        expect(score).toBeGreaterThan(0);
        // rating (4.5) * reviews_weight (~20) = ~90
        expect(score).toBeCloseTo(90, 0);
    });

    it('should add prime bonus', () => {
        const scoreWithPrime = calculateScore(4.5, 100, true);
        const scoreWithoutPrime = calculateScore(4.5, 100, false);
        expect(scoreWithPrime).toBe(scoreWithoutPrime + 10);
    });

    it('should handle zero reviews', () => {
        const score = calculateScore(5.0, 0, false);
        expect(score).toBe(0);
    });

    it('should handle missing rating', () => {
        const score = calculateScore(undefined, 50, false);
        expect(score).toBe(0);
    });

    it('should cap reviews weight', () => {
        const scoreHighReviews = calculateScore(5.0, 100000, false);
        const scoreVeryHighReviews = calculateScore(5.0, 1000000, false);
        // Should be similar due to cap
        expect(Math.abs(scoreHighReviews - scoreVeryHighReviews)).toBeLessThan(10);
    });
});

describe('parsePrice', () => {
    it('should parse EUR price', () => {
        const cents = parsePrice('€129.99');
        expect(cents).toBe(12999);
    });

    it('should parse USD price', () => {
        const cents = parsePrice('$99.50');
        expect(cents).toBe(9950);
    });

    it('should handle prices with commas', () => {
        const cents = parsePrice('€1,299.99');
        expect(cents).toBe(129999);
    });

    it('should return null for invalid format', () => {
        const cents = parsePrice('N/A');
        expect(cents).toBeNull();
    });
});

