/**
 * Hook: ritual "Antes de abrir" (Gerente).
 *
 * Expõe tarefas, markDone e isComplete. Usa shift para derivar "abrir turno" done.
 */
// @ts-nocheck


import { useCallback, useMemo, useState } from "react";
import { useContext } from "react";
import { ShiftContext } from "../shift/ShiftContext";
import {
  getBeforeOpenRitualTasks,
  isBeforeOpenRitualComplete,
  markRitualTaskDone,
} from "./ritualBeforeOpenStorage";
import type { RitualTask } from "./ritualTaskTypes";

export interface UseBeforeOpenRitualResult {
  tasks: RitualTask[];
  markDone: (key: string) => void;
  isComplete: boolean;
  refresh: () => void;
}

export function useBeforeOpenRitual(
  restaurantId: string | null
): UseBeforeOpenRitualResult {
  const shift = useContext(ShiftContext);
  const isShiftOpen = shift?.isShiftOpen ?? false;

  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const tasks = useMemo(
    () =>
      restaurantId
        ? getBeforeOpenRitualTasks(restaurantId, isShiftOpen)
        : [],
    [restaurantId, isShiftOpen, version]
  );

  const markDone = useCallback(
    (key: string) => {
      if (!restaurantId) return;
      markRitualTaskDone(restaurantId, key);
      setVersion((v) => v + 1);
    },
    [restaurantId]
  );

  const isComplete =
    !!restaurantId &&
    isBeforeOpenRitualComplete(restaurantId, isShiftOpen);

  return { tasks, markDone, isComplete, refresh };
}
