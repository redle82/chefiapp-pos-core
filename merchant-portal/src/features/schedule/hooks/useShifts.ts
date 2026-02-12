/**
 * useShifts - Hook para buscar turnos
 *
 * TODO: Integrar com Employee Time Engine
 * TODO: Conectar com Supabase
 * TODO: Implementar queries reais
 */

import { useEffect, useState } from "react";
import type { Shift } from "../../../types/schedule";

export function useShiftsByDate(restaurantId: string, date: string) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implementar query real
    // SELECT * FROM gm_shifts WHERE restaurant_id = $1 AND DATE(start_time) = $2
    setLoading(false);
  }, [restaurantId, date]);

  return { shifts, loading, error };
}

export function useCurrentShift(userId: string) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implementar query real
    // SELECT * FROM gm_shifts WHERE user_id = $1 AND start_time <= NOW() AND end_time >= NOW()
    setLoading(false);
  }, [userId]);

  return { shift, loading, error };
}
