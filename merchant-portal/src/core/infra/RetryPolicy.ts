/**
 * RetryPolicy — Generic retry with exponential backoff and jitter.
 *
 * Only retries on retriable errors (network failures, 5xx, timeouts).
 * Supports AbortSignal for cancellation.
 */

import { Logger } from "../logger";

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms before first retry (default: 1000) */
  baseDelayMs?: number;
  /** Multiplier applied to delay on each subsequent retry (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay in ms between retries (default: 30000) */
  maxDelayMs?: number;
  /** AbortSignal to cancel the retry loop */
  signal?: AbortSignal;
  /** Label for log messages */
  label?: string;
  /** Custom predicate to determine if an error is retriable */
  isRetriable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "signal" | "isRetriable">> = {
  maxRetries: 3,
  baseDelayMs: 1_000,
  backoffMultiplier: 2,
  maxDelayMs: 30_000,
  label: "unknown",
};

/**
 * Determines whether an error is retriable.
 *
 * Retriable: network errors, timeouts, 5xx HTTP responses.
 * NOT retriable: 4xx client errors, validation errors, auth errors.
 */
export function isRetriable(error: unknown): boolean {
  if (error === null || error === undefined) return false;

  // AbortError — user cancelled, never retry
  if (error instanceof DOMException && error.name === "AbortError") return false;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket hang up") ||
      message.includes("dns")
    ) {
      return true;
    }

    // Timeout errors
    if (message.includes("timeout") || message.includes("timed out")) {
      return true;
    }

    // Explicit non-retriable markers
    if (
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("not found") ||
      message.includes("bad request") ||
      message.includes("validation")
    ) {
      return false;
    }
  }

  // Check HTTP-like status codes on error objects
  const statusCode = (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.code;
  if (typeof statusCode === "number") {
    // 4xx are not retriable, 5xx are retriable, 429 (rate limit) is retriable
    if (statusCode === 429) return true;
    if (statusCode >= 400 && statusCode < 500) return false;
    if (statusCode >= 500) return true;
  }

  // Default: assume retriable for unknown errors (safer for resilience)
  return true;
}

/**
 * Execute a function with automatic retries on retriable failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const retriableCheck = options?.isRetriable ?? isRetriable;

  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // Check cancellation before each attempt
    if (opts.signal?.aborted) {
      throw new DOMException("Retry aborted", "AbortError");
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt >= opts.maxRetries) break;

      // Don't retry non-retriable errors
      if (!retriableCheck(error)) {
        Logger.warn(`[RetryPolicy:${opts.label}] Non-retriable error on attempt ${attempt + 1}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        break;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt);
      const cappedDelay = Math.min(exponentialDelay, opts.maxDelayMs);
      // Jitter: random value between 0 and cappedDelay to spread load
      const jitter = Math.random() * cappedDelay * 0.25;
      const delay = Math.floor(cappedDelay + jitter);

      Logger.warn(
        `[RetryPolicy:${opts.label}] Attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${delay}ms`,
        { error: error instanceof Error ? error.message : String(error) },
      );

      // Wait with cancellation support
      await sleep(delay, opts.signal);
    }
  }

  throw lastError;
}

/**
 * Sleep that respects AbortSignal.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Retry aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Retry aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
