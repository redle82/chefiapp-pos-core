/**
 * ShiftReader — Leituras de turnos (shift_logs) com dados de staff (gm_staff).
 */
// @ts-nocheck


import { dockerCoreClient } from "../docker-core/connection";

export interface ActiveShiftRow {
  id: string;
  restaurant_id: string;
  employee_id: string;
  role: string;
  start_time: string;
  employees?: { name: string } | null;
}

/**
 * Turnos ativos do restaurante (shift_logs com status = 'active').
 * Tenta join com gm_staff para employee name; fallback sem nome.
 */
export async function readActiveShifts(
  restaurantId: string
): Promise<ActiveShiftRow[]> {
  const { data, error } = await dockerCoreClient
    .from("shift_logs")
    .select("id, restaurant_id, employee_id, role, start_time")
    .eq("restaurant_id", restaurantId)
    .eq("status", "active")
    .order("start_time", { ascending: false });
  if (error) return [];
  const rows = (data ?? []) as ActiveShiftRow[];
  if (rows.length === 0) return [];
  const staffIds = [...new Set(rows.map((r) => r.employee_id))];
  const staffMap = new Map<string, string>();
  for (const id of staffIds) {
    const { data: staff } = await dockerCoreClient
      .from("gm_staff")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    if (staff && typeof staff === "object" && "name" in staff)
      staffMap.set(id, (staff as { name: string }).name);
  }
  return rows.map((r) => ({
    ...r,
    employees: staffMap.has(r.employee_id)
      ? { name: staffMap.get(r.employee_id)! }
      : null,
  }));
}
