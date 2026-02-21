/**
 * Ritual "Antes de abrir" — persistência local (trial/pilot).
 *
 * Chave: chefiapp_ritual_tasks_${restaurantId}.
 * A tarefa "abrir turno" é considerada feita se o turno estiver aberto (evita duplicar lógica).
 */
// @ts-nocheck


import type { RitualTask } from "./ritualTaskTypes";
import {
  BEFORE_OPEN_TASK_KEYS,
  BEFORE_OPEN_TASK_LABELS,
  type RitualTaskStatus,
} from "./ritualTaskTypes";

const STORAGE_PREFIX = "chefiapp_ritual_tasks_";

function storageKey(restaurantId: string): string {
  return `${STORAGE_PREFIX}${restaurantId}`;
}

/** Estrutura persistida: status por key. */
interface StoredRitualState {
  [key: string]: RitualTaskStatus;
}

function loadStored(restaurantId: string): StoredRitualState {
  if (typeof window === "undefined" || !restaurantId) return {};
  try {
    const raw = localStorage.getItem(storageKey(restaurantId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredRitualState;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveStored(restaurantId: string, state: StoredRitualState): void {
  if (typeof window === "undefined" || !restaurantId) return;
  try {
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

const SEED_KEYS = [
  BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO,
  BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO,
] as const;

function seedIfEmpty(
  restaurantId: string,
  state: StoredRitualState,
): StoredRitualState {
  let changed = false;
  const next = { ...state };
  for (const key of SEED_KEYS) {
    if (next[key] === undefined) {
      next[key] = "pending";
      changed = true;
    }
  }
  if (changed) saveStored(restaurantId, next);
  return next;
}

function taskFromKey(
  key: string,
  status: RitualTaskStatus,
  index: number,
): RitualTask {
  const label =
    BEFORE_OPEN_TASK_LABELS[key as keyof typeof BEFORE_OPEN_TASK_LABELS] ?? key;
  return {
    id: `ritual-before_open-${key}-${index}`,
    role: "manager",
    moment: "before_open",
    type: "mandatory",
    status,
    key,
    label,
  };
}

/**
 * Devolve as 2 tarefas do ritual "Antes de abrir" (Gerente).
 * A tarefa "abrir turno" tem status 'done' se isShiftOpen for true.
 */
export function getBeforeOpenRitualTasks(
  restaurantId: string,
  isShiftOpen?: boolean,
): RitualTask[] {
  if (!restaurantId) return [];
  let state = loadStored(restaurantId);
  state = seedIfEmpty(restaurantId, state);

  const tasks: RitualTask[] = SEED_KEYS.map((key, i) => {
    let status: RitualTaskStatus = state[key] ?? "pending";
    if (key === BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO && isShiftOpen) {
      status = "done";
    }
    return taskFromKey(key, status, i);
  });
  return tasks;
}

/**
 * Marca uma tarefa do ritual como concluída e persiste.
 */
export function markRitualTaskDone(restaurantId: string, key: string): void {
  if (!restaurantId || !key) return;
  const state = loadStored(restaurantId);
  state[key] = "done";
  saveStored(restaurantId, state);
}

/**
 * Ritual "Antes de abrir" está completo quando:
 * - "Validar prontidão" está done; e
 * - "Abrir turno" está done OU o turno já está aberto (isShiftOpen).
 */
export function isBeforeOpenRitualComplete(
  restaurantId: string,
  isShiftOpen?: boolean,
): boolean {
  if (!restaurantId) return false;
  const tasks = getBeforeOpenRitualTasks(restaurantId, isShiftOpen);
  const allDone = tasks.every((t) => t.status === "done");
  return allDone;
}
