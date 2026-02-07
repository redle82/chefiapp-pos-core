import { useCallback, useEffect, useState } from "react";
import { useRestaurantId } from "../../hooks/useRestaurantId";
import type { TimeRange } from "../reportTypes";
import { getSalesSummaryReport } from "../ReportsService";

export interface UseSalesSummaryState {
  loading: boolean;
  error: string | null;
  data: Awaited<ReturnType<typeof getSalesSummaryReport>> | null;
  reload: () => void;
}

export function useSalesSummaryReport(period: TimeRange): UseSalesSummaryState {
  const { restaurantId } = useRestaurantId();
  const [data, setData] =
    useState<Awaited<ReturnType<typeof getSalesSummaryReport>> | null>(null);
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
        const result = await getSalesSummaryReport(restaurantId, period);
        if (!cancelled) {
          setData(result);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Erro ao carregar resumo de vendas.';
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

