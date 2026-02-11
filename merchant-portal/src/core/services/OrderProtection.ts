/**
 * WEB ORDER PROTECTION
 *
 * Client-side guards against:
 * 1. Duplicate orders (idempotency)
 * 2. Spam/flood attacks (rate limiting)
 *
 * @constitutional Defense layer for public order gateway.
 *
 * 🔴 NOTE: This is CLIENT-SIDE protection only.
 * Server-side rate limiting should be implemented via:
 * - Supabase Edge Functions with IP-based limits
 * - Or API Gateway (e.g., Cloudflare, Kong)
 */

import { getTabIsolated, setTabIsolated } from "../storage/TabIsolatedStorage";

// ─────────────────────────────────────────────────────────────────────────────
// IDEMPOTENCY: Prevent duplicate orders
// ─────────────────────────────────────────────────────────────────────────────

const IDEMPOTENCY_STORAGE_KEY = "chefiapp_order_idempotency";
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface IdempotencyRecord {
  key: string;
  timestamp: number;
  orderId?: string;
  requestId?: string;
}

/**
 * Generate idempotency key from order content
 * Same items + restaurant + table = same key
 */
export function generateIdempotencyKey(
  restaurantId: string,
  items: { product_id: string; quantity: number }[],
  tableNumber?: number,
): string {
  // Sort items for consistent hashing
  const sortedItems = [...items]
    .sort((a, b) => a.product_id.localeCompare(b.product_id))
    .map((i) => `${i.product_id}:${i.quantity}`)
    .join("|");

  const raw = `${restaurantId}:${tableNumber ?? "no-table"}:${sortedItems}`;

  // Simple hash (not cryptographic, just for dedup)
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `idem_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if an order with this key was recently submitted
 */
export function checkIdempotency(key: string): IdempotencyRecord | null {
  try {
    const stored = getTabIsolated(IDEMPOTENCY_STORAGE_KEY);
    if (!stored) return null;

    const records: IdempotencyRecord[] = JSON.parse(stored);
    const now = Date.now();

    // Find matching record that's not expired
    const match = records.find(
      (r) => r.key === key && now - r.timestamp < IDEMPOTENCY_TTL_MS,
    );

    return match || null;
  } catch {
    return null;
  }
}

/**
 * Record a submitted order for idempotency checking
 */
export function recordIdempotency(
  key: string,
  orderId?: string,
  requestId?: string,
): void {
  try {
    const stored = getTabIsolated(IDEMPOTENCY_STORAGE_KEY);
    let records: IdempotencyRecord[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();

    // Clean expired records
    records = records.filter((r) => now - r.timestamp < IDEMPOTENCY_TTL_MS);

    // Add new record
    records.push({
      key,
      timestamp: now,
      orderId,
      requestId,
    });

    // Keep max 20 records
    if (records.length > 20) {
      records = records.slice(-20);
    }

    setTabIsolated(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    console.warn("[OrderProtection] Failed to record idempotency");
  }
}

/**
 * Clear idempotency for a specific key (e.g., after successful delivery)
 */
export function clearIdempotency(key: string): void {
  try {
    const stored = getTabIsolated(IDEMPOTENCY_STORAGE_KEY);
    if (!stored) return;

    let records: IdempotencyRecord[] = JSON.parse(stored);
    records = records.filter((r) => r.key !== key);
    setTabIsolated(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING: Prevent spam/flood
// ─────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_STORAGE_KEY = "chefiapp_order_ratelimit";
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 orders per minute per client

interface RateLimitRecord {
  timestamps: number[];
}

/**
 * Check if client is rate limited
 * Returns remaining seconds if limited, 0 if OK
 */
export function checkRateLimit(restaurantId: string): number {
  try {
    const key = `${RATE_LIMIT_STORAGE_KEY}_${restaurantId}`;
    const stored = getTabIsolated(key);
    const now = Date.now();

    if (!stored) return 0;

    const record: RateLimitRecord = JSON.parse(stored);

    // Filter to only timestamps within window
    const recentTimestamps = record.timestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
    );

    if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      // Calculate when the oldest request will expire
      const oldestInWindow = Math.min(...recentTimestamps);
      const expiresAt = oldestInWindow + RATE_LIMIT_WINDOW_MS;
      const remainingMs = expiresAt - now;
      return Math.ceil(remainingMs / 1000);
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Record a request for rate limiting
 */
export function recordRateLimit(restaurantId: string): void {
  try {
    const key = `${RATE_LIMIT_STORAGE_KEY}_${restaurantId}`;
    const stored = getTabIsolated(key);
    const now = Date.now();

    const record: RateLimitRecord = stored
      ? JSON.parse(stored)
      : { timestamps: [] };

    // Clean old timestamps
    record.timestamps = record.timestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
    );

    // Add new timestamp
    record.timestamps.push(now);

    setTabIsolated(key, JSON.stringify(record));
  } catch {
    console.warn("[OrderProtection] Failed to record rate limit");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED CHECK
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderProtectionResult {
  allowed: boolean;
  reason?: "DUPLICATE" | "RATE_LIMITED";
  message?: string;
  existingOrderId?: string;
  existingRequestId?: string;
  retryAfterSeconds?: number;
}

/**
 * Combined protection check before submitting order
 */
export function checkOrderProtection(
  restaurantId: string,
  items: { product_id: string; quantity: number }[],
  tableNumber?: number,
): OrderProtectionResult {
  // 1. Check rate limit first
  const rateLimitSeconds = checkRateLimit(restaurantId);
  if (rateLimitSeconds > 0) {
    return {
      allowed: false,
      reason: "RATE_LIMITED",
      message: `Aguarde ${rateLimitSeconds}s antes de fazer outro pedido`,
      retryAfterSeconds: rateLimitSeconds,
    };
  }

  // 2. Check idempotency
  const idempotencyKey = generateIdempotencyKey(
    restaurantId,
    items,
    tableNumber,
  );
  const existing = checkIdempotency(idempotencyKey);

  if (existing) {
    return {
      allowed: false,
      reason: "DUPLICATE",
      message: "Este pedido já foi enviado. Verifique o status.",
      existingOrderId: existing.orderId,
      existingRequestId: existing.requestId,
    };
  }

  return { allowed: true };
}

/**
 * Record successful order submission
 */
export function recordOrderSubmission(
  restaurantId: string,
  items: { product_id: string; quantity: number }[],
  tableNumber?: number,
  orderId?: string,
  requestId?: string,
): void {
  // Record rate limit
  recordRateLimit(restaurantId);

  // Record idempotency
  const idempotencyKey = generateIdempotencyKey(
    restaurantId,
    items,
    tableNumber,
  );
  recordIdempotency(idempotencyKey, orderId, requestId);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE RATE LIMITING INTEGRATION (A4)
// ─────────────────────────────────────────────────────────────────────────────
// After A4 deployment, server enforces rate limiting via check_and_decrement_rate_limit RPC.
// Client handles 429 responses with intelligent backoff using retry_after header.

const SERVER_RATE_LIMIT_CACHE_KEY = "chefiapp_server_ratelimit_429";

interface ServerRateLimitInfo {
  endpoint: string;
  retryAfterSec: number;
  blockedUntil: number; // timestamp when retry is allowed
}

/**
 * Handle 429 Too Many Requests response from server
 * Extracts retry_after header and caches until retry is allowed
 */
export function handleServerRateLimit429(
  error: any,
  endpoint: string = "create_order",
): { retryAfterSeconds: number; blockedUntil: number } {
  let retryAfterSeconds = 60; // Default fallback

  // Try to extract from response
  if (error?.response?.status === 429) {
    // Check Retry-After header (can be in seconds or HTTP-date format)
    const retryAfter = error.response.headers?.["retry-after"];
    if (retryAfter) {
      // If numeric, treat as seconds
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed)) {
        retryAfterSeconds = Math.min(parsed, 300); // Cap at 5 minutes
      }
    }

    // Also check response body for retry_after
    if (error.response?.data?.retry_after) {
      retryAfterSeconds = Math.min(error.response.data.retry_after, 300);
    }
  }

  const blockedUntil = Date.now() + retryAfterSeconds * 1000;

  // Cache this rate limit info
  try {
    const cache: Record<string, ServerRateLimitInfo> = JSON.parse(
      getTabIsolated(SERVER_RATE_LIMIT_CACHE_KEY) || "{}",
    );

    cache[endpoint] = {
      endpoint,
      retryAfterSec: retryAfterSeconds,
      blockedUntil,
    };

    setTabIsolated(SERVER_RATE_LIMIT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }

  return { retryAfterSeconds, blockedUntil };
}

/**
 * Check if server rate limit is currently active for endpoint
 * Returns retry_after seconds if blocked, 0 if OK
 */
export function checkServerRateLimit(
  endpoint: string = "create_order",
): number {
  try {
    const cache: Record<string, ServerRateLimitInfo> = JSON.parse(
      getTabIsolated(SERVER_RATE_LIMIT_CACHE_KEY) || "{}",
    );

    const info = cache[endpoint];
    if (!info) return 0;

    const now = Date.now();
    if (now < info.blockedUntil) {
      return Math.ceil((info.blockedUntil - now) / 1000);
    }

    // Retry period expired, remove from cache
    delete cache[endpoint];
    setTabIsolated(SERVER_RATE_LIMIT_CACHE_KEY, JSON.stringify(cache));
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Retry handler for 429 responses
 * Implements exponential backoff with server's retry_after guidance
 */
export async function retryWithServerRateLimit<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  endpoint: string = "create_order",
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Check if server rate limit is active
    const serverBlockedSeconds = checkServerRateLimit(endpoint);
    if (serverBlockedSeconds > 0) {
      console.warn(
        `[OrderProtection] Server rate limit active: retry after ${serverBlockedSeconds}s`,
      );
      // Wait for server's guidance
      await sleep(serverBlockedSeconds * 1000 + 100);
    }

    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (error?.response?.status === 429) {
        const { retryAfterSeconds } = handleServerRateLimit429(error, endpoint);

        if (attempt < maxRetries - 1) {
          console.warn(
            `[OrderProtection] 429 Rate Limited: retry ${
              attempt + 1
            }/${maxRetries} after ${retryAfterSeconds}s`,
          );
          // Exponential backoff: retryAfterSeconds * 2^attempt
          const backoffMs = retryAfterSeconds * 1000 * Math.pow(2, attempt);
          await sleep(backoffMs);
        } else {
          // Last attempt, throw error
          throw error;
        }
      } else {
        // Not a rate limit error, throw immediately
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Sleep helper for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
