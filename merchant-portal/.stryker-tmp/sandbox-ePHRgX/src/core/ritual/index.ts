/**
 * Ritual Task System — Antes de abrir (Gerente).
 *
 * Contrato: TASK_SYSTEM_MATRIX_AND_RITUAL.md, CHEFIAPP_PRODUCT_DOCTRINE.md.
 */
// @ts-nocheck


export {
  getBeforeOpenRitualTasks,
  isBeforeOpenRitualComplete,
  markRitualTaskDone,
} from "./ritualBeforeOpenStorage";
export type { RitualTask } from "./ritualTaskTypes";
export {
  BEFORE_OPEN_TASK_KEYS,
  BEFORE_OPEN_TASK_LABELS,
  type RitualMoment,
  type RitualRole,
  type RitualTaskStatus,
  type RitualTaskType,
} from "./ritualTaskTypes";
export { useBeforeOpenRitual } from "./useBeforeOpenRitual";
export type { UseBeforeOpenRitualResult } from "./useBeforeOpenRitual";
