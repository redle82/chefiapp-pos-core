/**
 * useHealthScore - Hook para health score baseado em tarefas
 *
 * LOOP MÍNIMO: Expõe score simples calculado a partir de tarefas críticas.
 * Funciona em DEV_STABLE_MODE com fallbacks seguros.
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { healthEngine } from "./HealthEngine";

export interface SimpleHealthScore {
  score: number; // 0-100
  status: "healthy" | "degraded" | "critical";
  criticalTasks: number;
  highTasks: number;
  totalOpenTasks: number;
}

export function useHealthScore(restaurantId: string | null) {
  const [healthScore, setHealthScore] = useState<SimpleHealthScore | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const { runtime } = useRestaurantRuntime();

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // Fail-fast: não dispara requests quando o Core está em baixo ou runtime ainda está a carregar.
    if (runtime.loading || !runtime.coreReachable) {
      setLoading(false);
      return;
    }

    const calculateScore = async () => {
      try {
        setLoading(true);
        const score = await healthEngine.calculateSimpleHealthScore(
          restaurantId
        );
        setHealthScore(score);
      } catch (error) {
        console.error("[useHealthScore] Erro ao calcular score:", error);
        // Fallback seguro
        setHealthScore({
          score: 85,
          status: "healthy",
          criticalTasks: 0,
          highTasks: 0,
          totalOpenTasks: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    calculateScore();

    // Atualizar score a cada 30 segundos enquanto o Core estiver alcançável
    const interval = setInterval(calculateScore, 30000);

    return () => clearInterval(interval);
  }, [restaurantId, runtime.loading, runtime.coreReachable]);

  return { healthScore, loading };
}
