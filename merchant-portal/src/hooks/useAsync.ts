/**
 * useAsync — Generic hook for tracking async operation loading/error state.
 *
 * Phase 3 P0 Issue #4: Loading states — all async buttons show loading state,
 * disabled during request.
 *
 * Usage:
 * ```tsx
 * const { execute, loading } = useAsync(async (data) => {
 *   await api.saveLocation(data);
 * });
 *
 * <button disabled={loading} onClick={() => execute(formData)}>
 *   {loading ? "A guardar…" : "Guardar"}
 * </button>
 * ```
 */

import { useCallback, useState } from "react";

export interface UseAsyncReturn<TArgs extends unknown[], TResult> {
  /** Execute the async function. Returns the result or undefined on error. */
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  /** True while the async function is running. */
  loading: boolean;
  /** Error thrown by the last execution, or null. */
  error: Error | null;
  /** Reset error and loading state. */
  reset: () => void;
}

/**
 * Wraps an async (or sync) function and tracks its loading/error state.
 *
 * @param asyncFn - The function to execute. May be async or sync.
 * @returns `{ execute, loading, error, reset }`
 */
export function useAsync<TArgs extends unknown[], TResult>(
  asyncFn: (...args: TArgs) => Promise<TResult> | TResult,
): UseAsyncReturn<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await Promise.resolve(asyncFn(...args));
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return undefined;
      } finally {
        setLoading(false);
      }
    },

    [asyncFn],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { execute, loading, error, reset };
}
