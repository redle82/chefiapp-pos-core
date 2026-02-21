// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { useRestaurantId } from "../../../ui/hooks/useRestaurantId";
import type { TimeRange } from "../reportTypes";
import { getOperationalActivityReport } from "../ReportsService";

export interface UseOperationalActivityState {
  loading: boolean;
  error: string | null;
  data: Awaited<ReturnType<typeof getOperationalActivityReport>> | null;
  reload: () => void;
}

export function useOperationalActivityReport(
  period: TimeRange,
): UseOperationalActivityState {
  const { restaurantId } = useRestaurantId();
  const [data, setData] =
    useState<Awaited<ReturnType<typeof getOperationalActivityReport>> | null>(
      null,
    );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const reload = useCallback(() => {
    setToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setData(null);
      setError(null);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getOperationalActivityReport(restaurantId, period);
        if (!cancelled) {
          setData(result);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Erro ao carregar atividade da operação.';
          setError(msg);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, period.from, period.to, token]);

  return { data, loading, error, reload };
}

