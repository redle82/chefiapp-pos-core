/**
 * Retry Strategy with Exponential Backoff + Jitter
 *
 * Base delay: 1s
 * Max delay: 5min
 * Jitter: 10%
 */
// @ts-nocheck


export const MIN_DELAY_MS = 1000;

export const MAX_DELAY_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_RETRIES = 10;

export function calculateNextRetry(attempts: number): number {
    // Exponential: 1s, 2s, 4s, 8s, 16s...
    const exponentialDelay = MIN_DELAY_MS * Math.pow(2, attempts);

    // Cap at MAX_DELAY
    const cappedDelay = Math.min(exponentialDelay, MAX_DELAY_MS);

    // Jitter: +/- 10% to prevent Thundering Herd
    const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);

    return Math.floor(cappedDelay + jitter);
}
