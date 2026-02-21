/**
 * RitualTask types — Task System ritual (Antes de abrir, Gerente).
 *
 * Distinto de Task (StaffCoreTypes) e CoreTask (gm_tasks).
 * Contrato: TASK_SYSTEM_MATRIX_AND_RITUAL.md, CHEFIAPP_PRODUCT_DOCTRINE.md.
 */

export type RitualRole = "manager";

export type RitualMoment = "before_open";

export type RitualTaskType = "mandatory";

export type RitualTaskStatus = "pending" | "done";

export interface RitualTask {
  id: string;
  role: RitualRole;
  moment: RitualMoment;
  type: RitualTaskType;
  status: RitualTaskStatus;
  dueAt?: string;
  key: string;
  label: string;
}

/** Keys estáveis das tarefas do ritual "Antes de abrir" (Gerente). */
export const BEFORE_OPEN_TASK_KEYS = {
  VALIDAR_PRONTO: "validar_prontidao",
  ABRIR_TURNO: "abrir_turno",
} as const;

export const BEFORE_OPEN_TASK_LABELS: Record<(typeof BEFORE_OPEN_TASK_KEYS)[keyof typeof BEFORE_OPEN_TASK_KEYS], string> = {
  [BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO]: "Validar prontidão para vender",
  [BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO]: "Abrir turno",
};
