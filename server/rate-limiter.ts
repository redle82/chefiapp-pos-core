/**
 * Pluggable rate-limiter for the integration-gateway.
 *
 * Two backends:
 *  - InMemoryRateLimiter  — default, zero deps, resets on process restart.
 *  - RedisRateLimiter     — durable across restarts, shared across instances.
 *                           Activated when REDIS_URL env var is set.
 *                           Requires `ioredis` package (pnpm add ioredis).
 *
 * Usage (integration-gateway.ts):
 *   import { createRateLimiter } from "./rate-limiter";
 *   const limiter = await createRateLimiter({ windowMs: 60_000, max: 100 });
 *   const result = await limiter.check("key");
 *   if (!result.ok) return 429;
 */

export interface RateLimitResult {
  ok: boolean;
  /** seconds until the window resets (only set when ok=false) */
  retryAfter?: number;
  /** current count in this window */
  count?: number;
}

export interface RateLimiterOptions {
  /** length of the sliding window in ms (default: 60 000) */
  windowMs?: number;
  /** max requests per window (default: 100) */
  max?: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
  /** Free resources (e.g. close Redis connection) */
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-memory backend (default)
// ---------------------------------------------------------------------------
interface Window {
  count: number;
  resetAt: number; // epoch ms
}

export class InMemoryRateLimiter implements RateLimiter {
  private map = new Map<string, Window>();
  private readonly windowMs: number;
  private readonly max: number;

  constructor(opts: RateLimiterOptions = {}) {
    this.windowMs = opts.windowMs ?? 60_000;
    this.max = opts.max ?? 100;
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    let win = this.map.get(key);
    if (!win || now >= win.resetAt) {
      win = { count: 0, resetAt: now + this.windowMs };
      this.map.set(key, win);
    }
    win.count++;
    if (win.count > this.max) {
      return {
        ok: false,
        retryAfter: Math.ceil((win.resetAt - now) / 1000),
        count: win.count,
      };
    }
    return { ok: true, count: win.count };
  }

  async close(): Promise<void> {
    this.map.clear();
  }
}

// ---------------------------------------------------------------------------
// Redis backend (optional — requires `ioredis`)
// ---------------------------------------------------------------------------
interface IoRedis {
  multi(): {
    incr(key: string): unknown;
    pexpire(key: string, ms: number): unknown;
    pttl(key: string): unknown;
    exec(): Promise<Array<[Error | null, unknown]>>;
  };
  quit(): Promise<unknown>;
}

export class RedisRateLimiter implements RateLimiter {
  private redis: IoRedis;
  private readonly windowMs: number;
  private readonly max: number;

  constructor(redis: IoRedis, opts: RateLimiterOptions = {}) {
    this.redis = redis;
    this.windowMs = opts.windowMs ?? 60_000;
    this.max = opts.max ?? 100;
  }

  async check(key: string): Promise<RateLimitResult> {
    const rKey = `rl:${key}`;
    const multi = this.redis.multi();
    multi.incr(rKey);
    multi.pexpire(rKey, this.windowMs);
    multi.pttl(rKey);
    const results = await multi.exec();

    const count = (results?.[0]?.[1] as number) ?? 1;
    const pttl = (results?.[2]?.[1] as number) ?? this.windowMs;

    if (count > this.max) {
      return {
        ok: false,
        retryAfter: Math.ceil(Math.max(pttl, 0) / 1000),
        count,
      };
    }
    return { ok: true, count };
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns a RedisRateLimiter if REDIS_URL is set AND ioredis is installed,
 * otherwise falls back to InMemoryRateLimiter (no-dep).
 */
export async function createRateLimiter(
  opts: RateLimiterOptions = {},
): Promise<RateLimiter> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    try {
      // Optional dep — not required. Install with: pnpm add ioredis
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const Redis = require("ioredis") as new (url: string) => IoRedis;
      const client = new Redis(redisUrl);
      return new RedisRateLimiter(client, opts);
    } catch {
      // ioredis not installed – fall through to in-memory
    }
  }
  return new InMemoryRateLimiter(opts);
}
