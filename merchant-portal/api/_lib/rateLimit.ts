/**
 * In-memory Rate Limiter for Vercel Functions
 *
 * Note: Each serverless function instance has its own memory, so
 * this rate limiter resets when the instance is recycled. For strict
 * enforcement, use a Redis-backed solution.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate-limited.
 *
 * @param key        Unique identifier (e.g. restaurant_id, IP)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowSecs  Window duration in seconds
 * @returns           Object with allowed flag and remaining requests
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSecs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowSecs * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Periodically evict expired entries to prevent memory leaks. */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  },
  5 * 60 * 1000,
);
