import { useCallback, useEffect, useState } from "react";
import { getOverviewSafe } from "../services/dashboardService";
import type { DashboardOverview } from "../types";

interface DashboardOverviewState {
  data: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDashboardOverview(
  locationId: string | null | undefined,
): DashboardOverviewState {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!locationId || locationId.trim().length === 0) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getOverviewSafe(locationId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locationId, reloadToken]);

  return { data, loading, error, reload };
}
