/**
 * ResilientProvider — Factory that wraps any async service call with
 * CircuitBreaker + RetryPolicy + Timeout in a composable way.
 *
 * Usage:
 *   const resilient = createResilientProvider("stripe", {
 *     circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30_000 },
 *     retry: { maxRetries: 3, baseDelayMs: 1_000 },
 *     timeoutMs: 15_000,
 *   });
 *
 *   const result = await resilient.execute(() => stripe.createPayment(params));
 */

import {
  CircuitBreaker,
  getCircuitBreaker,
  type CircuitBreakerConfig,
} from "./CircuitBreaker";
import { withRetry, type RetryOptions } from "./RetryPolicy";
import { withTimeout, type ServiceType, SERVICE_TIMEOUTS } from "./TimeoutWrapper";

export interface ResilientProviderConfig {
  /** Circuit breaker settings. Set to false to disable. */
  circuitBreaker?:
    | Omit<CircuitBreakerConfig, "name">
    | false;
  /** Retry policy settings. Set to false to disable. */
  retry?: Omit<RetryOptions, "label"> | false;
  /** Timeout in ms. Can be a number or a service type string. Set to false to disable. */
  timeoutMs?: number | ServiceType | false;
}

export interface ResilientProvider {
  /** Execute a function through all configured resilience layers */
  execute<T>(fn: () => Promise<T>): Promise<T>;
  /** Get the circuit breaker instance (if enabled) */
  getCircuitBreaker(): CircuitBreaker | null;
  /** The provider name */
  readonly name: string;
}

/**
 * Create a resilient wrapper for a named service.
 *
 * Execution order (outermost to innermost):
 *   CircuitBreaker -> Retry -> Timeout -> actual call
 *
 * This means:
 * 1. Circuit breaker rejects immediately if service is known to be down
 * 2. Retry policy re-attempts on retriable failures
 * 3. Each individual attempt is time-bounded
 */
export function createResilientProvider(
  name: string,
  config: ResilientProviderConfig,
): ResilientProvider {
  // Resolve timeout
  const resolvedTimeout =
    config.timeoutMs === false
      ? null
      : typeof config.timeoutMs === "string"
        ? SERVICE_TIMEOUTS[config.timeoutMs]
        : config.timeoutMs ?? null;

  // Resolve circuit breaker
  const cb =
    config.circuitBreaker === false
      ? null
      : getCircuitBreaker({
          name,
          ...(config.circuitBreaker ?? {}),
        });

  // Resolve retry options
  const retryOpts =
    config.retry === false
      ? null
      : { label: name, ...(config.retry ?? {}) };

  return {
    name,

    async execute<T>(fn: () => Promise<T>): Promise<T> {
      // Build the call chain from innermost to outermost

      // Layer 1 (innermost): Timeout
      const timedFn = resolvedTimeout
        ? () => withTimeout(fn, resolvedTimeout, { serviceName: name })
        : fn;

      // Layer 2: Retry
      const retriedFn = retryOpts
        ? () => withRetry(timedFn, retryOpts)
        : timedFn;

      // Layer 3 (outermost): Circuit Breaker
      if (cb) {
        return cb.execute(retriedFn);
      }

      return retriedFn();
    },

    getCircuitBreaker() {
      return cb;
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-configured resilient providers for known services
// ---------------------------------------------------------------------------

/** Stripe: circuit breaker (5 failures/30s) + retry (3x exponential) + timeout (15s) */
export const stripeResilient = createResilientProvider("stripe", {
  circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 30_000 },
  retry: { maxRetries: 3, baseDelayMs: 1_000, backoffMultiplier: 2 },
  timeoutMs: "payment",
});

/** Stripe read-only: no circuit breaker + retry (3x) + timeout (15s) */
export const stripeReadResilient = createResilientProvider("stripe-read", {
  circuitBreaker: false,
  retry: { maxRetries: 3, baseDelayMs: 500 },
  timeoutMs: "payment",
});

/** Supabase: no circuit breaker + retry (3x linear 1s) + timeout (5s) */
export const supabaseResilient = createResilientProvider("supabase", {
  circuitBreaker: false,
  retry: { maxRetries: 3, baseDelayMs: 1_000, backoffMultiplier: 1 },
  timeoutMs: "database",
});

/** MB Way: circuit breaker (3 failures/60s) + no retry + timeout (10s) */
export const mbwayResilient = createResilientProvider("mbway", {
  circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 60_000 },
  retry: false,
  timeoutMs: "externalApi",
});

/** Email: retry (2x) + timeout (10s), no circuit breaker */
export const emailResilient = createResilientProvider("email", {
  circuitBreaker: false,
  retry: { maxRetries: 2, baseDelayMs: 1_000 },
  timeoutMs: "email",
});

/** ESC/POS printing: timeout (8s), no retry, no circuit breaker */
export const printResilient = createResilientProvider("print", {
  circuitBreaker: false,
  retry: false,
  timeoutMs: "print",
});

/** Push notifications: fire-and-forget, timeout (5s) */
export const pushResilient = createResilientProvider("push", {
  circuitBreaker: false,
  retry: false,
  timeoutMs: "push",
});
