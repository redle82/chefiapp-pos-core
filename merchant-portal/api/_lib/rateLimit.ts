/**
 * In-memory Rate Limiter for Vercel Functions
 *
 * Provides per-endpoint rate limits with IP-based identification.
 *
 * Note: Each serverless function instance has its own memory, so
 * this rate limiter resets when the instance is recycled. For strict
 * enforcement, use a Redis-backed solution (e.g. @upstash/ratelimit).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSecs: number;
}

/**
 * Pre-defined tiers for common endpoint categories.
 *
 * - auth:     Login / signup / password reset (10 req/min)
 * - payment:  Stripe charges, refunds (30 req/min)
 * - general:  Standard CRUD APIs (100 req/min)
 * - webhook:  Incoming webhooks from third parties (1000 req/min)
 */
export type RateLimitTier = "auth" | "payment" | "general" | "webhook";

interface TierConfig {
  maxRequests: number;
  windowSecs: number;
}

const TIER_CONFIGS: Record<RateLimitTier, TierConfig> = {
  auth: { maxRequests: 10, windowSecs: 60 },
  payment: { maxRequests: 30, windowSecs: 60 },
  general: { maxRequests: 100, windowSecs: 60 },
  webhook: { maxRequests: 1000, windowSecs: 60 },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const store = new Map<string, RateLimitEntry>();

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------

/**
 * Check if a request should be rate-limited.
 *
 * @param key        Unique identifier (e.g. "auth:192.168.1.1")
 * @param maxRequests Maximum requests allowed in the window
 * @param windowSecs  Window duration in seconds
 * @returns           Object with allowed flag and remaining requests
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSecs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowSecs * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt, retryAfterSecs: 0 };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfterSecs = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfterSecs };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfterSecs: 0,
  };
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

/**
 * Extract the client IP from the request, using common proxy headers.
 * Falls back to "unknown" when the IP cannot be determined.
 */
export function getClientIp(req: VercelRequest): string {
  // Vercel sets x-forwarded-for; take the first (leftmost = original client)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      .split(",")[0]
      .trim();
    if (first) return first;
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// High-level middleware helper
// ---------------------------------------------------------------------------

/**
 * Apply rate limiting to a Vercel API handler.
 *
 * Usage:
 * ```ts
 * export default async function handler(req, res) {
 *   if (applyRateLimit(req, res, "auth")) return; // 429 already sent
 *   // ... handle request
 * }
 * ```
 *
 * @returns `true` if the request was rate-limited (response already sent).
 */
export function applyRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  tier: RateLimitTier,
): boolean {
  const config = TIER_CONFIGS[tier];
  const ip = getClientIp(req);
  const key = `${tier}:${ip}`;

  const result = checkRateLimit(key, config.maxRequests, config.windowSecs);

  // Always set rate-limit informational headers
  res.setHeader("X-RateLimit-Limit", config.maxRequests);
  res.setHeader("X-RateLimit-Remaining", result.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

  if (!result.allowed) {
    res.setHeader("Retry-After", result.retryAfterSecs);
    res.status(429).json({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${result.retryAfterSecs} seconds.`,
      retryAfter: result.retryAfterSecs,
    });
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

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
