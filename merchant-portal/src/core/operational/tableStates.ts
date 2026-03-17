/**
 * Table States — Fonte de verdade para estados canónicos da mesa.
 *
 * Partilhado por: TableContext, TableWriter, TableMapPanel, Waiter/types.
 * DB: gm_tables.status (TEXT, sem CHECK — validação é frontend-only).
 */

export const TABLE_STATES = {
  FREE: "free",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  IN_PREP: "in_prep",
  READY_TO_SERVE: "ready_to_serve",
  BILL_REQUESTED: "bill_requested",
  CLEANING: "cleaning",
  BLOCKED: "blocked",
} as const;

export type TableStatus = (typeof TABLE_STATES)[keyof typeof TABLE_STATES];

/** i18n keys for UI labels — resolve via t(`tableStates.${status}`) in components. */
export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  free: "tableStates.free",
  reserved: "tableStates.reserved",
  occupied: "tableStates.occupied",
  in_prep: "tableStates.in_prep",
  ready_to_serve: "tableStates.ready_to_serve",
  bill_requested: "tableStates.bill_requested",
  cleaning: "tableStates.cleaning",
  blocked: "tableStates.blocked",
};

/** Cores por estado — visualmente distintas num fundo escuro. */
export const TABLE_STATE_COLORS: Record<TableStatus, string> = {
  free: "#22c55e",           // verde
  reserved: "#8b5cf6",       // violeta
  occupied: "#f97316",       // laranja
  in_prep: "#f59e0b",        // âmbar
  ready_to_serve: "#3b82f6", // azul
  bill_requested: "#ec4899", // rosa
  cleaning: "#6b7280",       // cinza
  blocked: "#525252",        // cinza escuro
};

/** Verifica se um valor é um TableStatus válido. */
export function isValidTableStatus(value: string): value is TableStatus {
  return Object.values(TABLE_STATES).includes(value as TableStatus);
}

/** Normaliza valores legacy do DB para TableStatus. */
export function normalizeTableStatus(dbValue: string): TableStatus {
  if (dbValue === "closed") return TABLE_STATES.FREE;
  if (isValidTableStatus(dbValue)) return dbValue;
  return TABLE_STATES.FREE;
}
