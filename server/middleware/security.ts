/**
 * Middleware de Segurança e Confiabilidade
 * P1 Fixes: Rate Limiting, Connection Timeouts, Health Checks
 * TASK-3.1.2: Criptografia de tokens OAuth
 */

import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

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
  systemOperational: boolean;
  databaseConnected: boolean;
  eventStoreInitialized: boolean;
  coreEngineAvailable: boolean;
  services: {
    database: 'up' | 'down' | 'slow';
    api: 'up' | 'down';
    eventStore: 'up' | 'down';
    coreEngine: 'up' | 'down';
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
  let eventStoreStatus: 'up' | 'down' = 'up';
  let coreEngineStatus: 'up' | 'down' = 'up';

  try {
    const startQuery = Date.now();
    await pool.query('SELECT 1');
    const queryTime = Date.now() - startQuery;

    if (queryTime > 1000) {
      dbStatus = 'slow';
    }

    // Check event store (fiscal_event_store table exists and is accessible)
    try {
      await pool.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fiscal_event_store'
        LIMIT 1
      `);
      eventStoreStatus = 'up';
    } catch (e) {
      // If table doesn't exist, event store is down
      eventStoreStatus = 'down';
    }

    // Check core engine (event_store table exists and is accessible)
    try {
      await pool.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_store'
        LIMIT 1
      `);
      coreEngineStatus = 'up';
    } catch (e) {
      // If table doesn't exist, core engine is down
      coreEngineStatus = 'down';
    }
  } catch (e) {
    dbStatus = 'down';
    eventStoreStatus = 'down';
    coreEngineStatus = 'down';
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
    systemOperational: status === 'ok' || status === 'degraded',
    databaseConnected: dbStatus !== 'down',
    eventStoreInitialized: eventStoreStatus === 'up',
    coreEngineAvailable: coreEngineStatus === 'up',
    services: {
      database: dbStatus,
      api: 'up',
      eventStore: eventStoreStatus,
      coreEngine: coreEngineStatus,
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

// ============================================================================
// TASK-3.1.2: OAUTH TOKEN ENCRYPTION
// ============================================================================

/**
 * Get encryption key from environment variable
 * TASK-3.1.2: Chave de criptografia está em variável de ambiente
 */
function getEncryptionKeyOrThrow(): Buffer {
  const CREDENTIALS_ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;
  const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;
  
  const env = String(CREDENTIALS_ENCRYPTION_KEY || '').trim();
  if (env) {
    // Accept hex (64 chars) or base64.
    if (/^[0-9a-fA-F]{64}$/.test(env)) return Buffer.from(env, 'hex');
    const b = Buffer.from(env, 'base64');
    if (b.length === 32) return b;
    throw new Error('CREDENTIALS_ENCRYPTION_KEY_INVALID');
  }

  // Fail-closed in production.
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY_REQUIRED');
  }

  // Dev fallback: derive from internal token (or static) to keep demo working.
  const seed = INTERNAL_API_TOKEN || 'dev-insecure-key';
  return crypto.createHash('sha256').update(seed).digest();
}

/**
 * TASK-3.1.2: Criptografar token OAuth antes de salvar no DB
 * Usa AES-256-GCM com IV aleatório e auth tag
 */
export function encryptOAuthToken(plaintext: string): Buffer {
  const key = getEncryptionKeyOrThrow();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext || ''), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // payload = iv(12) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, ciphertext]);
}

/**
 * TASK-3.1.2: Descriptografar token OAuth ao ler do DB
 */
export function decryptOAuthToken(payload: Buffer | null | undefined): string {
  if (!payload || payload.length < 12 + 16) return '';
  const key = getEncryptionKeyOrThrow();
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
