import { useCallback, useEffect, useState } from "react";
import { useRestaurantId } from "../../../ui/hooks/useRestaurantId";
import type { TimeRange } from "../reportTypes";
import {
  getGamificationImpactReport,
  type GamificationImpactInput,
} from "../ReportsService";

export interface UseGamificationImpactState {
  loading: boolean;
  error: string | null;
  data: Awaited<ReturnType<typeof getGamificationImpactReport>> | null;
  reload: () => void;
}

export function useGamificationImpactReport(
  windows: { id: string; label: string; period: TimeRange }[],
  globalPeriod: TimeRange,
): UseGamificationImpactState {
  const { restaurantId } = useRestaurantId();
  const [data, setData] =
    useState<Awaited<ReturnType<typeof getGamificationImpactReport>> | null>(
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
        const input: GamificationImpactInput = {
          windows,
          context: {
            restaurantId,
            currency: 'EUR',
            period: globalPeriod,
          },
        };
        const result = await getGamificationImpactReport(restaurantId, input);
        if (!cancelled) {
          setData(result);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Erro ao carregar impacto da gamificação.';
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
  }, [restaurantId, JSON.stringify(windows), globalPeriod.from, globalPeriod.to, token]);

  return { data, loading, error, reload };
}

