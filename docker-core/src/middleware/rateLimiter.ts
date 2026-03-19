/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse in production.
 *
 * Uses in-memory sliding window with configurable limits per route.
 * For production with multiple instances, replace with Redis-backed store.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyExtractor: (req: { ip?: string; headers: Record<string, string> }) => string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  maxRequests: 100,
  keyExtractor: (req) => req.ip || req.headers["x-forwarded-for"] || "unknown",
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function createRateLimiter(name: string, config: Partial<RateLimitConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const store = new Map<string, RateLimitEntry>();
  stores.set(name, store);

  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > cfg.windowMs * 2) {
        store.delete(key);
      }
    }
  }, 300_000);

  return function rateLimit(req: { ip?: string; headers: Record<string, string> }): {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
  } {
    const key = cfg.keyExtractor(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.windowStart > cfg.windowMs) {
      store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: cfg.maxRequests - 1, retryAfterMs: 0 };
    }

    entry.count++;

    if (entry.count > cfg.maxRequests) {
      const retryAfterMs = cfg.windowMs - (now - entry.windowStart);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    return { allowed: true, remaining: cfg.maxRequests - entry.count, retryAfterMs: 0 };
  };
}

// Pre-configured rate limiters
export const apiLimiter = createRateLimiter("api", {
  windowMs: 60_000,
  maxRequests: 100,
});

export const authLimiter = createRateLimiter("auth", {
  windowMs: 300_000, // 5 minutes
  maxRequests: 10, // 10 auth attempts per 5 min
});

export const webhookLimiter = createRateLimiter("webhook", {
  windowMs: 60_000,
  maxRequests: 50,
});

export const paymentLimiter = createRateLimiter("payment", {
  windowMs: 60_000,
  maxRequests: 20,
});
