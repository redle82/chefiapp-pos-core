/**
 * TimeoutWrapper — Enforces maximum execution time on async operations.
 *
 * Provides configurable timeouts per service type with optional fallback values.
 */

export class TimeoutError extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly timeoutMs: number,
  ) {
    super(
      `Operation for "${serviceName}" timed out after ${timeoutMs}ms`,
    );
    this.name = "TimeoutError";
  }
}

/**
 * Predefined timeout defaults per service category.
 * These represent safe upper bounds for each integration type.
 */
export const SERVICE_TIMEOUTS = {
  payment: 15_000,
  database: 5_000,
  email: 10_000,
  print: 8_000,
  externalApi: 10_000,
  push: 5_000,
} as const;

export type ServiceType = keyof typeof SERVICE_TIMEOUTS;

/**
 * Wrap an async function with a timeout.
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Maximum time in ms before timing out
 * @param options - Optional configuration
 * @param options.serviceName - Name for error messages (default: "unknown")
 * @param options.fallback - Optional fallback value returned on timeout instead of throwing
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  options?: {
    serviceName?: string;
    fallback?: T;
  },
): Promise<T> {
  const serviceName = options?.serviceName ?? "unknown";

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;

      if (options && "fallback" in options && options.fallback !== undefined) {
        resolve(options.fallback);
      } else {
        reject(new TimeoutError(serviceName, timeoutMs));
      }
    }, timeoutMs);

    fn().then(
      (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Convenience: wrap with a timeout derived from a service type.
 *
 * @example
 * const result = await withServiceTimeout(
 *   () => stripe.createPayment(params),
 *   "payment",
 *   { serviceName: "stripe" },
 * );
 */
export function withServiceTimeout<T>(
  fn: () => Promise<T>,
  serviceType: ServiceType,
  options?: {
    serviceName?: string;
    fallback?: T;
  },
): Promise<T> {
  return withTimeout(fn, SERVICE_TIMEOUTS[serviceType], {
    serviceName: options?.serviceName ?? serviceType,
    fallback: options?.fallback,
  });
}
