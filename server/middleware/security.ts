/**
 * Middleware de Segurança e Confiabilidade
 * P1 Fixes: Rate Limiting, Connection Timeouts, Health Checks
 */

import { IncomingMessage, ServerResponse } from 'http';

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_REQUESTS = {
  global: 1000, // requests por IP
  auth: 10, // login attempts
  webhook: 100, // stripe webhooks
  api: 500, // API calls por IP
};

/**
 * Get IP from request (handles proxies)
 */
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limit middleware
 */
export function checkRateLimit(
  req: IncomingMessage,
  endpoint: 'auth' | 'webhook' | 'api' | 'global' = 'global'
): { allowed: boolean; remaining: number; resetIn: number } {
  const ip = getClientIp(req);
  const now = Date.now();
  const limit = RATE_LIMIT_REQUESTS[endpoint];

  let entry = rateLimitStore.get(ip);

  // Reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  entry.count++;

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  const resetIn = entry.resetTime - now;

  rateLimitStore.set(ip, entry);

  return { allowed, remaining, resetIn };
}

/**
 * Cleanup old entries (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
}

// Cleanup a cada 5 minutos
setInterval(cleanupRateLimits, 5 * 60 * 1000);

// ============================================================================
// CONNECTION POOL TIMEOUT
// ============================================================================

/**
 * Configure pool com timeouts
 */
export function configurePoolTimeouts(pool: any): void {
  // Idle connection timeout (15 minutos)
  pool.on('idle', (client: any) => {
    const query = client.query;
    const timeout = setTimeout(() => {
      console.error('Idle connection timeout, removing from pool');
      pool.remove(client);
    }, 15 * 60 * 1000);

    client.query = (...args: any[]) => {
      clearTimeout(timeout);
      return query.apply(client, args);
    };
  });

  // Query timeout (30 segundos)
  const originalQuery = pool.query.bind(pool);
  pool.query = async function (text: string, values?: any) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('QUERY_TIMEOUT: 30s exceeded'));
      }, 30 * 1000);

      originalQuery(text, values)
        .then((result: any) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'up' | 'down' | 'slow';
    api: 'up' | 'down';
    memory: {
      usage: number;
      limit: number;
    };
  };
  metrics?: {
    requestsPerSecond: number;
    avgLatencyMs: number;
    errors: number;
  };
}

const startTime = Date.now();
const metrics = {
  requests: 0,
  errors: 0,
  latencies: [] as number[],
};

export async function getHealthStatus(pool: any): Promise<HealthStatus> {
  const timestamp = new Date().toISOString();
  const uptime = Date.now() - startTime;

  let dbStatus: 'up' | 'down' | 'slow' = 'up';

  try {
    const startQuery = Date.now();
    await pool.query('SELECT 1');
    const queryTime = Date.now() - startQuery;

    if (queryTime > 1000) {
      dbStatus = 'slow';
    }
  } catch (e) {
    dbStatus = 'down';
  }

  const memUsage = process.memoryUsage();
  const rps = metrics.requests > 0 ? (metrics.requests * 1000) / uptime : 0;
  const avgLatency =
    metrics.latencies.length > 0
      ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
      : 0;

  const status =
    dbStatus === 'down' ? 'down' : dbStatus === 'slow' ? 'degraded' : 'ok';

  return {
    status,
    timestamp,
    version: '1.0.0',
    uptime,
    services: {
      database: dbStatus,
      api: 'up',
      memory: {
        usage: Math.round(memUsage.heapUsed / 1024 / 1024),
        limit: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
    },
    metrics: {
      requestsPerSecond: Math.round(rps * 100) / 100,
      avgLatencyMs: Math.round(avgLatency * 100) / 100,
      errors: metrics.errors,
    },
  };
}

/**
 * Track latency e erros
 */
export function trackMetrics(
  startTime: number,
  hasError: boolean = false
): void {
  const latency = Date.now() - startTime;
  metrics.requests++;
  metrics.latencies.push(latency);
  if (hasError) {
    metrics.errors++;
  }

  // Keep only last 1000 latencies
  if (metrics.latencies.length > 1000) {
    metrics.latencies.shift();
  }
}

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

export interface SafeRequest {
  method: string;
  path: string;
  headers: Record<string, any>;
  ip: string;
  rateLimit: {
    allowed: boolean;
    remaining: number;
    resetIn: number;
  };
  startTime: number;
}

/**
 * Wrap request com segurança
 */
export function wrapRequest(
  req: IncomingMessage,
  endpoint: 'auth' | 'webhook' | 'api' | 'global' = 'global'
): SafeRequest {
  const path = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  const rateLimit = checkRateLimit(req, endpoint);

  return {
    method: req.method || 'UNKNOWN',
    path,
    headers: req.headers,
    ip: getClientIp(req),
    rateLimit,
    startTime: Date.now(),
  };
}

// ============================================================================
// CIRCUIT BREAKER (para falhas em cadeia)
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttemptTime = 0;

  constructor(
    private name: string,
    private failureThreshold = 5,
    private successThreshold = 2,
    private timeout = 60 * 1000 // 1 minuto
  ) { }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(
          `Circuit breaker OPEN for ${this.name}. Retry after ${Math.ceil((this.nextAttemptTime - Date.now()) / 1000)}s`
        );
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log(`✅ Circuit breaker ${this.name} CLOSED`);
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.timeout;
      console.error(
        `🔴 Circuit breaker ${this.name} OPEN. Retry in ${Math.ceil(this.timeout / 1000)}s`
      );
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
    };
  }
}
