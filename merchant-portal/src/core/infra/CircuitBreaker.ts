/**
 * CircuitBreaker — Prevents cascading failures by short-circuiting calls
 * to services that are consistently failing.
 *
 * States:
 *  - CLOSED: Normal operation, calls pass through
 *  - OPEN: Service is failing, calls are rejected immediately
 *  - HALF_OPEN: Testing if service has recovered (limited calls allowed)
 */

import { Logger } from "../logger";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  /** Name for logging and identification */
  name: string;
  /** Number of consecutive failures before opening the circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms before attempting recovery from OPEN state (default: 30000) */
  resetTimeoutMs?: number;
  /** Number of test requests allowed in HALF_OPEN state (default: 1) */
  halfOpenRequests?: number;
  /** Optional callback when circuit opens */
  onOpen?: (name: string) => void;
  /** Optional callback when circuit closes (recovery) */
  onClose?: (name: string) => void;
  /** Optional callback when circuit enters half-open */
  onHalfOpen?: (name: string) => void;
}

export class CircuitBreakerError extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly state: CircuitBreakerState,
  ) {
    super(
      `Circuit breaker is ${state} for service "${serviceName}". Calls are being rejected to prevent cascading failure.`,
    );
    this.name = "CircuitBreakerError";
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private halfOpenSuccesses = 0;
  private totalCalls = 0;
  private totalFailures = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenRequests: number;

  readonly name: string;

  constructor(private readonly config: CircuitBreakerConfig) {
    this.name = config.name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 30_000;
    this.halfOpenRequests = config.halfOpenRequests ?? 1;
  }

  /**
   * Execute an async function through the circuit breaker.
   * Rejects immediately if the circuit is OPEN (unless reset timeout has elapsed).
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.transitionTo("HALF_OPEN");
      } else {
        throw new CircuitBreakerError(this.name, this.state);
      }
    }

    if (this.state === "HALF_OPEN" && this.halfOpenSuccesses >= this.halfOpenRequests) {
      // Already have enough test requests in flight, reject additional ones
      throw new CircuitBreakerError(this.name, this.state);
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

  /** Current state of the circuit breaker */
  getState(): CircuitBreakerState {
    // Check if we should auto-transition from OPEN to HALF_OPEN
    if (this.state === "OPEN" && this.shouldAttemptReset()) {
      this.transitionTo("HALF_OPEN");
    }
    return this.state;
  }

  /** Snapshot of internal metrics for health checks and monitoring */
  getMetrics(): {
    state: CircuitBreakerState;
    consecutiveFailures: number;
    totalCalls: number;
    totalFailures: number;
    lastFailureTime: number;
  } {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /** Force-reset the circuit breaker to CLOSED state */
  reset(): void {
    this.consecutiveFailures = 0;
    this.halfOpenSuccesses = 0;
    this.transitionTo("CLOSED");
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenRequests) {
        // Recovery confirmed
        this.consecutiveFailures = 0;
        this.halfOpenSuccesses = 0;
        this.transitionTo("CLOSED");
      }
    } else {
      // CLOSED state — reset consecutive failures
      this.consecutiveFailures = 0;
    }
  }

  private onFailure(): void {
    this.consecutiveFailures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      // Recovery failed, go back to OPEN
      this.halfOpenSuccesses = 0;
      this.transitionTo("OPEN");
    } else if (this.consecutiveFailures >= this.failureThreshold) {
      this.transitionTo("OPEN");
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.resetTimeoutMs;
  }

  private transitionTo(newState: CircuitBreakerState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;

    Logger.info(`[CircuitBreaker:${this.name}] ${oldState} -> ${newState}`);

    switch (newState) {
      case "OPEN":
        this.config.onOpen?.(this.name);
        break;
      case "CLOSED":
        this.config.onClose?.(this.name);
        break;
      case "HALF_OPEN":
        this.halfOpenSuccesses = 0;
        this.config.onHalfOpen?.(this.name);
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Registry — singleton instances per service name
// ---------------------------------------------------------------------------

const registry = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a service.
 * Reuses existing instances so state is preserved across calls.
 */
export function getCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  const existing = registry.get(config.name);
  if (existing) return existing;

  const cb = new CircuitBreaker(config);
  registry.set(config.name, cb);
  return cb;
}

/**
 * Get all registered circuit breakers (for health check / monitoring).
 */
export function getAllCircuitBreakers(): ReadonlyMap<string, CircuitBreaker> {
  return registry;
}

/**
 * Clear the registry (useful for testing).
 */
export function clearCircuitBreakerRegistry(): void {
  registry.clear();
}
