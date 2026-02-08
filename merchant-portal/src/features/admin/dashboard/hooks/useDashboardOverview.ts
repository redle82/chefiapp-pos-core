import { useEffect, useState, useCallback } from "react";
import type { DashboardOverview } from "../types";
import { getOverview } from "../services/dashboardService";

interface DashboardOverviewState {
  data: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDashboardOverview(
  locationId: string
): DashboardOverviewState {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getOverview(locationId)
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

