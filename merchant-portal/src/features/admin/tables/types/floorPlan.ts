/**
 * Floor Plan types — shared by FloorPlanEditor and FloorPlanView.
 *
 * Layout data is stored per-table as JSON in `gm_tables.layout_data` (JSONB column)
 * or derived from existing pos_x / pos_y columns with sensible shape defaults.
 */

import type { TableStatus } from "../../../../core/operational/tableStates";

/* ------------------------------------------------------------------ */
/*  Table layout (persisted per table)                                 */
/* ------------------------------------------------------------------ */

export type TableShape = "round" | "square" | "rectangle" | "bar";

export interface TableLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: TableShape;
  rotation: number;
  zone: string;
}

/* ------------------------------------------------------------------ */
/*  Table with layout (runtime model)                                  */
/* ------------------------------------------------------------------ */

export interface FloorPlanTable {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  seatedAt: string | null;
  lastStateChangeAt: string | null;
  layout: TableLayout;
  /** Merged group: IDs of tables that are merged together */
  mergedWith?: string[];
}

/* ------------------------------------------------------------------ */
/*  Zone (floor / area)                                                */
/* ------------------------------------------------------------------ */

export interface FloorPlanZone {
  id: string;
  name: string;
  /** Sort order for tab display */
  order: number;
}

/* ------------------------------------------------------------------ */
/*  Shape defaults                                                     */
/* ------------------------------------------------------------------ */

export const SHAPE_DEFAULTS: Record<TableShape, { width: number; height: number; minSeats: number; maxSeats: number }> = {
  round:     { width: 80,  height: 80,  minSeats: 2, maxSeats: 4 },
  square:    { width: 80,  height: 80,  minSeats: 4, maxSeats: 4 },
  rectangle: { width: 120, height: 70,  minSeats: 6, maxSeats: 8 },
  bar:       { width: 40,  height: 40,  minSeats: 1, maxSeats: 1 },
};

/** Grid snap size in pixels */
export const GRID_SIZE = 20;

/** Snap a value to the nearest grid point */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/** Default layout for a newly placed table */
export function defaultLayout(shape: TableShape, x: number, y: number, zone: string): TableLayout {
  const def = SHAPE_DEFAULTS[shape];
  return {
    x: snapToGrid(x),
    y: snapToGrid(y),
    width: def.width,
    height: def.height,
    shape,
    rotation: 0,
    zone,
  };
}
